import { z } from 'zod';

/**
 * Centralized, validated access to server-side environment variables.
 *
 * This module is the ONLY place environment variables should be read from
 * directly. Every other server module must import `env` from here so that
 * missing/invalid configuration fails fast at startup instead of causing
 * confusing runtime errors deep inside a request handler.
 */

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().min(1, 'NEXTAUTH_URL is required'),

  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),

  COHERE_API_KEY: z.string().min(1, 'COHERE_API_KEY is required'),
  COHERE_EMBED_MODEL: z.string().default('embed-english-v3.0'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1024),

  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    // Fail loudly at boot time — never allow the app to run with an
    // incomplete configuration, since that would risk silently disabled
    // security checks (e.g. a missing NEXTAUTH_SECRET).
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', formatted);
    throw new Error(
      'Invalid environment configuration. Check your .env against .env.example.'
    );
  }

  return parsed.data;
}

export const env = loadEnv();
