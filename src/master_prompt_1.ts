import Anthropic from '@anthropic-ai/sdk';
import { CountyDemographics } from './database';

// --- Types ---

export interface VenueAnalysis {
  plaintiff_favorability_score: number;
  key_demographic_advantages: string[];
  key_demographic_disadvantages: string[];
  venue_strategy_summary: string;
  jury_composition_recommendations: {
    ideal_juror_profile: string;
    jurors_to_avoid: string;
    voir_dire_focus_areas: string[];
  };
}

// --- Lazy Anthropic client (avoids requiring API key at import time) ---

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for venue analysis');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// --- Prompt ---

function buildVenueAnalysisPrompt(census: CountyDemographics): string {
  return `You are a jury consultant AI analyzing ${census.county_name} County, South Carolina for plaintiff venue analysis in a medical malpractice / personal injury case.

=== COUNTY DEMOGRAPHICS ===
- County: ${census.county_name} County, SC
- Population: ${census.total_population.toLocaleString()}
- Median Age: ${census.median_age}

RACE:
- White: ${census.pct_white}%
- Black: ${census.pct_black}%
- Hispanic: ${census.pct_hispanic}%
- Asian: ${census.pct_asian}%

EDUCATION:
- Less than HS: ${census.pct_less_than_hs}%
- HS Graduate: ${census.pct_hs_graduate}%
- Some College: ${census.pct_some_college}%
- Bachelor's Degree: ${census.pct_bachelors_degree}%
- Graduate Degree: ${census.pct_graduate_degree}%

ECONOMICS:
- Median Household Income: $${census.median_household_income.toLocaleString()}
- Per Capita Income: $${census.per_capita_income.toLocaleString()}
- Below Poverty: ${census.pct_below_poverty}%
- Unemployment: ${census.unemployment_rate}%
- Blue Collar: ${census.pct_blue_collar}%
- White Collar: ${census.pct_white_collar}%
- Service Industry: ${census.pct_service_industry}%

TOP INDUSTRIES:
1. ${census.top_industry_1} (${census.top_industry_1_pct}%)
2. ${census.top_industry_2} (${census.top_industry_2_pct}%)
3. ${census.top_industry_3} (${census.top_industry_3_pct}%)

HOUSING:
- Median Home Value: $${census.median_home_value.toLocaleString()}
- Homeowners: ${census.pct_homeowners}%
- Renters: ${census.pct_renters}%

GEOGRAPHY:
- Urbanization: ${census.urbanization}
- Urban: ${census.pct_urban}%
- Suburban: ${census.pct_suburban}%
- Rural: ${census.pct_rural}%

POLITICAL / CULTURAL:
- Political Lean: ${census.political_lean}
- Evangelical: ${census.pct_evangelical}%

=== TASK ===
Analyze this county as a potential venue for a plaintiff in a medical malpractice or personal injury case. Consider:
1. How favorable the jury pool demographics are for a plaintiff
2. Which demographic factors help the plaintiff
3. Which demographic factors hurt the plaintiff
4. Overall venue strategy recommendations
5. Ideal juror profile and jurors to avoid during voir dire

Return your analysis as a JSON object with EXACTLY this structure. Return ONLY the JSON, no markdown fences, no explanation:

{
  "plaintiff_favorability_score": <integer 0-100, where 100 is most favorable to plaintiff>,
  "key_demographic_advantages": [<3-5 strings describing advantages for plaintiff>],
  "key_demographic_disadvantages": [<2-4 strings describing disadvantages for plaintiff>],
  "venue_strategy_summary": "<2-3 sentence strategic assessment>",
  "jury_composition_recommendations": {
    "ideal_juror_profile": "<description of the ideal juror for plaintiff>",
    "jurors_to_avoid": "<description of jurors plaintiff should strike>",
    "voir_dire_focus_areas": [<3-5 key topics to probe during voir dire>]
  }
}

Base the plaintiff_favorability_score on these factors:
- Higher poverty/lower income = more favorable (jurors empathize with plaintiffs, receptive to damages)
- Higher minority percentage = more favorable (historically more plaintiff-friendly)
- Lower education = slightly more favorable (less skeptical of expert testimony)
- More blue collar = more favorable (empathy with working people harmed by institutions)
- More rural = mixed (can be suspicious of institutions but also conservative)
- More conservative/evangelical = less favorable (tort reform, personal responsibility mindset)
- Older median age = mixed (more health concerns but more conservative)`;
}

// --- Parse response ---

function parseVenueAnalysisJSON(raw: string): VenueAnalysis {
  let cleaned = raw.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // Find the JSON object
  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    cleaned = cleaned.substring(objStart, objEnd + 1);
  }

  // Fix trailing commas
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  if (typeof parsed.plaintiff_favorability_score !== 'number') {
    throw new Error('Missing or invalid plaintiff_favorability_score');
  }
  if (!Array.isArray(parsed.key_demographic_advantages)) {
    throw new Error('Missing or invalid key_demographic_advantages');
  }
  if (!Array.isArray(parsed.key_demographic_disadvantages)) {
    throw new Error('Missing or invalid key_demographic_disadvantages');
  }
  if (typeof parsed.venue_strategy_summary !== 'string') {
    throw new Error('Missing or invalid venue_strategy_summary');
  }
  if (!parsed.jury_composition_recommendations) {
    throw new Error('Missing jury_composition_recommendations');
  }

  return parsed as VenueAnalysis;
}

// --- Main export ---

export async function generateVenueAnalysis(census: CountyDemographics): Promise<VenueAnalysis> {
  const anthropic = getClient();
  const prompt = buildVenueAnalysisPrompt(census);

  const message = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  console.log(`Venue analysis tokens: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);

  return parseVenueAnalysisJSON(textBlock.text);
}
