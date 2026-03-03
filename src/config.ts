import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export interface Config {
  anthropicApiKey: string;
  databaseUrl: string;
  claudeModel: string;
  jurorsPerCounty: number;
  batchSize: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  rateLimitDelayMs: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`ERROR: Missing required environment variable: ${key}`);
    console.error(`Please create a .env file based on .env.example`);
    process.exit(1);
  }
  return value;
}

export const config: Config = {
  anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  databaseUrl: requireEnv('DATABASE_URL'),
  claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  jurorsPerCounty: parseInt(process.env.JURORS_PER_COUNTY || '1200', 10),
  batchSize: 25,
  maxRetries: 3,
  retryBaseDelayMs: 2000,
  rateLimitDelayMs: 1000,
};
