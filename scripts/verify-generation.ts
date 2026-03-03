import {
  getAllCountyNames,
  getJurorCountByCounty,
  getJurorsForCounty,
  getCountyDemographics,
  closePool,
} from '../src/database';
import { validateJuryDemographics, printValidation } from '../src/validation';

/**
 * Verify the generated juror data across all counties.
 * Checks counts and validates demographic accuracy.
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('JURY GENERATION VERIFICATION REPORT');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Get all counties and juror counts
  const counties = await getAllCountyNames();
  const counts = await getJurorCountByCounty();
  const countMap = new Map(counts.map((c) => [c.county_name, c.count]));

  console.log(`\nCounties in database: ${counties.length}`);
  console.log(`Counties with jurors: ${counts.length}`);

  // Summary table
  let totalJurors = 0;
  let countiesComplete = 0;
  let countiesPartial = 0;
  let countiesEmpty = 0;

  console.log('\n--- Juror Counts by County ---');
  console.log(`${'County'.padEnd(18)} ${'Count'.padStart(6)} ${'Status'.padStart(10)}`);
  console.log('-'.repeat(36));

  for (const county of counties) {
    const count = countMap.get(county) || 0;
    totalJurors += count;

    let status: string;
    if (count >= 1200) {
      status = 'COMPLETE';
      countiesComplete++;
    } else if (count > 0) {
      status = 'PARTIAL';
      countiesPartial++;
    } else {
      status = 'EMPTY';
      countiesEmpty++;
    }

    console.log(`${county.padEnd(18)} ${String(count).padStart(6)} ${status.padStart(10)}`);
  }

  console.log('-'.repeat(36));
  console.log(`${'TOTAL'.padEnd(18)} ${String(totalJurors).padStart(6)}`);
  console.log(`\nComplete: ${countiesComplete} | Partial: ${countiesPartial} | Empty: ${countiesEmpty}`);

  // Detailed validation for counties with data
  const detailedCounty = process.argv[2];
  if (detailedCounty) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`DETAILED VALIDATION: ${detailedCounty} County`);
    console.log('='.repeat(60));

    const census = await getCountyDemographics(detailedCounty);
    if (!census) {
      console.error(`County "${detailedCounty}" not found.`);
    } else {
      const jurors = await getJurorsForCounty(detailedCounty);
      if (jurors.length === 0) {
        console.log('No jurors generated yet for this county.');
      } else {
        const validation = validateJuryDemographics(jurors, census);
        printValidation(validation, detailedCounty);
      }
    }
  } else {
    // Quick validation for all counties with data
    console.log('\n--- Quick Validation (all counties with data) ---');
    let passed = 0;
    let failed = 0;

    for (const { county_name, count } of counts) {
      if (count < 10) continue; // Skip counties with too few jurors

      const census = await getCountyDemographics(county_name);
      if (!census) continue;

      const jurors = await getJurorsForCounty(county_name);
      const validation = validateJuryDemographics(jurors, census);

      const status = validation.passed ? 'PASS' : 'FAIL';
      const errorCount = validation.errors.length;
      const warnCount = validation.warnings.length;
      console.log(`  ${county_name.padEnd(18)} ${status}  (${errorCount} errors, ${warnCount} warnings)`);

      if (validation.passed) passed++;
      else failed++;
    }

    console.log(`\nValidation: ${passed} passed, ${failed} failed`);
  }

  console.log(`\nTip: Run 'npm run verify <CountyName>' for detailed validation of a specific county.`);

  await closePool();
}

main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
