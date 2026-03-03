import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';
import { sleep } from './helpers';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Call Claude API using streaming to handle large responses.
 * Retries up to config.maxRetries times on transient failures with exponential backoff.
 */
export async function callClaude(prompt: string): Promise<ClaudeResponse> {
  const anthropic = getClient();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      // Use streaming to avoid timeout on large responses
      const stream = await anthropic.messages.stream({
        model: config.claudeModel,
        max_tokens: 64000,
        temperature: 0.85,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Collect streamed text chunks
      let content = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          content += event.delta.text;
        }
      }

      // Get final message for usage stats
      const finalMessage = await stream.finalMessage();

      if (!content) {
        throw new Error('No text content in Claude response');
      }

      return {
        content,
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
      };
    } catch (error) {
      lastError = error as Error;
      const errorMsg = lastError.message || String(error);

      // Check if it's a rate limit or overloaded error (retryable)
      const isRetryable =
        errorMsg.includes('rate_limit') ||
        errorMsg.includes('overloaded') ||
        errorMsg.includes('529') ||
        errorMsg.includes('500') ||
        errorMsg.includes('503') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('ECONNRESET') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('EPIPE') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('socket hang up') ||
        errorMsg.includes('network') ||
        errorMsg.includes('aborted');

      if (isRetryable && attempt < config.maxRetries) {
        const delay = config.retryBaseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `  API attempt ${attempt}/${config.maxRetries} failed: ${errorMsg.substring(0, 100)}`
        );
        console.warn(`  Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else if (!isRetryable) {
        throw error;
      }
    }
  }

  throw new Error(
    `Claude API failed after ${config.maxRetries} attempts. Last error: ${lastError?.message}`
  );
}
