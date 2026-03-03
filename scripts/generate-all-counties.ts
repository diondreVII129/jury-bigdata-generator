import { generateJuryPool, GenerationResult } from '../src/master_prompt_2';
import { getAllCountyNames, closePool } from '../src/database';

/**
 * Generate jurors for all 46 SC counties sequentially.
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('SOUTH CAROLINA JURY POOL GENERATOR - ALL COUNTIES');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const counties = await getAllCountyNames();
  console.log(`\nFound ${counties.length} counties to process.\n`);

  const results: GenerationResult[] = [];
  const errors: { county: string; error: string }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < counties.length; i++) {
    const county = counties[i];
    const progress = `[${i + 1}/${counties.length}]`;

    console.log(`\n${'#'.repeat(60)}`);
    console.log(`${progress} Processing: ${county} County`);
    console.log('#'.repeat(60));

    try {
      const result = await generateJuryPool({ countyName: county });
      results.push(result);

      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const avgPerCounty = (Date.now() - startTime) / (i + 1) / 1000 / 60;
      const remaining = (avgPerCounty * (counties.length - i - 1)).toFixed(1);

      console.log(`\n${progress} ${county} COMPLETE - ${result.totalJurors} jurors | Validation: ${result.validation.passed ? 'PASS' : 'FAIL'}`);
      console.log(`${progress} Elapsed: ${elapsed}min | Est. remaining: ${remaining}min`);
    } catch (error) {
      const msg = (error as Error).message;
      console.error(`\n${progress} ${county} FAILED: ${msg}`);
      errors.push({ county, error: msg });
    }
  }

  // Final summary
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const totalJurors = results.reduce((sum, r) => sum + r.totalJurors, 0);
  const passed = results.filter((r) => r.validation.passed).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log('GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total counties processed: ${results.length}/${counties.length}`);
  console.log(`Total jurors generated: ${totalJurors.toLocaleString()}`);
  console.log(`Validation pass rate: ${passed}/${results.length} (${((passed / Math.max(results.length, 1)) * 100).toFixed(1)}%)`);
  console.log(`Total duration: ${totalDuration} minutes`);
  console.log(`Completed: ${new Date().toISOString()}`);

  if (errors.length > 0) {
    console.log(`\nFailed counties (${errors.length}):`);
    errors.forEach((e) => console.log(`  - ${e.county}: ${e.error}`));
  }

  console.log('\nPer-county results:');
  results.forEach((r) => {
    console.log(`  ${r.county.padEnd(15)} ${String(r.totalJurors).padStart(5)} jurors  ${r.validation.passed ? 'PASS' : 'FAIL'}`);
  });

  await closePool();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
