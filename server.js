require('dotenv').config();

// Enable TypeScript imports (tsx must be in dependencies)
const { register } = require('tsx/cjs/api');
register();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// --- Database ---

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('supabase') ||
      process.env.DATABASE_URL.includes('railway'))
      ? { rejectUnauthorized: false }
      : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

async function dbQuery(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error(`Database query error: ${error.message}`);
    throw error;
  }
}

// --- Numeric field parser (matches src/database.ts) ---

const NUMERIC_FIELDS = [
  'median_age',
  'pct_white', 'pct_black', 'pct_hispanic', 'pct_asian',
  'pct_less_than_hs', 'pct_hs_graduate', 'pct_some_college',
  'pct_bachelors_degree', 'pct_graduate_degree',
  'pct_below_poverty', 'unemployment_rate',
  'pct_blue_collar', 'pct_white_collar', 'pct_service_industry',
  'top_industry_1_pct', 'top_industry_2_pct', 'top_industry_3_pct',
  'pct_homeowners', 'pct_renters',
  'pct_urban', 'pct_suburban', 'pct_rural',
  'pct_evangelical',
];

function parseNumericFields(row) {
  for (const field of NUMERIC_FIELDS) {
    if (row[field] != null) row[field] = parseFloat(row[field]);
  }
  const intFields = ['total_population', 'median_household_income', 'per_capita_income', 'median_home_value'];
  for (const field of intFields) {
    if (row[field] != null) row[field] = parseInt(row[field], 10);
  }
  return row;
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
    await pool.query('SELECT 1');
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
    // 1. Fetch census data
    const result = await dbQuery(
      'SELECT * FROM sc_county_demographics WHERE county_name = $1',
      [String(county)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `County "${county}" not found in database`,
      });
    }

    const demographics = parseNumericFields(result.rows[0]);

    // 2. Generate venue analysis via Claude (lazy import to avoid requiring API key at startup)
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
    // First get total count for this county
    const countResult = await dbQuery(
      'SELECT COUNT(*)::int AS total FROM synthetic_jurors WHERE county_name = $1',
      [String(county)]
    );
    const totalAvailable = countResult.rows[0]?.total || 0;

    if (totalAvailable === 0) {
      return res.status(404).json({
        success: false,
        error: `No jurors found for county "${county}"`,
      });
    }

    // If requesting fewer than available, use RANDOM() for a representative sample
    // Otherwise return all in juror_id order
    const orderClause = rowLimit < totalAvailable ? 'RANDOM()' : 'juror_number';

    const result = await dbQuery(
      `SELECT * FROM synthetic_jurors WHERE county_name = $1 ORDER BY ${orderClause} LIMIT $2`,
      [String(county), rowLimit]
    );

    res.json({
      success: true,
      county: String(county),
      state: 'SC',
      count: result.rows.length,
      total_available: totalAvailable,
      jurors: result.rows,
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
    const result = await dbQuery(`
      SELECT
        s.county_name,
        COUNT(*)::int AS juror_count,
        c.total_population,
        c.median_age,
        c.pct_white,
        c.pct_black
      FROM synthetic_jurors s
      LEFT JOIN sc_county_demographics c ON s.county_name = c.county_name
      GROUP BY s.county_name, c.total_population, c.median_age, c.pct_white, c.pct_black
      ORDER BY s.county_name
    `);

    const counties = result.rows.map((row) => ({
      name: row.county_name,
      juror_count: row.juror_count,
      population: row.total_population ? parseInt(row.total_population, 10) : null,
      median_age: row.median_age ? parseFloat(row.median_age) : null,
      demographics: {
        pct_white: row.pct_white ? parseFloat(row.pct_white) : null,
        pct_black: row.pct_black ? parseFloat(row.pct_black) : null,
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
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await pool.end();
  process.exit(0);
});
