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

// Valid values for all enum fields — Randy v2.1 spec
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
  'SBC Evangelical', 'AME', 'UMC', 'Non-Denom Evangelical', 'Catholic',
  'Baptist', 'Jewish', 'None/Agnostic/Atheist', 'Other',
];

const NEWS_SOURCES = [
  'NPR/PBS', 'Fox News/Conservative Media', 'CNN/MSNBC', 'Local TV/Radio',
  'Online News', 'Social Media', 'Mixed/Varied',
];

/**
 * Derive generation label from age.
 */
function deriveGeneration(age: number): string {
  // Based on 2026 reference year
  if (age <= 28) return 'Gen Z';       // Born 1997-2012 → age 14-29 in 2026
  if (age <= 44) return 'Millennial';   // Born 1981-1996 → age 30-45 in 2026
  if (age <= 60) return 'Gen X';        // Born 1965-1980 → age 46-61 in 2026
  if (age <= 75) return 'Boomer';       // Born 1946-1964 → age 62-80 in 2026
  return 'Silent';                      // Born before 1946
}

/**
 * Calculate psychographic scores from 30 core fields — Randy's documented formulas.
 * These are [PROXY-INFERRED] from factual attributes.
 */
function calculatePsychographicScores(juror: Record<string, unknown>): {
  tort_reform_attitude: number;
  authority_deference: number;
  healthcare_trust: number;
  damages_receptivity: number;
  plaintiff_composite_score: number;
  juror_archetype: string;
  flag_color: string;
} {
  // 1. Tort_Reform_Attitude (0-10, higher = more pro-tort reform / anti-plaintiff)
  let tortReform = 5.0;
  const polReg = String(juror.Political_Registration || '');
  const age = Number(juror.Age) || 40;
  const edu = String(juror.Education || '');
  const occ = String(juror.Occupation || '');

  if (polReg === 'Republican') tortReform += 2.0;
  if (polReg === 'Democrat') tortReform -= 2.0;
  if (age > 65) tortReform += 1.0;
  if (age < 35) tortReform -= 0.5;
  if (edu === 'Graduate/Professional') tortReform += 0.5;
  if (occ.includes('Business') || occ.includes('Management')) tortReform += 1.0;
  tortReform = clamp(tortReform, 0, 10);

  // 2. Authority_Deference (0-10, higher = more deferential to institutions)
  let authorityDef = 5.0;
  const veteran = juror.Veteran === true || juror.Veteran === 'true';
  const religion = String(juror.Religion || '');
  const generation = String(juror.Generation || deriveGeneration(age));

  if (age > 60) authorityDef += 1.5;
  if (age < 30) authorityDef -= 1.0;
  if (veteran) authorityDef += 2.0;
  if (religion.includes('Evangelical') || religion === 'SBC Evangelical') authorityDef += 1.0;
  if (occ.includes('Law Enforcement') || occ.includes('Military')) authorityDef += 2.0;
  if (generation === 'Boomer' || generation === 'Silent') authorityDef += 0.5;
  authorityDef = clamp(authorityDef, 0, 10);

  // 3. Healthcare_Trust (0-10, higher = more trusting of healthcare providers)
  let healthcareTrust = 5.0;
  const hcConn = String(juror.Healthcare_Connection || 'None');
  const news = String(juror.Primary_News_Source || '');

  if (hcConn.includes('Direct Healthcare Employee')) healthcareTrust += 3.0;
  if (hcConn.includes('Parent/Child in Healthcare')) healthcareTrust += 1.5;
  if (hcConn.includes('Spouse in Healthcare')) healthcareTrust += 1.5;
  if (age > 65) healthcareTrust += 1.0;
  if (news === 'Fox News/Conservative Media') healthcareTrust += 0.5;
  if (news === 'NPR/PBS') healthcareTrust -= 0.5;
  healthcareTrust = clamp(healthcareTrust, 0, 10);

  // 4. Damages_Receptivity (0-10, higher = more receptive to large damage awards)
  let damagesReceptivity = 5.0;
  const income = Number(juror.Household_Income) || 45000;

  if (income < 35000) damagesReceptivity += 2.0;
  if (income > 100000) damagesReceptivity -= 1.5;
  if (edu === 'Less than HS' || edu === 'HS Diploma/GED') damagesReceptivity += 1.0;
  if (polReg === 'Democrat') damagesReceptivity += 1.0;
  if (polReg === 'Republican') damagesReceptivity -= 1.0;
  damagesReceptivity = clamp(damagesReceptivity, 0, 10);

  // 5. Plaintiff_Composite_Score (Randy's formula)
  const pcs = (10 - tortReform) * 0.25 + (10 - authorityDef) * 0.25 +
              (10 - healthcareTrust) * 0.25 + damagesReceptivity * 0.25;
  const pcsRounded = Math.round(clamp(pcs, 0, 10) * 10) / 10;

  // 6. Juror_Archetype from PCS
  let archetype: string;
  if (pcsRounded >= 8.0) archetype = 'Champion';
  else if (pcsRounded >= 7.0) archetype = 'Strong Plaintiff';
  else if (pcsRounded >= 5.5) archetype = 'Lean Plaintiff';
  else if (pcsRounded >= 4.5) archetype = 'True Swing';
  else if (pcsRounded >= 3.0) archetype = 'Lean Defense';
  else if (pcsRounded >= 1.5) archetype = 'Strong Defense';
  else archetype = 'Skeptic';

  // 7. Flag_Color from PCS
  let flagColor: string;
  if (pcsRounded >= 6.5) flagColor = 'Green';
  else if (pcsRounded >= 4.5) flagColor = 'Yellow';
  else flagColor = 'Red';

  return {
    tort_reform_attitude: Math.round(tortReform * 10) / 10,
    authority_deference: Math.round(authorityDef * 10) / 10,
    healthcare_trust: Math.round(healthcareTrust * 10) / 10,
    damages_receptivity: Math.round(damagesReceptivity * 10) / 10,
    plaintiff_composite_score: pcsRounded,
    juror_archetype: archetype,
    flag_color: flagColor,
  };
}

/**
 * Calculate age bracket distribution based on county median age.
 * Returns exact counts for a batch, ensuring they sum to batchSize.
 */
function getAgeBracketDistribution(medianAge: number, batchSize: number): Record<string, number> {
  let pcts: Record<string, number>;

  if (medianAge > 45) {
    pcts = { '18-24': 0.08, '25-34': 0.12, '35-44': 0.16, '45-54': 0.22, '55-64': 0.22, '65-75': 0.20 };
  } else if (medianAge >= 40) {
    pcts = { '18-24': 0.10, '25-34': 0.18, '35-44': 0.20, '45-54': 0.20, '55-64': 0.17, '65-75': 0.15 };
  } else if (medianAge >= 35) {
    pcts = { '18-24': 0.12, '25-34': 0.22, '35-44': 0.22, '45-54': 0.18, '55-64': 0.14, '65-75': 0.12 };
  } else {
    pcts = { '18-24': 0.14, '25-34': 0.24, '35-44': 0.22, '45-54': 0.16, '55-64': 0.13, '65-75': 0.11 };
  }

  // Largest-remainder method to avoid rounding bias against the last bracket
  const brackets = Object.keys(pcts);
  const rawCounts = brackets.map(b => batchSize * pcts[b]);
  const floored = rawCounts.map(c => Math.floor(c));
  let remaining = batchSize - floored.reduce((a, b) => a + b, 0);

  // Sort by fractional part descending, award +1 to highest remainders
  const remainders = rawCounts.map((c, i) => ({ i, frac: c - floored[i] }));
  remainders.sort((a, b) => b.frac - a.frac);
  for (let r = 0; r < remaining; r++) {
    floored[remainders[r].i]++;
  }

  const counts: Record<string, number> = {};
  brackets.forEach((b, i) => { counts[b] = floored[i]; });
  return counts;
}

/**
 * Build the prompt for Claude to generate 30 core fields per juror (Randy v2.1).
 * The 6 psychographic fields are calculated by our system AFTER generation.
 */
function buildJurorPrompt(
  census: CountyDemographics,
  batchNumber: number,
  batchSize: number,
  totalBatches: number,
  startId: number,
): string {
  const countyPrefix = census.county_name.substring(0, 4).toUpperCase();

  // Race distribution (now includes Asian and Multiracial)
  const raceWhite = Math.round(batchSize * census.pct_white / 100);
  const raceBlack = Math.round(batchSize * census.pct_black / 100);
  const raceHispanic = Math.round(batchSize * census.pct_hispanic / 100);
  const raceAsian = Math.round(batchSize * (census.pct_asian || 0) / 100);
  const raceOther = batchSize - raceWhite - raceBlack - raceHispanic - raceAsian;

  // Education distribution — normalize to 100% first (census pcts may not sum exactly),
  // then apply largest-remainder so all 5 categories are computed fairly.
  const eduRawPcts = [
    census.pct_less_than_hs, census.pct_hs_graduate, census.pct_some_college,
    census.pct_bachelors_degree, census.pct_graduate_degree,
  ];
  const eduTotal = eduRawPcts.reduce((a, b) => a + b, 0) || 100;
  const eduRawCounts = eduRawPcts.map(p => batchSize * p / eduTotal);
  const eduFloored = eduRawCounts.map(c => Math.floor(c));
  let eduRemaining = batchSize - eduFloored.reduce((a, b) => a + b, 0);
  const eduFracs = eduRawCounts.map((c, i) => ({ i, frac: c - eduFloored[i] }));
  eduFracs.sort((a, b) => b.frac - a.frac);
  for (let r = 0; r < eduRemaining; r++) eduFloored[eduFracs[r].i]++;
  const [eduLtHS, eduHS, eduSome, eduBA, eduGrad] = eduFloored;

  // Geographic distribution
  const geoUrban = Math.round(batchSize * census.pct_urban / 100);
  const geoSub = Math.round(batchSize * census.pct_suburban / 100);
  const geoRural = batchSize - geoUrban - geoSub;

  // Age bracket distribution
  const ageDist = getAgeBracketDistribution(census.median_age, batchSize);

  // Political lean estimate
  const isConservative = census.political_lean?.toLowerCase().includes('republican') ||
    census.political_lean?.toLowerCase().includes('conservative');
  const repPct = isConservative ? 45 : 25;
  const demPct = isConservative ? 25 : 45;
  const indPct = 15;
  const unaffPct = 10;
  const notRegPct = 100 - repPct - demPct - indPct - unaffPct;

  return `You are generating synthetic juror profiles for ${census.county_name} County, ${census.state_name}.
This is batch ${batchNumber} of ${totalBatches}. Generate EXACTLY ${batchSize} jurors.

Each juror must have EXACTLY these 30 core fields. DO NOT generate psychographic scores — we calculate those.

=== MANDATORY DEMOGRAPHIC COUNTS ===
You MUST produce these EXACT counts. Count them before outputting.

**Race** (6 categories):
- "White": EXACTLY ${raceWhite} jurors
- "Black": EXACTLY ${raceBlack} jurors
- "Hispanic": EXACTLY ${raceHispanic} jurors
- "Asian": EXACTLY ${raceAsian} jurors
- "Other" (includes Multiracial): EXACTLY ${raceOther} jurors

**Education** (use these EXACT strings — NO substitutions):
- "Less than HS": EXACTLY ${eduLtHS} jurors
- "HS Diploma/GED": EXACTLY ${eduHS} jurors
- "Some College/Associates": EXACTLY ${eduSome} jurors
- "Bachelor's": EXACTLY ${eduBA} jurors
- "Graduate/Professional": EXACTLY ${eduGrad} jurors
⚠️ DO NOT shift Graduate/Professional into Bachelor's or vice versa. These counts are LOCKED.

**Geographic_Segment** (use county-specific names, not generic):
- Urban: EXACTLY ${geoUrban} jurors (use "${census.county_name} City" or specific towns)
- Suburban: EXACTLY ${geoSub} jurors (use corridor/suburb names specific to ${census.county_name} County)
- Rural: EXACTLY ${geoRural} jurors (use "Rural ${census.county_name}" or specific rural community names)

**Gender**: ~48% Male, ~52% Female

**Age_Bracket** (MANDATORY counts — county median age is ${census.median_age}):
- "18-24": EXACTLY ${ageDist['18-24']} jurors
- "25-34": EXACTLY ${ageDist['25-34']} jurors
- "35-44": EXACTLY ${ageDist['35-44']} jurors
- "45-54": EXACTLY ${ageDist['45-54']} jurors
- "55-64": EXACTLY ${ageDist['55-64']} jurors
- "65-75": EXACTLY ${ageDist['65-75']} jurors
⚠️ These counts are LOCKED. Each juror's Age must fall within their Age_Bracket range.

**Generation** (auto-derive from Age — MUST match):
- Age 18-28 → "Gen Z"
- Age 29-44 → "Millennial"
- Age 45-60 → "Gen X"
- Age 61-75 → "Boomer"

**Political_Registration** (approximate):
- "Republican": ~${repPct}%, "Democrat": ~${demPct}%, "Independent": ~${indPct}%, "Unaffiliated": ~${unaffPct}%, "Not Registered": ~${notRegPct}%

**Vote_2024** (correlate with registration):
- Republicans: ~85% "Trump2024", ~5% "Harris2024", ~7% "Did Not Vote", ~3% "Third Party"
- Democrats: ~5% "Trump2024", ~82% "Harris2024", ~8% "Did Not Vote", ~5% "Third Party"
- Independent: ~35% "Trump2024", ~28% "Harris2024", ~27% "Did Not Vote", ~10% "Third Party"
- Unaffiliated/Not Registered: ~15% "Trump2024", ~12% "Harris2024", ~60% "Did Not Vote", ~13% "Third Party"

**Homeownership**: ~${census.pct_homeowners}% "Owner", ~${census.pct_renters}% "Renter"

**Housing_Type** (correlate with income and homeownership):
- Owners: mostly "Single Family", some "Mobile Home" (especially rural/lower income)
- Renters: mix of "Multi-Family" and "Single Family", some "Mobile Home"
- Rural/lower income: higher "Mobile Home" percentage

**Years_in_County** (correlate with Age):
- Age 18-24: mostly "Less than 2 years" or "2-9 years"
- Age 25-44: mix of "2-9 years" and "10-19 years"
- Age 45+: mostly "10-19 years" or "20+ years"

**Employment_Status** (correlate with Age and Occupation):
- Age 65+: ~55% "Retired", rest "Part-Time" or "Not in Labor Force"
- Age 58-64: ~15% "Retired", rest "Full-Time" or "Part-Time"
- Under 58: mostly "Full-Time", some "Part-Time", few "Unemployed"
- Homemakers/Students: "Not in Labor Force"

**Employer_Type** (correlate with Occupation):
- Government workers → "Government"
- Business owners → "Self-Employed"
- Nonprofits/Social Services → "Nonprofit"
- Retired/Unemployed/Homemaker → "Not Employed"
- Everyone else → "Private Sector"

**Veteran**: ~8% true, higher for males and older jurors

**Disability_Status**: ~12% "Yes", higher for older jurors and lower income

**Healthcare_Connection**: ~74% "None", ~26% have a connection:
- "Self — Direct Healthcare Employee" (if occupation is healthcare)
- "Spouse in Healthcare"
- "Parent/Child in Healthcare"

**Prior_Jury_Service** (correlate with Age): ~20% "Yes", higher for older jurors
- Age 18-34: ~8% "Yes"
- Age 35-54: ~18% "Yes"
- Age 55+: ~35% "Yes"

**Litigation_History**: ~85% null, remainder:
- "Prior Plaintiff" (~8%), "Prior Defendant" (~4%), null for rest

=== COUNTY CONTEXT: ${census.county_name.toUpperCase()} COUNTY, ${census.state_name.toUpperCase()} ===
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
"Weekly or more", "2-3x per month", "Monthly", "Occasionally", "Rarely/Never"
Correlate: None/Agnostic/Atheist → "Rarely/Never"; SBC Evangelical → more "Weekly or more"

=== NEWS SOURCE ===
Use ONLY these exact strings:
${NEWS_SOURCES.map(n => `"${n}"`).join(', ')}
Correlate: Republican → "Fox News/Conservative Media"; Democrat → "CNN/MSNBC"; Younger → "Social Media"/"Online News"

=== MARITAL STATUS ===
"Single/Never Married", "Married", "Divorced", "Widowed", "Separated"
Age-weighted: <25 mostly Single/Never Married; 25-40 mix; 40+ more Married/Divorced

=== NUMBER OF CHILDREN ===
0-5, age-constrained: under 22 max 1, under 25 max 2

=== HOUSEHOLD INCOME ===
Integer 12000-250000. Correlate with education:
- Less than HS: $12,000-$35,000
- HS Diploma/GED: $22,000-$55,000
- Some College/Associates: $30,000-$75,000
- Bachelor's: $45,000-$120,000
- Graduate/Professional: $65,000-$250,000

=== OUTPUT FORMAT ===
Return ONLY a JSON array. No markdown fences, no explanation. IDs use format "${countyPrefix}NNNN" starting at ${countyPrefix}${String(startId).padStart(4, '0')}.

[
  {
    "ID": "${countyPrefix}${String(startId).padStart(4, '0')}",
    "First_Name": "James",
    "Last_Name": "Mitchell",
    "Age": 52,
    "Age_Bracket": "45-54",
    "Generation": "Gen X",
    "Gender": "Male",
    "Race": "White",
    "Geographic_Segment": "${census.county_name} City",
    "Years_in_County": "20+ years",
    "Homeownership": "Owner",
    "Housing_Type": "Single Family",
    "Education": "HS Diploma/GED",
    "Employment_Status": "Full-Time",
    "Employer_Type": "Private Sector",
    "Occupation": "Construction/Trades",
    "Household_Income": 48000,
    "Healthcare_Connection": null,
    "Marital_Status": "Married",
    "Number_of_Children": 2,
    "Veteran": false,
    "Disability_Status": "No",
    "Political_Registration": "Republican",
    "Vote_2024": "Trump2024",
    "Religion": "SBC Evangelical",
    "Church_Attendance": "Weekly or more",
    "Primary_News_Source": "Fox News/Conservative Media",
    "Prior_Jury_Service": "No",
    "Litigation_History": null
  }
]

CRITICAL: Generate EXACTLY ${batchSize} jurors. Match the EXACT demographic counts above. Use ONLY the valid enum values listed. DO NOT include psychographic scores — we calculate those from the core fields.`;
}

interface BatchResult {
  batchNumber: number;
  jurors: SyntheticJuror[];
  inputTokens: number;
  outputTokens: number;
}

/**
 * Transform a raw JSON juror object into a SyntheticJuror with computed psychographic fields.
 */
function transformJuror(
  raw: Record<string, unknown>,
  countyName: string,
  batchId: string,
): SyntheticJuror {
  const jurorId = String(raw.ID || '');
  const jurorNum = parseInt(jurorId.replace(/\D/g, ''), 10) || 0;
  const uniqueId = `${countyName.toLowerCase().replace(/\s+/g, '_')}_${jurorNum}_${batchId.substring(0, 8)}`;

  const age = clamp(Number(raw.Age) || 40, 18, 75);
  const generation = deriveGeneration(age);
  const veteran = raw.Veteran === true || raw.Veteran === 'true' || raw.Veteran === 'Yes';

  // Calculate all 6 psychographic scores + flag_color from core fields
  const psychScores = calculatePsychographicScores({
    ...raw,
    Age: age,
    Generation: generation,
    Veteran: veteran,
  });

  return {
    juror_id: uniqueId,
    county_name: countyName,
    juror_number: jurorNum,
    first_name: String(raw.First_Name || 'Unknown'),
    last_name: String(raw.Last_Name || 'Unknown'),
    age,
    age_bracket: String(raw.Age_Bracket || getAgeBracket(age)),
    generation,
    gender: raw.Gender === 'Female' ? 'Female' : 'Male',
    race: normalizeRace(String(raw.Race || 'White')),
    geographic_segment: String(raw.Geographic_Segment || countyName),
    years_in_county: normalizeYearsInCounty(String(raw.Years_in_County || ''), age),
    homeownership: raw.Homeownership === 'Renter' ? 'Renter' : 'Owner',
    housing_type: normalizeHousingType(String(raw.Housing_Type || 'Single Family')),
    education: normalizeEducation(String(raw.Education || 'HS Diploma/GED')),
    employment_status: normalizeEmploymentStatus(String(raw.Employment_Status || 'Full-Time'), age),
    employer_type: normalizeEmployerType(String(raw.Employer_Type || 'Private Sector')),
    occupation: String(raw.Occupation || 'Retail/Sales'),
    household_income: clamp(Number(raw.Household_Income) || 45000, 12000, 250000),
    healthcare_connection: raw.Healthcare_Connection && raw.Healthcare_Connection !== 'None'
      ? String(raw.Healthcare_Connection)
      : null,
    marital_status: normalizeMaritalStatus(String(raw.Marital_Status || 'Single/Never Married')),
    number_of_children: clamp(Number(raw.Number_of_Children) || 0, 0, 5),
    veteran,
    disability_status: raw.Disability_Status === 'Yes' ? 'Yes' : 'No',
    political_registration: normalizePolitical(String(raw.Political_Registration || 'Independent')),
    vote_2024: normalizeVote(String(raw.Vote_2024 || 'Did Not Vote')),
    religion: normalizeReligion(String(raw.Religion || 'Other')),
    church_attendance: normalizeChurch(String(raw.Church_Attendance || 'Rarely/Never')),
    primary_news_source: normalizeNewsSource(String(raw.Primary_News_Source || 'Local TV/Radio')),
    prior_jury_service: raw.Prior_Jury_Service === 'Yes' || raw.Prior_Jury_Service === true ? 'Yes' : 'No',
    litigation_history: raw.Litigation_History ? normalizeLitigationHistory(String(raw.Litigation_History)) : null,
    flag_color: psychScores.flag_color,
    tort_reform_attitude: psychScores.tort_reform_attitude,
    authority_deference: psychScores.authority_deference,
    healthcare_trust: psychScores.healthcare_trust,
    damages_receptivity: psychScores.damages_receptivity,
    plaintiff_composite_score: psychScores.plaintiff_composite_score,
    juror_archetype: psychScores.juror_archetype,
    generation_batch_id: batchId,
  };
}

// --- Normalizer functions ---

function getAgeBracket(age: number): string {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65-75';
}

function normalizeGeneration(gen: string, age: number): string {
  const l = gen.toLowerCase();
  if (l.includes('gen z') || l.includes('genz')) return 'Gen Z';
  if (l.includes('millennial')) return 'Millennial';
  if (l.includes('gen x') || l.includes('genx')) return 'Gen X';
  if (l.includes('boomer')) return 'Boomer';
  if (l.includes('silent')) return 'Silent';
  return deriveGeneration(age);
}

function normalizeRace(race: string): string {
  const l = race.toLowerCase();
  if (l.includes('white') || l.includes('caucasian')) return 'White';
  if (l.includes('black') || l.includes('african')) return 'Black';
  if (l.includes('hispanic') || l.includes('latino')) return 'Hispanic';
  if (l.includes('asian')) return 'Asian';
  if (l.includes('multiracial') || l.includes('multi')) return 'Multiracial';
  return 'Other';
}

function normalizeEducation(edu: string): string {
  const l = edu.toLowerCase();
  if (l.includes('less than') || l.includes('no hs') || l.includes('did not') || l.includes('dropout')) return 'Less than HS';
  if (l.includes('graduate') || l.includes('professional') || l.includes('master') || l.includes('doctor') || l.includes('phd') || l.includes('jd') || l.includes('md')) return 'Graduate/Professional';
  if (l.includes('bachelor')) return "Bachelor's";
  if (l.includes('some college') || l.includes('associate') || l.includes('trade') || l.includes('vocational')) return 'Some College/Associates';
  if (l.includes('hs') || l.includes('high school') || l.includes('ged') || l.includes('diploma')) return 'HS Diploma/GED';
  return 'HS Diploma/GED';
}

function normalizeMaritalStatus(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('married') && !l.includes('never')) return 'Married';
  if (l.includes('divorced')) return 'Divorced';
  if (l.includes('widowed')) return 'Widowed';
  if (l.includes('separated')) return 'Separated';
  return 'Single/Never Married';
}

function normalizePolitical(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('republican')) return 'Republican';
  if (l.includes('democrat')) return 'Democrat';
  if (l.includes('independent')) return 'Independent';
  if (l.includes('unaffiliated')) return 'Unaffiliated';
  return 'Not Registered';
}

function normalizeVote(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('trump')) return 'Trump2024';
  if (l.includes('harris')) return 'Harris2024';
  if (l.includes('did not') || l.includes('none') || l.includes('didn')) return 'Did Not Vote';
  return 'Third Party';
}

function normalizeChurch(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('weekly')) return 'Weekly or more';
  if (l.includes('2-3') || l.includes('twice') || l.includes('bi-weekly')) return '2-3x per month';
  if (l.includes('monthly')) return 'Monthly';
  if (l.includes('occasionally') || l.includes('few') || l.includes('sometimes')) return 'Occasionally';
  return 'Rarely/Never';
}

function normalizeReligion(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('sbc') || (l.includes('southern') && l.includes('baptist'))) return 'SBC Evangelical';
  if (l === 'ame' || l.includes('ame ') || l.includes('african methodist')) return 'AME';
  if (l === 'umc' || l.includes('united methodist')) return 'UMC';
  if (l.includes('non-denom') && l.includes('evangelical')) return 'Non-Denom Evangelical';
  if (l.includes('catholic')) return 'Catholic';
  if (l.includes('baptist') && !l.includes('southern') && !l.includes('sbc')) return 'Baptist';
  if (l.includes('jewish') || l.includes('judaism')) return 'Jewish';
  if (l.includes('none') || l.includes('agnostic') || l.includes('atheist') || l.includes('unaffiliated')) return 'None/Agnostic/Atheist';
  return 'Other';
}

function normalizeNewsSource(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('npr') || l.includes('pbs')) return 'NPR/PBS';
  if (l.includes('fox') || l.includes('conservative')) return 'Fox News/Conservative Media';
  if (l.includes('cnn') || l.includes('msnbc')) return 'CNN/MSNBC';
  if (l.includes('local') || l.includes('tv') || l.includes('radio')) return 'Local TV/Radio';
  if (l.includes('online') || l.includes('news site') || l.includes('web')) return 'Online News';
  if (l.includes('social') || l.includes('facebook') || l.includes('tiktok') || l.includes('twitter')) return 'Social Media';
  return 'Mixed/Varied';
}

function normalizeYearsInCounty(s: string, age: number): string {
  const l = s.toLowerCase();
  if (l.includes('less than 2') || l.includes('< 2') || l.includes('under 2')) return 'Less than 2 years';
  if (l.includes('2-9') || l.includes('2 to 9')) return '2-9 years';
  if (l.includes('10-19') || l.includes('10 to 19')) return '10-19 years';
  if (l.includes('20+') || l.includes('20 or') || l.includes('over 20')) return '20+ years';
  // Fallback based on age
  if (age < 25) return '2-9 years';
  if (age < 40) return '10-19 years';
  return '20+ years';
}

function normalizeHousingType(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('multi') || l.includes('apartment') || l.includes('condo') || l.includes('townho')) return 'Multi-Family';
  if (l.includes('mobile') || l.includes('manufactured') || l.includes('trailer')) return 'Mobile Home';
  return 'Single Family';
}

function normalizeEmploymentStatus(s: string, age: number): string {
  const l = s.toLowerCase();
  if (l.includes('retired')) return 'Retired';
  if (l.includes('full')) return 'Full-Time';
  if (l.includes('part')) return 'Part-Time';
  if (l.includes('unemployed')) return 'Unemployed';
  if (l.includes('not in') || l.includes('homemaker') || l.includes('student') || l.includes('disability')) return 'Not in Labor Force';
  if (age >= 65) return 'Retired';
  return 'Full-Time';
}

function normalizeEmployerType(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('government') || l.includes('public')) return 'Government';
  if (l.includes('self')) return 'Self-Employed';
  if (l.includes('nonprofit') || l.includes('non-profit')) return 'Nonprofit';
  if (l.includes('not employed') || l.includes('n/a') || l.includes('retired')) return 'Not Employed';
  return 'Private Sector';
}

function normalizeLitigationHistory(s: string): string | null {
  const l = s.toLowerCase();
  if (l.includes('plaintiff')) return 'Prior Plaintiff';
  if (l.includes('defendant')) return 'Prior Defendant';
  if (l === 'none' || l === 'null' || l === 'n/a') return null;
  return null;
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
 * Randy v2.1: 30 core fields from Claude + 6 computed psychographic fields.
 */
export async function generateJuryPool(options: GenerationOptions): Promise<GenerationResult> {
  const { countyName, totalJurors = config.jurorsPerCounty, fresh = false } = options;
  const batchSize = config.batchSize;
  const totalBatches = Math.ceil(totalJurors / batchSize);
  const batchId = uuidv4();

  const census = await getCountyDemographics(countyName);
  if (!census) {
    throw new Error(`County "${countyName}" not found in database. Run 'npm run setup' first.`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`GENERATING JURY POOL (Randy v2.1): ${countyName} County, ${census.state_name}`);
  console.log(`Total jurors: ${totalJurors} | Batches: ${totalBatches} | Batch size: ${batchSize}`);
  console.log(`Schema: 30 core fields + 6 computed psychographic fields = 36 total`);
  console.log(`Concurrency: ${PARALLEL_CONCURRENCY} parallel batches`);
  console.log(`Batch ID: ${batchId}`);
  console.log('='.repeat(60));

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
