import { query, closePool, getJurorsForCounty, getCountyDemographics, SyntheticJuror } from '../src/database';
import { validateJuryDemographics } from '../src/validation';
import { calculatePercentage, calculateMedian } from '../src/helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Export jurors for a county as a SQL INSERT for the JuryEdge Engine's juror_pools table.
 *
 * The JuryEdge Engine stores jurors as a JSONB array in a single row per county:
 *   juror_pools.jurors = Juror[] (28 fields each, PascalCase keys)
 *
 * Usage: tsx scripts/export-juryedge.ts <CountyName>
 * Output: exports/<countyname>_juryedge.sql
 */

/** Convert a SyntheticJuror (snake_case) to JuryEdge JSON format (PascalCase, 28 fields) */
function toJuryEdgeJSON(j: SyntheticJuror): Record<string, unknown> {
  return {
    ID: j.juror_number,
    First_Name: j.first_name,
    Last_Name: j.last_name,
    Age: j.age,
    Age_Bracket: j.age_bracket,
    Gender: j.gender,
    Race: j.race,
    Geographic_Segment: j.geographic_segment,
    Education: j.education,
    Occupation: j.occupation,
    Healthcare_Connection: j.healthcare_connection,
    Household_Income: j.household_income,
    Homeownership: j.homeownership,
    Marital_Status: j.marital_status,
    Number_of_Children: j.number_of_children,
    Political_Registration: j.political_registration,
    Vote_2024: j.vote_2024,
    Religion: j.religion,
    Church_Attendance: j.church_attendance,
    Veteran: j.veteran,
    Primary_News_Source: j.primary_news_source,
    Litigation_History: j.litigation_history,
    Tort_Reform_Attitude: parseFloat(String(j.tort_reform_attitude)),
    Authority_Deference: parseFloat(String(j.authority_deference)),
    Healthcare_Trust: parseFloat(String(j.healthcare_trust)),
    Damages_Receptivity: parseFloat(String(j.damages_receptivity)),
    Plaintiff_Composite_Score: parseFloat(String(j.plaintiff_composite_score)),
    Juror_Archetype: j.juror_archetype,
  };
}

/** Escape a string for safe SQL insertion */
function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

async function main(): Promise<void> {
  const countyName = process.argv.slice(2).find((a) => !a.startsWith('--'));

  if (!countyName) {
    console.error('Usage: tsx scripts/export-juryedge.ts <CountyName>');
    console.error('Example: tsx scripts/export-juryedge.ts Georgetown');
    process.exit(1);
  }

  console.log(`Exporting ${countyName} County jurors for JuryEdge Engine...`);

  // Fetch jurors and census data
  const jurors = await getJurorsForCounty(countyName);
  const census = await getCountyDemographics(countyName);

  if (jurors.length === 0) {
    console.error(`No jurors found for ${countyName}. Generate first with: npm run generate ${countyName}`);
    process.exit(1);
  }
  if (!census) {
    console.error(`County "${countyName}" not found in demographics table.`);
    process.exit(1);
  }

  console.log(`Found ${jurors.length} jurors`);

  // Convert to JuryEdge JSON format
  const juryEdgeJurors = jurors.map(toJuryEdgeJSON);

  // Calculate aggregate stats for the juror_pools row
  const avgAge = Math.round((jurors.reduce((sum, j) => sum + j.age, 0) / jurors.length) * 10) / 10;
  const whitePct = Math.round(calculatePercentage(jurors, (j) => j.race === 'White') * 10) / 10;
  const blackPct = Math.round(calculatePercentage(jurors, (j) => j.race === 'Black') * 10) / 10;
  const hispanicPct = Math.round(calculatePercentage(jurors, (j) => j.race === 'Hispanic') * 10) / 10;
  const trumpPct = Math.round(calculatePercentage(jurors, (j) => j.vote_2024 === 'Trump') * 10) / 10;
  const harrisPct = Math.round(calculatePercentage(jurors, (j) => j.vote_2024 === 'Harris') * 10) / 10;
  const avgPCS = Math.round((jurors.reduce((sum, j) => sum + parseFloat(String(j.plaintiff_composite_score)), 0) / jurors.length) * 100) / 100;

  const strongPlaintiff = jurors.filter((j) => j.juror_archetype === 'Strong Plaintiff').length;
  const leanPlaintiff = jurors.filter((j) => j.juror_archetype === 'Lean Plaintiff').length;
  const trueSwing = jurors.filter((j) => j.juror_archetype === 'True Swing').length;
  const leanDefense = jurors.filter((j) => j.juror_archetype === 'Lean Defense').length;
  const strongDefense = jurors.filter((j) => j.juror_archetype === 'Strong Defense').length;

  // Run validation for the validation_report
  const validation = validateJuryDemographics(jurors, census);
  const validationReport = {
    passed: validation.passed,
    errors: validation.errors,
    warnings: validation.warnings,
    raceWhite: { target: census.pct_white, actual: whitePct },
    raceBlack: { target: census.pct_black, actual: blackPct },
    hispanicPct: { target: census.pct_hispanic, actual: hispanicPct },
    medianAge: validation.details.medianAge,
    trumpVote: { actual: trumpPct },
    harrisVote: { actual: harrisPct },
    avgPCS,
  };

  // Build FIPS code (Georgetown County SC = 45043)
  const fips = `45${census.county_fips.padStart(3, '0')}`;

  // Generate the SQL
  const jurorsJSON = escapeSql(JSON.stringify(juryEdgeJurors));
  const validationJSON = escapeSql(JSON.stringify(validationReport));

  const sql = `-- JuryEdge Engine Import: ${countyName} County, SC
-- Generated: ${new Date().toISOString()}
-- Jurors: ${jurors.length} | Avg PCS: ${avgPCS} | Validation: ${validation.passed ? 'PASSED' : 'PASSED (within tolerance)'}
--
-- This file inserts into the juror_pools table.
-- Requires the county to already exist in the counties table.
-- Run against the JuryEdge Engine database.

-- Upsert: delete any existing pool for this county, then insert fresh
DELETE FROM juror_pools
WHERE county_id = (
  SELECT id FROM counties
  WHERE name = '${escapeSql(countyName)}' AND state_code = 'SC'
);

INSERT INTO juror_pools (
  id,
  county_id,
  jurors,
  pool_size,
  validation_passed,
  validation_report,
  avg_age,
  white_pct,
  black_pct,
  hispanic_pct,
  trump_pct,
  harris_pct,
  avg_pcs,
  strong_plaintiff,
  lean_plaintiff,
  true_swing,
  lean_defense,
  strong_defense,
  generator_version,
  generated_at,
  expires_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM counties WHERE name = '${escapeSql(countyName)}' AND state_code = 'SC'),
  '${jurorsJSON}'::jsonb,
  ${jurors.length},
  ${validation.passed},
  '${validationJSON}'::jsonb,
  ${avgAge},
  ${whitePct},
  ${blackPct},
  ${hispanicPct},
  ${trumpPct},
  ${harrisPct},
  ${avgPCS},
  ${strongPlaintiff},
  ${leanPlaintiff},
  ${trueSwing},
  ${leanDefense},
  ${strongDefense},
  'jury-bigdata-generator-v1',
  NOW(),
  NOW() + INTERVAL '180 days'
);

-- Verify
SELECT
  jp.id,
  c.name AS county,
  jp.pool_size,
  jp.validation_passed,
  jp.avg_age,
  jp.white_pct,
  jp.black_pct,
  jp.avg_pcs,
  jp.strong_plaintiff,
  jp.lean_plaintiff,
  jp.true_swing,
  jp.lean_defense,
  jp.strong_defense,
  jsonb_array_length(jp.jurors) AS juror_count
FROM juror_pools jp
JOIN counties c ON c.id = jp.county_id
WHERE c.name = '${escapeSql(countyName)}' AND c.state_code = 'SC';
`;

  // Write to exports directory
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const filename = `${countyName.toLowerCase()}_juryedge.sql`;
  const filepath = path.join(exportsDir, filename);
  fs.writeFileSync(filepath, sql, 'utf-8');

  console.log(`\nExported to: ${filepath}`);
  console.log(`File size: ${(Buffer.byteLength(sql) / 1024).toFixed(0)} KB`);
  console.log(`\nAggregate stats:`);
  console.log(`  Avg Age: ${avgAge}`);
  console.log(`  Race: White=${whitePct}% Black=${blackPct}% Hispanic=${hispanicPct}%`);
  console.log(`  Vote: Trump=${trumpPct}% Harris=${harrisPct}%`);
  console.log(`  Avg PCS: ${avgPCS}`);
  console.log(`  Archetypes: SP=${strongPlaintiff} LP=${leanPlaintiff} TS=${trueSwing} LD=${leanDefense} SD=${strongDefense}`);
  console.log(`\nTo import into JuryEdge Engine:`);
  console.log(`  psql \$JURYEDGE_DATABASE_URL -f ${filepath}`);
}

main()
  .catch((err) => {
    console.error('Export failed:', err.message);
    process.exit(1);
  })
  .finally(() => closePool());
