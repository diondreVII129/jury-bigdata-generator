import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import {
  getCountyDemographics, insertJurors, deleteJurorsForCounty,
  CountyDemographics, SyntheticJuror,
} from './database';
import { callClaude } from './claude';
import { parseJurorJSON, sleep, clamp } from './helpers';
import { validateJuryDemographics, ValidationResult, printValidation } from './validation';

export interface GenerationOptions {
  countyName: string;
  totalJurors?: number;
  /** If true, delete existing jurors for this county before generating */
  fresh?: boolean;
}

export interface GenerationResult {
  totalJurors: number;
  batchId: string;
  validation: ValidationResult;
  county: string;
}

// Max concurrent API calls per wave
const PARALLEL_CONCURRENCY = 8;

// Valid values for all enum fields — must match JuryEdge Engine exactly
const OCCUPATIONS = [
  'Retired', 'Healthcare - RN/LPN', 'Healthcare - Administration', 'Healthcare - Technician',
  'Education - Teacher', 'Retail/Sales', 'Hospitality/Food Service', 'Construction/Trades',
  'Manufacturing', 'Transportation/Logistics', 'Government/Public Sector',
  'Law Enforcement/Corrections', 'Finance/Insurance/Banking', 'Real Estate',
  'Technology/IT', 'Business Owner/Self-Employed', 'Agriculture/Forestry/Fishing',
  'Social Services/Nonprofit', 'Administrative/Clerical',
  'Skilled Trades (Electrician/Plumber/HVAC)', 'Homemaker', 'Unemployed/Seeking Work',
  'Engineering', 'Legal Professional', 'Military (Active/Reserve)',
];

const RELIGIONS = [
  'Southern Baptist', 'Non-Denom Evangelical', 'Catholic', 'United Methodist',
  'Unaffiliated', 'Baptist (Hist. Black)', 'AME/AME Zion', 'Presbyterian',
  'Pentecostal', 'Non-Denom Christian', 'Lutheran', 'Episcopal',
  'Church of God in Christ', 'LDS/Mormon', 'Jewish', 'Muslim', 'Hindu', 'Other',
];

const NEWS_SOURCES = [
  'Fox News', 'CNN', 'MSNBC', 'Local TV News', 'Facebook/Social Media',
  'Online News Sites', 'Newspaper', 'NPR/Public Radio', 'Talk Radio', 'None',
];

/**
 * Calculate Plaintiff Composite Score from the 4 scoring dimensions.
 * LOCKED FORMULA from JuryEdge Engine.
 */
function calculatePCS(tort: number, auth: number, hcTrust: number, damages: number): number {
  const pcs = (10 - tort) * 0.25 + (10 - auth) * 0.25 + (10 - hcTrust) * 0.25 + damages * 0.25;
  return Math.round(clamp(pcs, 0.1, 10.0) * 10) / 10;
}

/**
 * Derive Juror Archetype from PCS. LOCKED thresholds from JuryEdge Engine.
 */
function deriveArchetype(pcs: number): string {
  if (pcs >= 7.0) return 'Strong Plaintiff';
  if (pcs >= 5.5) return 'Lean Plaintiff';
  if (pcs >= 4.5) return 'True Swing';
  if (pcs >= 3.0) return 'Lean Defense';
  return 'Strong Defense';
}

/**
 * Calculate age bracket distribution based on county median age.
 * Returns exact counts for a batch, ensuring they sum to batchSize.
 */
function getAgeBracketDistribution(medianAge: number, batchSize: number): Record<string, number> {
  let pcts: Record<string, number>;

  if (medianAge > 45) {
    // Older county — heavy 55+
    pcts = { '18-24': 0.08, '25-34': 0.12, '35-44': 0.16, '45-54': 0.22, '55-64': 0.22, '65-75': 0.20 };
  } else if (medianAge >= 35) {
    // Balanced county
    pcts = { '18-24': 0.10, '25-34': 0.18, '35-44': 0.20, '45-54': 0.20, '55-64': 0.17, '65-75': 0.15 };
  } else {
    // Younger county — more 18-34
    pcts = { '18-24': 0.14, '25-34': 0.22, '35-44': 0.20, '45-54': 0.18, '55-64': 0.14, '65-75': 0.12 };
  }

  const brackets = Object.keys(pcts);
  const counts: Record<string, number> = {};
  let allocated = 0;
  for (let i = 0; i < brackets.length - 1; i++) {
    counts[brackets[i]] = Math.round(batchSize * pcts[brackets[i]]);
    allocated += counts[brackets[i]];
  }
  // Last bracket gets the remainder to ensure exact sum
  counts[brackets[brackets.length - 1]] = batchSize - allocated;

  return counts;
}

/**
 * Build the prompt for Claude to generate a batch of jurors matching JuryEdge 28-field schema.
 */
function buildJurorPrompt(
  census: CountyDemographics,
  batchNumber: number,
  batchSize: number,
  totalBatches: number,
  startId: number,
): string {
  // Calculate exact counts per category for this batch
  const raceWhite = Math.round(batchSize * census.pct_white / 100);
  const raceBlack = Math.round(batchSize * census.pct_black / 100);
  const raceHispanic = Math.round(batchSize * census.pct_hispanic / 100);
  const raceOther = batchSize - raceWhite - raceBlack - raceHispanic;

  const eduLtHS = Math.round(batchSize * census.pct_less_than_hs / 100);
  const eduHS = Math.round(batchSize * census.pct_hs_graduate / 100);
  const eduSome = Math.round(batchSize * census.pct_some_college / 100);
  const eduBA = Math.round(batchSize * census.pct_bachelors_degree / 100);
  const eduGrad = batchSize - eduLtHS - eduHS - eduSome - eduBA;

  const geoUrban = Math.round(batchSize * census.pct_urban / 100);
  const geoSub = Math.round(batchSize * census.pct_suburban / 100);
  const geoRural = batchSize - geoUrban - geoSub;

  // Age bracket distribution based on census median age
  const ageDist = getAgeBracketDistribution(census.median_age, batchSize);

  // Estimate political lean from county data
  const isConservative = census.political_lean?.toLowerCase().includes('republican') ||
    census.political_lean?.toLowerCase().includes('conservative');
  const repPct = isConservative ? 45 : 25;
  const demPct = isConservative ? 25 : 45;
  const indPct = 22;
  const unregPct = 100 - repPct - demPct - indPct;

  return `You are generating synthetic juror profiles for ${census.county_name} County, South Carolina.
This is batch ${batchNumber} of ${totalBatches}. Generate EXACTLY ${batchSize} jurors.

Each juror must have EXACTLY these 26 fields (fields 27-28 are calculated by our system):

=== MANDATORY DEMOGRAPHIC COUNTS ===
You MUST produce these EXACT counts. Count them before outputting.

**Race** (4 categories only):
- "White": EXACTLY ${raceWhite} jurors
- "Black": EXACTLY ${raceBlack} jurors
- "Hispanic": EXACTLY ${raceHispanic} jurors
- "Other": EXACTLY ${raceOther} jurors

**Education** (use these EXACT strings — NO substitutions):
- "Less than HS": EXACTLY ${eduLtHS} jurors (people who did NOT finish high school — dropouts, farm workers, laborers with no diploma)
- "HS Diploma/GED": EXACTLY ${eduHS} jurors
- "Some College/Associates": EXACTLY ${eduSome} jurors
- "Bachelor's Degree": EXACTLY ${eduBA} jurors
- "Graduate/Professional": EXACTLY ${eduGrad} jurors (lawyers, doctors, MBAs, professors, PhDs — this count is MANDATORY)
⚠️ DO NOT shift Graduate/Professional jurors into Bachelor's. DO NOT shift Less than HS into HS Diploma/GED. These counts are LOCKED.

**Geographic_Segment**:
- "Urban Center": EXACTLY ${geoUrban} jurors
- "Suburban": EXACTLY ${geoSub} jurors
- "Rural": EXACTLY ${geoRural} jurors

**Gender**: ~48% Male, ~52% Female

**Age_Bracket** (MANDATORY counts — county median age is ${census.median_age}):
- "18-24": EXACTLY ${ageDist['18-24']} jurors
- "25-34": EXACTLY ${ageDist['25-34']} jurors
- "35-44": EXACTLY ${ageDist['35-44']} jurors
- "45-54": EXACTLY ${ageDist['45-54']} jurors
- "55-64": EXACTLY ${ageDist['55-64']} jurors
- "65-75": EXACTLY ${ageDist['65-75']} jurors
⚠️ These age counts are LOCKED. DO NOT over-represent 25-44 at the expense of 55+. Each juror's Age must fall within their Age_Bracket range.

**Political_Registration** (approximate):
- "Republican": ~${repPct}%, "Democrat": ~${demPct}%, "Independent": ~${indPct}%, "Unregistered": ~${unregPct}%

**Vote_2024** (correlate with registration):
- Republicans: ~85% Trump, ~5% Harris, ~7% Did Not Vote, ~3% Other
- Democrats: ~5% Trump, ~82% Harris, ~8% Did Not Vote, ~5% Other
- Independent: ~35% Trump, ~28% Harris, ~27% Did Not Vote, ~10% Other
- Unregistered: ~15% Trump, ~12% Harris, ~60% Did Not Vote, ~13% Other

**Homeownership**: ~${census.pct_homeowners}% "Own", ~${census.pct_renters}% "Rent" (correlate with income)

**Veteran**: ~8% "Yes", higher for males and older jurors

**Healthcare_Connection**: ~74% null, ~26% have a connection:
- "Self - Direct Healthcare Employee" (if occupation is healthcare)
- "Spouse/Partner in Healthcare"
- "Parent/Child in Healthcare"
- "Close Friend in Healthcare"

**Litigation_History**: ~81% null, remainder split among:
- "Was a plaintiff", "Served on jury (civil)", "Was a defendant", "Served on jury (criminal)"

=== COUNTY CONTEXT: ${census.county_name.toUpperCase()} COUNTY, SC ===
- Population: ${census.total_population.toLocaleString()}
- Median Household Income: $${census.median_household_income.toLocaleString()}
- Poverty Rate: ${census.pct_below_poverty}%
- Top Industries: ${census.top_industry_1}, ${census.top_industry_2}, ${census.top_industry_3}
- ${census.urbanization}
- Political Lean: ${census.political_lean}
- Evangelical: ${census.pct_evangelical}%

=== OCCUPATION ===
Use ONLY these exact strings (choose based on county industries, education, age):
${OCCUPATIONS.map(o => `"${o}"`).join(', ')}
Note: Age 65+: 55% should be "Retired". Age 58-64: 15% "Retired". Under 58: never "Retired".

=== RELIGION ===
Use ONLY these exact strings:
${RELIGIONS.map(r => `"${r}"`).join(', ')}

=== CHURCH ATTENDANCE ===
"Weekly or more", "Monthly", "Few times a year", "Rarely/Never"
Correlate with religion (Unaffiliated → mostly "Rarely/Never"; Evangelical → more "Weekly or more")

=== NEWS SOURCE ===
Use ONLY these exact strings:
${NEWS_SOURCES.map(n => `"${n}"`).join(', ')}
Correlate with politics (Republican → more Fox News; Democrat → more MSNBC/CNN)

=== MARITAL STATUS ===
"Single", "Married", "Divorced", "Widowed", "Separated", "Cohabiting"
Age-weighted: <25 mostly Single; 25-40 mix; 40+ more Married/Divorced

=== NUMBER OF CHILDREN ===
0-5, age-constrained: under 22 max 1, under 25 max 2

=== HOUSEHOLD INCOME ===
Integer 12000-250000. Correlate with education:
- Less than HS: $12,000-$35,000
- HS Diploma/GED: $22,000-$55,000
- Some College: $30,000-$75,000
- Bachelor's: $45,000-$120,000
- Graduate/Professional: $65,000-$250,000

=== PSYCHOGRAPHIC SCORES (1.0 to 10.0, one decimal) ===
Generate these 4 scores. They should correlate with demographics:
- **Tort_Reform_Attitude**: Higher = more pro-tort-reform/defense. Republicans, older, higher income → higher.
- **Authority_Deference**: Higher = more deferential to authority. Older, religious, conservative → higher.
- **Healthcare_Trust**: Higher = more trusting of healthcare. Healthcare workers, older → higher.
- **Damages_Receptivity**: Higher = more open to large awards. Democrats, lower income, minorities → higher.

DO NOT generate Plaintiff_Composite_Score or Juror_Archetype — we calculate those.

=== OUTPUT FORMAT ===
Return ONLY a JSON array. No markdown fences, no explanation. IDs start at ${startId}.

[
  {
    "ID": ${startId},
    "First_Name": "James",
    "Last_Name": "Mitchell",
    "Age": 52,
    "Age_Bracket": "45-54",
    "Gender": "Male",
    "Race": "White",
    "Geographic_Segment": "Suburban",
    "Education": "HS Diploma/GED",
    "Occupation": "Construction/Trades",
    "Healthcare_Connection": null,
    "Household_Income": 48000,
    "Homeownership": "Own",
    "Marital_Status": "Married",
    "Number_of_Children": 2,
    "Political_Registration": "Republican",
    "Vote_2024": "Trump",
    "Religion": "Southern Baptist",
    "Church_Attendance": "Weekly or more",
    "Veteran": "No",
    "Primary_News_Source": "Fox News",
    "Litigation_History": null,
    "Tort_Reform_Attitude": 7.2,
    "Authority_Deference": 6.8,
    "Healthcare_Trust": 5.9,
    "Damages_Receptivity": 3.4
  }
]

CRITICAL: Generate EXACTLY ${batchSize} jurors. Match the EXACT demographic counts above. Use ONLY the valid enum values listed. IDs must be sequential starting at ${startId}.`;
}

interface BatchResult {
  batchNumber: number;
  jurors: SyntheticJuror[];
  inputTokens: number;
  outputTokens: number;
}

/**
 * Transform a raw JSON juror object into a SyntheticJuror with PCS and Archetype calculated.
 */
function transformJuror(
  raw: Record<string, unknown>,
  countyName: string,
  batchId: string,
): SyntheticJuror {
  const jurorNum = Number(raw.ID) || 0;
  const jurorId = `${countyName.toLowerCase().replace(/\s+/g, '_')}_${jurorNum}_${batchId.substring(0, 8)}`;

  const tort = clamp(Number(raw.Tort_Reform_Attitude) || 5, 1, 10);
  const auth = clamp(Number(raw.Authority_Deference) || 5.5, 1, 10);
  const hcTrust = clamp(Number(raw.Healthcare_Trust) || 6, 1, 10);
  const damages = clamp(Number(raw.Damages_Receptivity) || 5, 1, 10);

  const pcs = calculatePCS(tort, auth, hcTrust, damages);
  const archetype = deriveArchetype(pcs);

  const age = clamp(Number(raw.Age) || 40, 18, 75);

  return {
    juror_id: jurorId,
    county_name: countyName,
    juror_number: jurorNum,
    first_name: String(raw.First_Name || 'Unknown'),
    last_name: String(raw.Last_Name || 'Unknown'),
    age,
    age_bracket: String(raw.Age_Bracket || getAgeBracket(age)),
    gender: raw.Gender === 'Female' ? 'Female' : 'Male',
    race: normalizeRace(String(raw.Race || 'White')),
    geographic_segment: String(raw.Geographic_Segment || 'Suburban'),
    education: normalizeEducation(String(raw.Education || 'HS Diploma/GED')),
    occupation: String(raw.Occupation || 'Retail/Sales'),
    healthcare_connection: raw.Healthcare_Connection ? String(raw.Healthcare_Connection) : null,
    household_income: clamp(Number(raw.Household_Income) || 45000, 12000, 250000),
    homeownership: raw.Homeownership === 'Rent' ? 'Rent' : 'Own',
    marital_status: normalizeMaritalStatus(String(raw.Marital_Status || 'Single')),
    number_of_children: clamp(Number(raw.Number_of_Children) || 0, 0, 5),
    political_registration: normalizePolitical(String(raw.Political_Registration || 'Independent')),
    vote_2024: normalizeVote(String(raw.Vote_2024 || 'Did Not Vote')),
    religion: String(raw.Religion || 'Unaffiliated'),
    church_attendance: normalizeChurch(String(raw.Church_Attendance || 'Rarely/Never')),
    veteran: raw.Veteran === 'Yes' ? 'Yes' : 'No',
    primary_news_source: String(raw.Primary_News_Source || 'Local TV News'),
    litigation_history: raw.Litigation_History ? String(raw.Litigation_History) : null,
    tort_reform_attitude: Math.round(tort * 10) / 10,
    authority_deference: Math.round(auth * 10) / 10,
    healthcare_trust: Math.round(hcTrust * 10) / 10,
    damages_receptivity: Math.round(damages * 10) / 10,
    plaintiff_composite_score: pcs,
    juror_archetype: archetype,
    generation_batch_id: batchId,
  };
}

function getAgeBracket(age: number): string {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65-75';
}

function normalizeRace(race: string): string {
  const l = race.toLowerCase();
  if (l.includes('white') || l.includes('caucasian')) return 'White';
  if (l.includes('black') || l.includes('african')) return 'Black';
  if (l.includes('hispanic') || l.includes('latino')) return 'Hispanic';
  return 'Other';
}

function normalizeEducation(edu: string): string {
  const l = edu.toLowerCase();
  if (l.includes('less than') || l.includes('no hs') || l.includes('did not') || l.includes('dropout')) return 'Less than HS';
  if (l.includes('graduate') || l.includes('professional') || l.includes('master') || l.includes('doctor') || l.includes('phd') || l.includes('jd') || l.includes('md')) return 'Graduate/Professional';
  if (l.includes('bachelor')) return "Bachelor's Degree";
  if (l.includes('some college') || l.includes('associate') || l.includes('trade') || l.includes('vocational')) return 'Some College/Associates';
  if (l.includes('hs') || l.includes('high school') || l.includes('ged') || l.includes('diploma')) return 'HS Diploma/GED';
  return 'HS Diploma/GED';
}

function normalizeMaritalStatus(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('married')) return 'Married';
  if (l.includes('divorced')) return 'Divorced';
  if (l.includes('widowed')) return 'Widowed';
  if (l.includes('separated')) return 'Separated';
  if (l.includes('cohabit')) return 'Cohabiting';
  return 'Single';
}

function normalizePolitical(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('republican')) return 'Republican';
  if (l.includes('democrat')) return 'Democrat';
  if (l.includes('independent')) return 'Independent';
  return 'Unregistered';
}

function normalizeVote(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('trump')) return 'Trump';
  if (l.includes('harris')) return 'Harris';
  if (l.includes('did not') || l.includes('none') || l.includes('didn')) return 'Did Not Vote';
  return 'Other';
}

function normalizeChurch(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('weekly')) return 'Weekly or more';
  if (l.includes('monthly')) return 'Monthly';
  if (l.includes('few') || l.includes('sometimes')) return 'Few times a year';
  return 'Rarely/Never';
}

/**
 * Process a single batch: call Claude, parse, transform, insert.
 */
async function processBatch(
  census: CountyDemographics,
  batchNumber: number,
  batchSize: number,
  totalBatches: number,
  countyName: string,
  batchId: string,
  startId: number,
): Promise<BatchResult | null> {
  const maxBatchRetries = 3;
  const prompt = buildJurorPrompt(census, batchNumber, batchSize, totalBatches, startId);

  for (let attempt = 1; attempt <= maxBatchRetries; attempt++) {
    const tag = `[Batch ${batchNumber}/${totalBatches}]`;
    console.log(`  ${tag} Calling Claude API${attempt > 1 ? ` (attempt ${attempt}/${maxBatchRetries})` : ''}...`);
    const batchStart = Date.now();

    let response;
    try {
      response = await callClaude(prompt);
    } catch (error) {
      console.error(`  ${tag} API FAILED (attempt ${attempt}): ${(error as Error).message}`);
      if (attempt < maxBatchRetries) {
        await sleep(5000 * attempt);
        continue;
      }
      console.error(`  ${tag} FAILED after ${maxBatchRetries} attempts. Skipping.`);
      return null;
    }

    console.log(`  ${tag} Tokens: ${response.inputTokens} in / ${response.outputTokens} out`);

    let rawJurors: Record<string, unknown>[];
    try {
      rawJurors = parseJurorJSON(response.content);
      console.log(`  ${tag} Parsed ${rawJurors.length} juror objects`);
    } catch (parseError) {
      console.error(`  ${tag} JSON PARSE FAILED: ${(parseError as Error).message}`);
      if (attempt < maxBatchRetries) {
        await sleep(5000 * attempt);
        continue;
      }
      return null;
    }

    const batchJurors = rawJurors.map((raw) => transformJuror(raw, countyName, batchId));
    const inserted = await insertJurors(batchJurors);
    const duration = ((Date.now() - batchStart) / 1000).toFixed(1);
    console.log(`  ${tag} Inserted ${inserted}/${batchJurors.length} jurors (${duration}s)`);

    return {
      batchNumber,
      jurors: batchJurors,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    };
  }
  return null;
}

/**
 * Generate a full jury pool for a single county using parallel batch processing.
 */
export async function generateJuryPool(options: GenerationOptions): Promise<GenerationResult> {
  const { countyName, totalJurors = config.jurorsPerCounty, fresh = false } = options;
  const batchSize = config.batchSize;
  const totalBatches = Math.ceil(totalJurors / batchSize);
  const batchId = uuidv4();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`GENERATING JURY POOL: ${countyName} County, SC`);
  console.log(`Total jurors: ${totalJurors} | Batches: ${totalBatches} | Batch size: ${batchSize}`);
  console.log(`Concurrency: ${PARALLEL_CONCURRENCY} parallel batches`);
  console.log(`Batch ID: ${batchId}`);
  console.log('='.repeat(60));

  const census = await getCountyDemographics(countyName);
  if (!census) {
    throw new Error(`County "${countyName}" not found in database. Run 'npm run setup' first.`);
  }
  console.log(`Loaded census data for ${countyName} County (pop: ${census.total_population.toLocaleString()})`);

  if (fresh) {
    const deleted = await deleteJurorsForCounty(countyName);
    if (deleted > 0) console.log(`Deleted ${deleted} existing jurors for ${countyName}`);
  }

  const allJurors: SyntheticJuror[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let waveStart = 1; waveStart <= totalBatches; waveStart += PARALLEL_CONCURRENCY) {
    const waveEnd = Math.min(waveStart + PARALLEL_CONCURRENCY - 1, totalBatches);
    const waveSize = waveEnd - waveStart + 1;
    const waveNum = Math.ceil(waveStart / PARALLEL_CONCURRENCY);
    const totalWaves = Math.ceil(totalBatches / PARALLEL_CONCURRENCY);

    console.log(`\n>>> Wave ${waveNum}/${totalWaves}: Batches ${waveStart}-${waveEnd} (${waveSize} parallel) <<<`);
    const waveStartTime = Date.now();

    const promises: Promise<BatchResult | null>[] = [];
    for (let batch = waveStart; batch <= waveEnd; batch++) {
      const currentBatchSize = batch === totalBatches
        ? totalJurors - (totalBatches - 1) * batchSize
        : batchSize;
      const startId = (batch - 1) * batchSize + 1;
      promises.push(processBatch(census, batch, currentBatchSize, totalBatches, countyName, batchId, startId));
    }

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result) {
        allJurors.push(...result.jurors);
        totalInputTokens += result.inputTokens;
        totalOutputTokens += result.outputTokens;
      }
    }

    const waveDuration = ((Date.now() - waveStartTime) / 1000).toFixed(1);
    const successCount = results.filter((r) => r !== null).length;
    console.log(`>>> Wave ${waveNum} complete: ${successCount}/${waveSize} succeeded, ${allJurors.length}/${totalJurors} total (${waveDuration}s) <<<`);

    if (waveEnd < totalBatches) {
      console.log(`  Waiting 2s before next wave...`);
      await sleep(2000);
    }
  }

  console.log(`\nGeneration complete. Validating demographics...`);
  const validation = validateJuryDemographics(allJurors, census);
  printValidation(validation, countyName);

  console.log(`\nToken usage: ${totalInputTokens.toLocaleString()} input, ${totalOutputTokens.toLocaleString()} output`);
  const estimatedCost = (totalInputTokens * 0.003 + totalOutputTokens * 0.015) / 1000;
  console.log(`Estimated cost: $${estimatedCost.toFixed(2)}`);

  return { totalJurors: allJurors.length, batchId, validation, county: countyName };
}
