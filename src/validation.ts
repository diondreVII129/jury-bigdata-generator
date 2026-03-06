import { CountyDemographics, SyntheticJuror } from './database';
import { calculatePercentage, calculateMedian } from './helpers';

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  details: {
    totalJurors: number;
    race: { target: Record<string, number>; actual: Record<string, number> };
    medianAge: { target: number; actual: number; diff: number };
    ageBrackets: { target: Record<string, number>; actual: Record<string, number> };
    education: { target: Record<string, number>; actual: Record<string, number> };
    gender: { actual: Record<string, number> };
    archetypes: Record<string, number>;
    avgPCS: number;
  };
}

export function validateJuryDemographics(
  jurors: SyntheticJuror[],
  census: CountyDemographics
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const total = jurors.length;

  if (total === 0) {
    return {
      passed: false, errors: ['No jurors to validate'], warnings: [],
      details: { totalJurors: 0, race: { target: {}, actual: {} }, medianAge: { target: 0, actual: 0, diff: 0 }, ageBrackets: { target: {}, actual: {} }, education: { target: {}, actual: {} }, gender: { actual: {} }, archetypes: {}, avgPCS: 0 },
    };
  }

  // Race validation (±5% tolerance — reasonable for synthetic data)
  const raceTarget: Record<string, number> = {
    White: census.pct_white,
    Black: census.pct_black,
    Hispanic: census.pct_hispanic,
    Other: 100 - census.pct_white - census.pct_black - census.pct_hispanic,
  };
  const raceActual: Record<string, number> = {
    White: calculatePercentage(jurors, (j) => j.race === 'White'),
    Black: calculatePercentage(jurors, (j) => j.race === 'Black'),
    Hispanic: calculatePercentage(jurors, (j) => j.race === 'Hispanic'),
    Other: calculatePercentage(jurors, (j) => j.race === 'Other'),
  };
  for (const race of Object.keys(raceTarget)) {
    const diff = Math.abs(raceActual[race] - raceTarget[race]);
    if (diff > 5.0) errors.push(`Race "${race}": target ${raceTarget[race]}%, actual ${raceActual[race]}% (diff ${diff.toFixed(1)}%)`);
    else if (diff > 3.0) warnings.push(`Race "${race}": ${raceTarget[race]}% vs ${raceActual[race]}%`);
  }

  // Median age (±2 years)
  const ages = jurors.map((j) => j.age);
  const actualMedianAge = calculateMedian(ages);
  const ageDiff = Math.abs(actualMedianAge - census.median_age);
  if (ageDiff > 2) errors.push(`Median age: target ${census.median_age}, actual ${actualMedianAge}`);

  // Age bracket validation (±5% tolerance)
  const ageBracketTarget: Record<string, number> = (() => {
    if (census.median_age > 45) return { '18-24': 8, '25-34': 12, '35-44': 16, '45-54': 22, '55-64': 22, '65-75': 20 };
    if (census.median_age >= 35) return { '18-24': 10, '25-34': 18, '35-44': 20, '45-54': 20, '55-64': 17, '65-75': 15 };
    return { '18-24': 14, '25-34': 22, '35-44': 20, '45-54': 18, '55-64': 14, '65-75': 12 };
  })();
  const ageBracketActual: Record<string, number> = {
    '18-24': calculatePercentage(jurors, (j) => j.age_bracket === '18-24'),
    '25-34': calculatePercentage(jurors, (j) => j.age_bracket === '25-34'),
    '35-44': calculatePercentage(jurors, (j) => j.age_bracket === '35-44'),
    '45-54': calculatePercentage(jurors, (j) => j.age_bracket === '45-54'),
    '55-64': calculatePercentage(jurors, (j) => j.age_bracket === '55-64'),
    '65-75': calculatePercentage(jurors, (j) => j.age_bracket === '65-75'),
  };
  for (const bracket of Object.keys(ageBracketTarget)) {
    const diff = Math.abs(ageBracketActual[bracket] - ageBracketTarget[bracket]);
    if (diff > 5.0) errors.push(`Age "${bracket}": target ${ageBracketTarget[bracket]}%, actual ${ageBracketActual[bracket]}%`);
    else if (diff > 3.0) warnings.push(`Age "${bracket}": ${ageBracketTarget[bracket]}% vs ${ageBracketActual[bracket]}%`);
  }

  // Education (±5%)
  const eduTarget: Record<string, number> = {
    'Less than HS': census.pct_less_than_hs,
    'HS Diploma/GED': census.pct_hs_graduate,
    'Some College/Associates': census.pct_some_college,
    "Bachelor's Degree": census.pct_bachelors_degree,
    'Graduate/Professional': census.pct_graduate_degree,
  };
  const eduActual: Record<string, number> = {
    'Less than HS': calculatePercentage(jurors, (j) => j.education === 'Less than HS'),
    'HS Diploma/GED': calculatePercentage(jurors, (j) => j.education === 'HS Diploma/GED'),
    'Some College/Associates': calculatePercentage(jurors, (j) => j.education === 'Some College/Associates'),
    "Bachelor's Degree": calculatePercentage(jurors, (j) => j.education === "Bachelor's Degree"),
    'Graduate/Professional': calculatePercentage(jurors, (j) => j.education === 'Graduate/Professional'),
  };
  for (const edu of Object.keys(eduTarget)) {
    const diff = Math.abs(eduActual[edu] - eduTarget[edu]);
    if (diff > 5.0) errors.push(`Education "${edu}": target ${eduTarget[edu]}%, actual ${eduActual[edu]}%`);
    else if (diff > 3.0) warnings.push(`Education "${edu}": ${eduTarget[edu]}% vs ${eduActual[edu]}%`);
  }

  // Gender
  const genderActual: Record<string, number> = {
    Male: calculatePercentage(jurors, (j) => j.gender === 'Male'),
    Female: calculatePercentage(jurors, (j) => j.gender === 'Female'),
  };

  // Archetypes
  const archetypes: Record<string, number> = {
    'Strong Plaintiff': jurors.filter((j) => j.juror_archetype === 'Strong Plaintiff').length,
    'Lean Plaintiff': jurors.filter((j) => j.juror_archetype === 'Lean Plaintiff').length,
    'True Swing': jurors.filter((j) => j.juror_archetype === 'True Swing').length,
    'Lean Defense': jurors.filter((j) => j.juror_archetype === 'Lean Defense').length,
    'Strong Defense': jurors.filter((j) => j.juror_archetype === 'Strong Defense').length,
  };

  const avgPCS = Math.round(jurors.reduce((sum, j) => sum + j.plaintiff_composite_score, 0) / total * 10) / 10;

  return {
    passed: errors.length === 0,
    errors, warnings,
    details: { totalJurors: total, race: { target: raceTarget, actual: raceActual }, medianAge: { target: census.median_age, actual: actualMedianAge, diff: ageDiff }, ageBrackets: { target: ageBracketTarget, actual: ageBracketActual }, education: { target: eduTarget, actual: eduActual }, gender: { actual: genderActual }, archetypes, avgPCS },
  };
}

export function printValidation(result: ValidationResult, countyName: string): void {
  console.log(`\n=== Validation: ${countyName} (${result.details.totalJurors} jurors) ===`);
  console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach((e) => console.log(`  x ${e}`));
  }
  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach((w) => console.log(`  ! ${w}`));
  }

  console.log('\nRace:', Object.entries(result.details.race.actual).map(([k, v]) => `${k}=${v}%`).join(', '));
  console.log(`Median Age: target=${result.details.medianAge.target} actual=${result.details.medianAge.actual}`);
  if (result.details.ageBrackets) {
    console.log('Age Brackets:', Object.entries(result.details.ageBrackets.actual).map(([k, v]) => `${k}=${v}%`).join(', '));
  }
  console.log('Education:', Object.entries(result.details.education.actual).map(([k, v]) => `${k}=${v}%`).join(', '));
  console.log(`Gender: M=${result.details.gender.actual.Male}% F=${result.details.gender.actual.Female}%`);
  console.log(`Avg PCS: ${result.details.avgPCS}`);
  console.log('Archetypes:', Object.entries(result.details.archetypes).map(([k, v]) => `${k}=${v}`).join(', '));
  console.log('');
}
