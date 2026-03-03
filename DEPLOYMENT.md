# Deployment Guide - Railway

## Prerequisites

1. A [Railway](https://railway.app) account
2. An [Anthropic](https://console.anthropic.com/) API key
3. A PostgreSQL database (Railway Postgres or [Supabase](https://supabase.com))

## Step 1: Set Up PostgreSQL

### Option A: Railway Postgres

1. In your Railway project, click **New** > **Database** > **PostgreSQL**
2. Click the database service, go to **Connect** tab
3. Copy the **DATABASE_URL** (PostgreSQL connection string)

### Option B: Supabase (Recommended for persistence)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings** > **Database**
3. Copy the **Connection string (URI)** under "Connection Pooling"
4. Replace `[YOUR-PASSWORD]` with your database password
5. Format: `postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## Step 2: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to **API Keys**
3. Click **Create Key**
4. Copy the key (starts with `sk-ant-api03-`)

## Step 3: Push to GitHub

```bash
cd jury-bigdata-generator
git init
git add .
git commit -m "Initial commit - jury bigdata generator"
gh repo create jury-bigdata-generator --public --source=. --remote=origin --push
```

## Step 4: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your `jury-bigdata-generator` repository
5. Railway will detect the project and start building

## Step 5: Configure Environment Variables

In your Railway service:

1. Click on the service
2. Go to **Variables** tab
3. Add the following variables:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-your-key-here` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` (optional) |
| `JURORS_PER_COUNTY` | `1200` (optional) |

## Step 6: Initialize Database

Before running the generator, you need to set up the database schema:

1. In Railway, go to your service
2. Click **Settings** > **Deploy** section
3. Set the start command to: `npm run setup && npm run generate-all`
4. Click **Deploy**

Or run setup locally first:
```bash
# Set DATABASE_URL to your remote database
export DATABASE_URL="your-connection-string"
npm run setup
```

## Step 7: Monitor Progress

1. In Railway, click on your service
2. Go to the **Deployments** tab
3. Click on the active deployment
4. View **Logs** to see real-time progress

You'll see output like:
```
[1/46] Processing: Abbeville County
--- Batch 1/12 (100 jurors) ---
  Calling Claude API...
  Tokens: 3200 in / 78000 out
  Parsed 100 juror objects
  Inserted 100/100 jurors into database
...
[1/46] Abbeville COMPLETE - 1200 jurors | Validation: PASS
```

## Expected Timeline

- **Per county**: ~10-15 minutes (12 API calls with rate limiting)
- **All 46 counties**: ~8-12 hours
- **Total jurors**: 55,200

## Expected Costs

### Anthropic API
- Using Claude Sonnet: ~$50-80 total
- Using Claude Haiku: ~$10-20 total (faster, less detailed biographies)

### Railway
- Compute: ~$1-2 for the generation run
- Database (if using Railway Postgres): $5/month

### Supabase
- Free tier: 500MB database (sufficient for this project)
- Pro: $25/month for larger datasets

## Troubleshooting

### Build fails
- Ensure `package.json` and `tsconfig.json` are committed
- Check Railway build logs for missing dependencies

### Database connection fails
- Verify DATABASE_URL format
- For Supabase: ensure you're using the pooled connection string (port 6543)
- For Railway Postgres: use the internal URL if both services are in the same project

### API rate limits
- The generator includes exponential backoff retry logic
- If persistent, reduce batch frequency by increasing `rateLimitDelayMs` in config

### Deployment times out
- Railway has a 7-day maximum deployment time
- For 46 counties, this is well within limits
- If a deployment restarts, the generator will create new jurors (existing ones are preserved)

### Partial data
- Re-run specific counties: modify the start command to target specific counties
- Use `npm run verify` to check which counties are complete
