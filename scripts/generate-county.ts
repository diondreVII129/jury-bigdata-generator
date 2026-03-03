import { generateJuryPool } from '../src/master_prompt_2';
import { closePool } from '../src/database';

/**
 * CLI script to generate jurors for a single county.
 * Usage: tsx scripts/generate-county.ts <CountyName> [--fresh]
 * --fresh: Delete existing jurors for this county before generating
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const fresh = args.includes('--fresh');
  const countyName = args.find((a) => !a.startsWith('--'));

  if (!countyName) {
    console.error('Usage: tsx scripts/generate-county.ts <CountyName> [--fresh]');
    console.error('Example: tsx scripts/generate-county.ts Georgetown --fresh');
    process.exit(1);
  }

  console.log(`\nStarting juror generation for ${countyName} County, SC`);
  if (fresh) console.log('Mode: FRESH (deleting existing jurors first)');
  console.log(`Time: ${new Date().toISOString()}\n`);

  const startTime = Date.now();

  try {
    const result = await generateJuryPool({ countyName, fresh });
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`GENERATION COMPLETE`);
    console.log(`County: ${result.county}`);
    console.log(`Total jurors: ${result.totalJurors}`);
    console.log(`Validation: ${result.validation.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Duration: ${duration} minutes`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error(`\nFATAL ERROR:`, (error as Error).message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
