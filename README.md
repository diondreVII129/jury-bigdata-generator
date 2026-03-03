# Jury Big Data Generator

Generates 55,200 synthetic jurors (1,200 per county) for all 46 South Carolina counties using the Anthropic Claude API. Each juror includes realistic demographics matched to US Census ACS 2021 data, psychographic scoring based on trial psychology research, and a detailed 3-paragraph biography.

## Features

- **Demographically accurate**: Race, age, education, income, and occupation distributions match census data within ±2%
- **Psychographic profiling**: 9 scoring dimensions based on Randy Hood's trial psychology framework
- **Realistic biographies**: 3-paragraph narratives specific to each county with local details
- **Batch processing**: Generates jurors in batches of 100 with rate limiting and retry logic
- **Validation**: Automated demographic validation against census targets
- **PostgreSQL storage**: All data stored in a structured, indexed database

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted, e.g., Supabase)
- Anthropic API key

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd jury-bigdata-generator
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/jury_generator
```

### 3. Set up database

```bash
# Create the database first (if local)
createdb jury_generator

# Run schema and seed data
npm run setup
```

### 4. Generate jurors

```bash
# Test with one county
npm run generate Georgetown

# Generate all 46 counties (takes several hours)
npm run generate-all
```

### 5. Verify results

```bash
# Summary of all counties
npm run verify

# Detailed validation for one county
npm run verify Georgetown
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | - | Supabase project URL (used by API server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase service role key (used by API server) |
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (used by generation scripts) |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-20250514` | Claude model to use |
| `JURORS_PER_COUNTY` | No | `1200` | Jurors to generate per county |

## Project Structure

```
jury-bigdata-generator/
├── database/
│   ├── schema.sql          # Table definitions and indexes
│   └── seed-census.sql     # Census data for 46 SC counties
├── server.js                  # Express API server
├── Procfile                   # Railway deployment
├── src/
│   ├── config.ts              # Environment configuration
│   ├── database.ts            # PostgreSQL connection and queries
│   ├── claude.ts              # Anthropic API client with retries
│   ├── helpers.ts             # JSON parsing, utilities
│   ├── validation.ts          # Demographic validation
│   ├── master_prompt_1.ts     # Venue analysis generation
│   └── master_prompt_2.ts     # Core juror generation logic
├── scripts/
│   ├── setup-database.ts   # Database initialization
│   ├── generate-county.ts  # Single county generation
│   ├── generate-all-counties.ts  # All counties
│   └── verify-generation.ts     # Verification report
└── deploy/railway/         # Railway deployment config
```

## Database Schema

**sc_county_demographics**: Census data for each county including population, race, education, income, top industries, urbanization, and political lean.

**synthetic_jurors**: Generated juror profiles with demographics, psychographic scores (plaintiff_bias, authority_deference, emotional_susceptibility, reptile_susceptibility, corporate_trust, medical_deference), deliberation style, and biography.

## Psychographic Dimensions

| Dimension | Range | Description |
|---|---|---|
| plaintiff_bias | -1.0 to 1.0 | Tendency to favor plaintiff vs. defense |
| authority_deference | 0.0 to 1.0 | Respect for institutional authority |
| emotional_susceptibility | 0.0 to 1.0 | Emotional influence on decisions |
| reptile_susceptibility | 0.0 to 1.0 | Vulnerability to safety/danger arguments |
| corporate_trust | 0.0 to 1.0 | Trust in corporations |
| medical_deference | 0.0 to 1.0 | Deference to medical professionals |
| award_tendency | Category | Conservative/Moderate/Liberal/Very Liberal |
| deliberation_style | Category | Leader/Follower/Analytical/Emotional/etc. |
| personality_type | Category | Authoritarian/Egalitarian/Libertarian/etc. |

## API Server

The project includes an Express.js API server for serving jury data to frontend applications (e.g., Lovable).

### Start the server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

The server runs on `http://localhost:3000` by default. Set the `PORT` environment variable to change it.

### API Endpoints

#### GET /health

Health check endpoint.

```bash
curl http://localhost:3000/health
```

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Response (503):** Database unreachable.

---

#### GET /api/counties?state={state}

List all counties with juror counts and demographics.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `state`   | No       | SC      | State code (only SC supported) |

```bash
curl "http://localhost:3000/api/counties?state=SC"
```

**Response (200):**
```json
{
  "success": true,
  "state": "SC",
  "total_counties": 46,
  "total_jurors": 55200,
  "counties": [
    {
      "name": "Georgetown",
      "juror_count": 1200,
      "population": 63404,
      "median_age": 48.2,
      "demographics": {
        "pct_white": 63.8,
        "pct_black": 31.2
      }
    }
  ]
}
```

---

#### GET /api/jurors?county={county}&state={state}&limit={limit}

Get juror profiles for a county. Returns a random sample if limit < total available.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `county`  | Yes      | -       | County name (e.g., Georgetown) |
| `state`   | No       | SC      | State code (only SC supported) |
| `limit`   | No       | 1200    | Max jurors to return (1-1200) |

```bash
# Get 5 random jurors
curl "http://localhost:3000/api/jurors?county=Georgetown&state=SC&limit=5"

# Get all jurors for a county
curl "http://localhost:3000/api/jurors?county=Georgetown&state=SC"
```

**Response (200):**
```json
{
  "success": true,
  "county": "Georgetown",
  "state": "SC",
  "count": 5,
  "total_available": 1200,
  "jurors": [
    {
      "juror_id": "georgetown_1_abc12345",
      "first_name": "James",
      "last_name": "Mitchell",
      "age": 52,
      "age_bracket": "45-54",
      "gender": "Male",
      "race": "White",
      "geographic_segment": "Suburban",
      "education": "HS Diploma/GED",
      "occupation": "Construction/Trades",
      "healthcare_connection": null,
      "household_income": 48000,
      "homeownership": "Own",
      "marital_status": "Married",
      "number_of_children": 2,
      "political_registration": "Republican",
      "vote_2024": "Trump",
      "religion": "Southern Baptist",
      "church_attendance": "Weekly or more",
      "veteran": "No",
      "primary_news_source": "Fox News",
      "litigation_history": null,
      "tort_reform_attitude": 7.2,
      "authority_deference": 6.8,
      "healthcare_trust": 5.9,
      "damages_receptivity": 3.4,
      "plaintiff_composite_score": 3.7,
      "juror_archetype": "Lean Defense"
    }
  ]
}
```

| Error | Status | Description |
|-------|--------|-------------|
| Missing county | 400 | `county` parameter is required |
| Invalid limit | 400 | `limit` must be a positive integer |
| County not found | 404 | No jurors exist for the given county |

---

#### GET /api/venue-analysis?county={county}&state={state}

AI-powered venue analysis for a county. Calls the Anthropic Claude API to generate a plaintiff-focused strategic assessment. Requires `ANTHROPIC_API_KEY` in .env.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `county`  | Yes      | -       | County name (e.g., Georgetown) |
| `state`   | No       | SC      | State code (only SC supported) |

```bash
curl "http://localhost:3000/api/venue-analysis?county=Georgetown&state=SC"
```

**Response (200):**
```json
{
  "success": true,
  "county": "Georgetown",
  "state": "SC",
  "venue_analysis": {
    "plaintiff_favorability_score": 68,
    "key_demographic_advantages": [
      "Higher poverty rate increases juror empathy for plaintiffs",
      "Significant Black population historically more plaintiff-friendly",
      "Blue collar workforce empathizes with individuals harmed by institutions"
    ],
    "key_demographic_disadvantages": [
      "Conservative political lean favors tort reform",
      "High evangelical percentage correlates with personal responsibility mindset"
    ],
    "venue_strategy_summary": "Georgetown County presents a moderately favorable venue for plaintiff...",
    "jury_composition_recommendations": {
      "ideal_juror_profile": "Working-class, younger, minority jurors with lower income...",
      "jurors_to_avoid": "Affluent, older, white-collar professionals with strong religious ties...",
      "voir_dire_focus_areas": [
        "Attitudes toward corporate accountability",
        "Personal or family medical experiences",
        "Views on lawsuit abuse and tort reform"
      ]
    }
  }
}
```

| Error | Status | Description |
|-------|--------|-------------|
| Missing county | 400 | `county` parameter is required |
| County not found | 404 | County not in demographics database |
| Missing API key | 500 | `ANTHROPIC_API_KEY` not configured |
| Generation error | 500 | Claude API call failed |

---

### Railway Deployment

1. **Push to GitHub**
   ```bash
   git add -A && git commit -m "Add API server"
   git push origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app) and connect your GitHub repo

3. **Set environment variables** in Railway dashboard:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
   - `ANTHROPIC_API_KEY` — your Anthropic key (required for venue analysis)
   - `PORT` — Railway sets this automatically

4. **Deploy** — Railway detects the `Procfile` and runs `node server.js`

5. **Copy the Railway URL** (e.g., `https://jury-api-production.up.railway.app`) for use in your Lovable frontend

## Cost Estimate

- ~1,200 jurors per county × 46 counties = 55,200 jurors
- Each batch of 100 jurors uses ~3,000 input tokens and ~80,000 output tokens
- 12 batches per county × 46 counties = 552 API calls
- Estimated total cost: $50-100 depending on model used

## Railway Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Railway deployment instructions.

## Troubleshooting

- **Connection refused**: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for API server) or DATABASE_URL (for generation scripts)
- **API key invalid**: Verify ANTHROPIC_API_KEY in .env
- **JSON parse errors**: These are handled automatically with retry logic
- **Rate limits**: Built-in exponential backoff handles rate limiting
- **Partial generation**: Re-run `npm run generate <County>` to regenerate a specific county
