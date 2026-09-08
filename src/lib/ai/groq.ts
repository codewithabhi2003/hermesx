import Groq from 'groq-sdk';
import type { ZodSchema } from 'zod';
import { env } from '@/lib/env';
import { AIError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * All Groq-specific wiring lives in this single file. Nothing else in the
 * codebase should import `groq-sdk` directly or reference `GROQ_MODEL` —
 * this keeps the provider swappable and the model name from being
 * scattered across services, per the project brief.
 */

const client = new Groq({ apiKey: env.GROQ_API_KEY });

const MAX_STRUCTURED_ATTEMPTS = 2;

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

/**
 * Plain-text completion — used where we don't need a validated JSON shape
 * (currently unused directly by routes, but available for future
 * lower-stakes text generation).
 */
export async function completeText(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: env.GROQ_MODEL,
      messages,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new AIError('The AI provider returned an empty response.');
    }
    return text;
  } catch (error) {
    logger.error('Groq text completion failed', { message: String(error) });
    throw new AIError();
  }
}

/**
 * Structured JSON completion, validated against `schema`.
 *
 * Flow: raw provider response -> JSON parse -> Zod validation -> caller.
 * Never trust the LLM output directly. Malformed structured output is
 * retried ONCE with a corrective follow-up instruction; after
 * `MAX_STRUCTURED_ATTEMPTS` total attempts we surface an `AIError` rather
 * than retrying indefinitely.
 */
export async function completeStructured<T>(
  messages: ChatMessage[],
  schema: ZodSchema<T>
): Promise<T> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_STRUCTURED_ATTEMPTS; attempt += 1) {
    const attemptMessages: ChatMessage[] =
      attempt === 1
        ? messages
        : [
            ...messages,
            {
              role: 'user',
              content: `Your previous response was invalid: ${lastError}. Respond again with ONLY valid JSON matching the required schema — no prose, no markdown fences.`,
            },
          ];

    try {
      const response = await client.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: attemptMessages,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        lastError = 'empty response';
        continue;
      }

      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsedJson = JSON.parse(cleaned);
      const validated = schema.safeParse(parsedJson);

      if (validated.success) {
        return validated.data;
      }

      lastError = JSON.stringify(validated.error.flatten());
      logger.warn('Groq structured output failed validation', {
        attempt,
        error: lastError,
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      logger.warn('Groq structured output request failed', { attempt, error: lastError });
    }
  }

  throw new AIError('The AI provider returned an invalid response after retrying.');
}
