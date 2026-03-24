import { generateJuryPool, GenerationResult } from '../src/master_prompt_2';
import { getAllCountyNames, query, closePool } from '../src/database';

/**
 * Railway worker regeneration script (RESUMABLE).
 * Checks each county's juror count — skips complete ones, regenerates the rest.
 * Safe to re-run if the process is interrupted.
 *
 * Deploy as a Railway worker service with restart policy: NEVER
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('RANDY v2.1 REGENERATION WORKER — ALL 46 SC COUNTIES');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Schema: 30 core fields + 6 computed psychographic fields = 36 total');
  console.log('Mode: RESUMABLE — skips counties with 1200+ jurors');
  console.log('='.repeat(60));

  const counties = await getAllCountyNames();

  // Check current state of each county
  const countResult = await query(
    `SELECT county_name, COUNT(*) as cnt FROM synthetic_jurors GROUP BY county_name`
  );
  const countMap = new Map<string, number>();
  for (const row of countResult.rows) {
    countMap.set(row.county_name, parseInt(row.cnt, 10));
  }

  const toGenerate: string[] = [];
  const skipped: string[] = [];

  for (const county of counties) {
    const count = countMap.get(county) || 0;
    if (count >= 1200) {
      skipped.push(county);
    } else {
      toGenerate.push(county);
    }
  }

  console.log(`\nCounty status: ${skipped.length} complete, ${toGenerate.length} need generation`);
  if (skipped.length > 0) {
    console.log(`Skipping (already complete): ${skipped.join(', ')}`);
  }
  if (toGenerate.length === 0) {
    console.log('\nAll 46 counties already have 1200+ jurors. Nothing to do.');
    await closePool();
    process.exit(0);
  }

  console.log(`\nGenerating ${toGenerate.length} counties (1,200 jurors each)`);
  console.log(`Expected new jurors: ${(toGenerate.length * 1200).toLocaleString()}\n`);

  const results: GenerationResult[] = [];
  const errors: { county: string; error: string }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < toGenerate.length; i++) {
    const county = toGenerate[i];
    const overallIdx = counties.indexOf(county) + 1;
    const progress = `[${i + 1}/${toGenerate.length}] (county ${overallIdx}/46)`;

    console.log(`\n${'#'.repeat(60)}`);
    console.log(`${progress} Processing: ${county} County`);
    console.log('#'.repeat(60));

    try {
      // Use fresh=true to clear any partial data for this county
      const result = await generateJuryPool({ countyName: county, fresh: true });
      results.push(result);

      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const avgPerCounty = (Date.now() - startTime) / (i + 1) / 1000 / 60;
      const remaining = (avgPerCounty * (toGenerate.length - i - 1)).toFixed(1);

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
  console.log('REGENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Counties skipped (already complete): ${skipped.length}`);
  console.log(`Counties processed this run: ${results.length}/${toGenerate.length}`);
  console.log(`Jurors generated this run: ${totalJurors.toLocaleString()}`);
  console.log(`Validation pass rate: ${passed}/${results.length} (${((passed / Math.max(results.length, 1)) * 100).toFixed(1)}%)`);
  console.log(`Duration: ${totalDuration} minutes (${(parseFloat(totalDuration) / 60).toFixed(1)} hours)`);
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

  if (errors.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
