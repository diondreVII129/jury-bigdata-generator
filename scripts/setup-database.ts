import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load env directly - don't import config.ts since it requires ANTHROPIC_API_KEY
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Setup the database by running schema.sql and seed-census.sql.
 * Only requires DATABASE_URL to be set.
 */
async function main(): Promise<void> {
  console.log('=== Database Setup ===\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: Missing DATABASE_URL in .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase') || databaseUrl.includes('railway')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  // Test connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`Connected to database at ${res.rows[0].now}`);
  } catch (error) {
    console.error('Failed to connect to database:', (error as Error).message);
    console.error('Check your DATABASE_URL in .env');
    await pool.end();
    process.exit(1);
  }

  // Run schema.sql
  const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
  console.log(`\nRunning schema: ${schemaPath}`);
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schemaSql);
    console.log('Schema created successfully.');
  } catch (error) {
    console.error('Schema creation failed:', (error as Error).message);
    await pool.end();
    process.exit(1);
  }

  // Run seed-census.sql
  const seedPath = path.resolve(__dirname, '..', 'database', 'seed-census.sql');
  console.log(`\nRunning seed data: ${seedPath}`);
  try {
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    await pool.query(seedSql);
    console.log('Census data seeded successfully.');
  } catch (error) {
    console.error('Seed data insertion failed:', (error as Error).message);
    await pool.end();
    process.exit(1);
  }

  // Verify
  const countResult = await pool.query('SELECT COUNT(*) FROM sc_county_demographics');
  const countyCount = parseInt(countResult.rows[0].count, 10);
  console.log(`\nVerification: ${countyCount} counties loaded.`);

  if (countyCount !== 46) {
    console.warn(`WARNING: Expected 46 counties, got ${countyCount}`);
  }

  // List counties
  const counties = await pool.query('SELECT county_name FROM sc_county_demographics ORDER BY county_name');
  console.log('\nCounties loaded:');
  counties.rows.forEach((row: { county_name: string }, i: number) => {
    process.stdout.write(`  ${row.county_name.padEnd(15)}`);
    if ((i + 1) % 4 === 0) console.log('');
  });
  console.log('\n');

  await pool.end();
  console.log('Database setup complete!');
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
