import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { generateJuryPool } from '../src/master_prompt_2';
import { query, closePool } from '../src/database';

/**
 * Top-up script: checks how many jurors a county has and generates
 * only the missing ones to reach the target (default 1200).
 * Usage: tsx scripts/topup-county.ts <CountyName> [target]
 */
async function main(): Promise<void> {
  const countyName = process.argv[2];
  const target = parseInt(process.argv[3] || '1200', 10);

  if (!countyName) {
    console.error('Usage: tsx scripts/topup-county.ts <CountyName> [target]');
    process.exit(1);
  }

  // Check current count
  const result = await query(
    'SELECT COUNT(*) as count FROM synthetic_jurors WHERE county_name = $1',
    [countyName]
  );
  const currentCount = parseInt(result.rows[0].count, 10);
  const needed = target - currentCount;

  console.log(`${countyName} County: ${currentCount} jurors in DB, target ${target}`);

  if (needed <= 0) {
    console.log(`Already at or above target. No top-up needed.`);
    await closePool();
    return;
  }

  console.log(`Generating ${needed} additional jurors...`);

  const topupResult = await generateJuryPool({
    countyName,
    totalJurors: needed,
  });

  console.log(`\nTop-up complete: generated ${topupResult.totalJurors} jurors`);

  // Verify final count
  const finalResult = await query(
    'SELECT COUNT(*) as count FROM synthetic_jurors WHERE county_name = $1',
    [countyName]
  );
  console.log(`Final count for ${countyName}: ${finalResult.rows[0].count} jurors`);

  await closePool();
}

main().catch((error) => {
  console.error('Top-up failed:', error);
  process.exit(1);
});
