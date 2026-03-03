require('dotenv').config();

// Enable TypeScript imports (tsx must be in dependencies)
const { register } = require('tsx/cjs/api');
register();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// --- Supabase Client ---

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers ---

/** Fisher-Yates shuffle (in-place) */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- App ---

const app = express();
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// --- Routes ---

// Health check
app.get('/health', async (_req, res) => {
  try {
    const { error } = await supabase
      .from('sc_county_demographics')
      .select('county_name')
      .limit(1);

    if (error) throw error;

    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// -------------------------------------------------------
// GET /api/venue-analysis?county={county}&state={state}
// -------------------------------------------------------
app.get('/api/venue-analysis', async (req, res) => {
  const { county, state } = req.query;

  if (!county) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: county',
    });
  }

  if (state && String(state).toUpperCase() !== 'SC') {
    return res.status(400).json({
      success: false,
      error: 'Only South Carolina (SC) data is currently available',
    });
  }

  try {
    const { data: demographics, error } = await supabase
      .from('sc_county_demographics')
      .select('*')
      .eq('county_name', String(county))
      .single();

    if (error || !demographics) {
      return res.status(404).json({
        success: false,
        error: `County "${county}" not found in database`,
      });
    }

    // Generate venue analysis via Claude (lazy import to avoid requiring API key at startup)
    const { generateVenueAnalysis } = require('./src/master_prompt_1');
    const venueAnalysis = await generateVenueAnalysis(demographics);

    res.json({
      success: true,
      county: String(county),
      state: 'SC',
      venue_analysis: venueAnalysis,
    });
  } catch (error) {
    console.error('Venue analysis error:', error.message);

    if (error.message && error.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'ANTHROPIC_API_KEY is not configured. Set it in .env to use venue analysis.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate venue analysis',
    });
  }
});

// -------------------------------------------------------
// GET /api/jurors?county={county}&state={state}&limit={limit}
// -------------------------------------------------------
app.get('/api/jurors', async (req, res) => {
  const { county, state, limit } = req.query;

  if (!county) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: county',
    });
  }

  if (state && String(state).toUpperCase() !== 'SC') {
    return res.status(400).json({
      success: false,
      error: 'Only South Carolina (SC) data is currently available',
    });
  }

  // Parse and validate limit
  const parsedLimit = parseInt(limit, 10);
  if (limit !== undefined && (isNaN(parsedLimit) || parsedLimit < 1)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid limit parameter. Must be a positive integer.',
    });
  }
  const rowLimit = Math.min(parsedLimit || 1200, 1200);

  try {
    // Get total count (head-only request, no rows returned)
    const { count: totalAvailable, error: countError } = await supabase
      .from('synthetic_jurors')
      .select('*', { count: 'exact', head: true })
      .eq('county_name', String(county));

    if (countError) throw countError;

    if (!totalAvailable || totalAvailable === 0) {
      return res.status(404).json({
        success: false,
        error: `No jurors found for county "${county}"`,
      });
    }

    let jurors;

    if (rowLimit < totalAvailable) {
      // Random sample: fetch all for county, shuffle in JS, take first N
      // Max ~1200 rows per county, so this is fine
      const { data, error } = await supabase
        .from('synthetic_jurors')
        .select('*')
        .eq('county_name', String(county))
        .order('juror_number')
        .range(0, totalAvailable - 1);

      if (error) throw error;
      jurors = shuffle(data).slice(0, rowLimit);
    } else {
      // Return all in order
      const { data, error } = await supabase
        .from('synthetic_jurors')
        .select('*')
        .eq('county_name', String(county))
        .order('juror_number')
        .range(0, rowLimit - 1);

      if (error) throw error;
      jurors = data;
    }

    res.json({
      success: true,
      county: String(county),
      state: 'SC',
      count: jurors.length,
      total_available: totalAvailable,
      jurors,
    });
  } catch (error) {
    console.error('Jurors query error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// -------------------------------------------------------
// GET /api/counties?state={state}
// -------------------------------------------------------
app.get('/api/counties', async (req, res) => {
  const { state } = req.query;

  if (state && String(state).toUpperCase() !== 'SC') {
    return res.status(400).json({
      success: false,
      error: 'Only South Carolina (SC) data is currently available',
    });
  }

  try {
    // 1. Get all county demographics
    const { data: demographics, error: demoError } = await supabase
      .from('sc_county_demographics')
      .select('county_name, total_population, median_age, pct_white, pct_black')
      .order('county_name');

    if (demoError) throw demoError;

    // 2. Get juror counts per county (parallel head-only count queries)
    const countResults = await Promise.all(
      demographics.map(async (d) => {
        const { count, error } = await supabase
          .from('synthetic_jurors')
          .select('*', { count: 'exact', head: true })
          .eq('county_name', d.county_name);

        return { county_name: d.county_name, juror_count: error ? 0 : (count || 0) };
      })
    );

    const countMap = {};
    for (const c of countResults) {
      countMap[c.county_name] = c.juror_count;
    }

    // 3. Merge
    const counties = demographics.map((row) => ({
      name: row.county_name,
      juror_count: countMap[row.county_name] || 0,
      population: row.total_population,
      median_age: row.median_age,
      demographics: {
        pct_white: row.pct_white,
        pct_black: row.pct_black,
      },
    }));

    const totalJurors = counties.reduce((sum, c) => sum + c.juror_count, 0);

    res.json({
      success: true,
      state: 'SC',
      total_counties: counties.length,
      total_jurors: totalJurors,
      counties,
    });
  } catch (error) {
    console.error('Counties query error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// --- Start ---

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Jury data API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});
