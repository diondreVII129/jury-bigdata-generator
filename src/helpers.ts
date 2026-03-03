import { SyntheticJuror } from './database';

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate the percentage of items matching a predicate.
 */
export function calculatePercentage<T>(items: T[], predicate: (item: T) => boolean): number {
  if (items.length === 0) return 0;
  const count = items.filter(predicate).length;
  return Math.round((count / items.length) * 1000) / 10;
}

/**
 * Calculate the median of a numeric array.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Parse a JSON array of jurors from Claude's response.
 * Handles markdown code fences, trailing commas, and other common issues.
 */
export function parseJurorJSON(raw: string): Record<string, unknown>[] {
  let cleaned = raw.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // If the response starts with something before the array, try to find the array
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
  }

  // Fix trailing commas before ] or }
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Fix unescaped newlines inside strings (common LLM issue)
  cleaned = cleaned.replace(/(?<=": "(?:[^"\\]|\\.)*)(?<!\\")\n(?=[^"]*")/g, '\\n');

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('Parsed JSON is not an array');
    }
    return parsed;
  } catch (firstError) {
    // Try line-by-line object extraction as fallback
    console.warn('  Standard JSON parse failed, attempting object-by-object extraction...');
    const objects: Record<string, unknown>[] = [];
    let depth = 0;
    let currentObj = '';
    let inString = false;
    let prevChar = '';

    for (const char of cleaned) {
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') {
          if (depth === 0) currentObj = '';
          depth++;
        }
        if (char === '}') {
          depth--;
          if (depth === 0) {
            currentObj += char;
            try {
              // Fix trailing commas in the individual object
              const fixedObj = currentObj.replace(/,\s*([}\]])/g, '$1');
              objects.push(JSON.parse(fixedObj));
            } catch {
              console.warn('  Skipping unparseable juror object');
            }
            currentObj = '';
            prevChar = char;
            continue;
          }
        }
      }

      if (depth > 0) {
        currentObj += char;
      }
      prevChar = char;
    }

    if (objects.length === 0) {
      throw new Error(`Failed to parse any juror objects from response: ${(firstError as Error).message}`);
    }

    console.warn(`  Extracted ${objects.length} juror objects via fallback parser`);
    return objects;
  }
}

/**
 * Normalize a race string to a standard category.
 */
export function normalizeRace(race: string): string {
  const lower = race.toLowerCase().trim();
  if (lower.includes('white') || lower.includes('caucasian')) return 'White';
  if (lower.includes('black') || lower.includes('african')) return 'Black';
  if (lower.includes('hispanic') || lower.includes('latino') || lower.includes('latina')) return 'Hispanic';
  if (lower.includes('asian')) return 'Asian';
  return 'Other';
}

/**
 * Normalize an education string to a standard category.
 */
export function normalizeEducation(education: string): string {
  const lower = education.toLowerCase().trim();
  if (lower.includes('graduate') || lower.includes('master') || lower.includes('doctorate') || lower.includes('phd') || lower.includes('jd') || lower.includes('md')) {
    return 'Graduate Degree';
  }
  if (lower.includes('bachelor') || lower.includes("bachelor's") || lower.includes('4-year') || lower.includes('four-year')) {
    return "Bachelor's Degree";
  }
  if (lower.includes('some college') || lower.includes('associate') || lower.includes('2-year') || lower.includes('two-year') || lower.includes('trade') || lower.includes('vocational') || lower.includes('technical')) {
    return 'Some College';
  }
  if (lower.includes('high school') || lower.includes('hs') || lower.includes('ged') || lower.includes('diploma')) {
    return 'High School';
  }
  if (lower.includes('less than') || lower.includes('no diploma') || lower.includes('some high') || lower.includes('no hs') || lower.includes('did not')) {
    return 'Less Than High School';
  }
  return 'High School'; // default
}

/**
 * Clamp a numeric value to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
