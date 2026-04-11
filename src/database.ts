import { Pool, QueryResult } from 'pg';
import { config } from './config';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes('supabase') || config.databaseUrl.includes('railway')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const p = getPool();
  try {
    return await p.query(text, params);
  } catch (error) {
    console.error(`Database query error: ${(error as Error).message}`);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed.');
  }
}

// --- County Demographics ---

export interface CountyDemographics {
  county_id: number;
  county_name: string;
  county_fips: string;
  total_population: number;
  median_age: number;
  pct_white: number;
  pct_black: number;
  pct_hispanic: number;
  pct_asian: number;
  pct_less_than_hs: number;
  pct_hs_graduate: number;
  pct_some_college: number;
  pct_bachelors_degree: number;
  pct_graduate_degree: number;
  median_household_income: number;
  per_capita_income: number;
  pct_below_poverty: number;
  unemployment_rate: number;
  pct_blue_collar: number;
  pct_white_collar: number;
  pct_service_industry: number;
  top_industry_1: string;
  top_industry_2: string;
  top_industry_3: string;
  top_industry_1_pct: number;
  top_industry_2_pct: number;
  top_industry_3_pct: number;
  median_home_value: number;
  pct_homeowners: number;
  pct_renters: number;
  urbanization: string;
  pct_urban: number;
  pct_suburban: number;
  pct_rural: number;
  political_lean: string;
  pct_evangelical: number;
  state_name: string;
}

export async function getCountyDemographics(countyName: string): Promise<CountyDemographics | null> {
  const result = await query(
    'SELECT * FROM sc_county_demographics WHERE county_name = $1',
    [countyName]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const numericFields = [
    'median_age', 'pct_white', 'pct_black', 'pct_hispanic', 'pct_asian',
    'pct_less_than_hs', 'pct_hs_graduate', 'pct_some_college', 'pct_bachelors_degree',
    'pct_graduate_degree', 'pct_below_poverty', 'unemployment_rate',
    'pct_blue_collar', 'pct_white_collar', 'pct_service_industry',
    'top_industry_1_pct', 'top_industry_2_pct', 'top_industry_3_pct',
    'pct_homeowners', 'pct_renters', 'pct_urban', 'pct_suburban', 'pct_rural',
    'pct_evangelical'
  ];
  for (const field of numericFields) {
    if (row[field] != null) row[field] = parseFloat(row[field]);
  }
  return row as CountyDemographics;
}

export async function getAllCountyNames(): Promise<string[]> {
  const result = await query('SELECT county_name FROM sc_county_demographics ORDER BY county_name');
  return result.rows.map((r: { county_name: string }) => r.county_name);
}

export async function getJurorCountByCounty(): Promise<{ county_name: string; count: number }[]> {
  const result = await query(
    `SELECT county_name, COUNT(*) as count FROM synthetic_jurors GROUP BY county_name ORDER BY county_name`
  );
  return result.rows.map((r: { county_name: string; count: string }) => ({
    county_name: r.county_name,
    count: parseInt(r.count, 10),
  }));
}

// --- Randy v2.1 36-field Juror (30 core + 6 computed) ---

export interface SyntheticJuror {
  juror_id: string;
  county_name: string;
  juror_number: number;

  // DEMOGRAPHICS (9 core)
  first_name: string;
  last_name: string;
  age: number;
  age_bracket: string;
  generation: string;
  gender: string;
  race: string;
  geographic_segment: string;

  // RESIDENTIAL (2 core)
  years_in_county: string;
  homeownership: string;

  // HOUSING (1 core)
  housing_type: string;

  // SOCIOECONOMIC (6 core)
  education: string;
  employment_status: string;
  employer_type: string;
  occupation: string;
  household_income: number;
  healthcare_connection: string | null;

  // FAMILY (2 core)
  marital_status: string;
  number_of_children: number;

  // VETERAN/DISABILITY (2 core)
  veteran: boolean;
  disability_status: string;

  // POLITICAL (2 core)
  political_registration: string;
  vote_2024: string;

  // RELIGIOUS (2 core)
  religion: string;
  church_attendance: string;

  // MEDIA/JURY HISTORY (3 core)
  primary_news_source: string;
  prior_jury_service: string;
  litigation_history: string | null;

  // METADATA (1 core - auto-derived)
  flag_color: string;

  // 6 COMPUTED ([PROXY-INFERRED])
  tort_reform_attitude: number;
  authority_deference: number;
  healthcare_trust: number;
  damages_receptivity: number;
  plaintiff_composite_score: number;
  juror_archetype: string;

  // System metadata
  generation_batch_id: string;
}

export async function insertJurors(jurors: SyntheticJuror[]): Promise<number> {
  let inserted = 0;
  for (const j of jurors) {
    try {
      await query(
        `INSERT INTO synthetic_jurors (
          juror_id, county_name, juror_number,
          first_name, last_name, age, age_bracket, generation, gender, race, geographic_segment,
          years_in_county, homeownership, housing_type,
          education, employment_status, employer_type, occupation, household_income, healthcare_connection,
          marital_status, number_of_children,
          veteran, disability_status,
          political_registration, vote_2024,
          religion, church_attendance,
          primary_news_source, prior_jury_service, litigation_history,
          flag_color,
          tort_reform_attitude, authority_deference, healthcare_trust, damages_receptivity,
          plaintiff_composite_score, juror_archetype, generation_batch_id
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32,$33,$34,$35,$36,$37,$38,$39
        ) ON CONFLICT (juror_id) DO NOTHING`,
        [
          j.juror_id, j.county_name, j.juror_number,
          j.first_name, j.last_name, j.age, j.age_bracket, j.generation, j.gender, j.race, j.geographic_segment,
          j.years_in_county, j.homeownership, j.housing_type,
          j.education, j.employment_status, j.employer_type, j.occupation, j.household_income, j.healthcare_connection,
          j.marital_status, j.number_of_children,
          j.veteran, j.disability_status,
          j.political_registration, j.vote_2024,
          j.religion, j.church_attendance,
          j.primary_news_source, j.prior_jury_service, j.litigation_history,
          j.flag_color,
          j.tort_reform_attitude, j.authority_deference, j.healthcare_trust, j.damages_receptivity,
          j.plaintiff_composite_score, j.juror_archetype, j.generation_batch_id,
        ]
      );
      inserted++;
    } catch (error) {
      console.error(`Failed to insert juror ${j.juror_id}: ${(error as Error).message}`);
    }
  }
  return inserted;
}

export async function getJurorsForCounty(countyName: string): Promise<SyntheticJuror[]> {
  const result = await query(
    'SELECT * FROM synthetic_jurors WHERE county_name = $1 ORDER BY juror_number',
    [countyName]
  );
  return result.rows as SyntheticJuror[];
}

export async function deleteJurorsForCounty(countyName: string): Promise<number> {
  const result = await query(
    'DELETE FROM synthetic_jurors WHERE county_name = $1',
    [countyName]
  );
  return result.rowCount ?? 0;
}
