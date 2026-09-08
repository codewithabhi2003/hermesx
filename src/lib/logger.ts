/**
 * Lightweight, dependency-free server-side logger.
 *
 * Vercel captures stdout/stderr automatically, so we intentionally avoid
 * pulling in a heavier logging library. This module exists mainly to give
 * every call site a single, consistent shape AND to guarantee that
 * sensitive fields (passwords, hashes, tokens, API keys) never make it
 * into a log line, even by accident.
 */

type LogLevel = 'info' | 'warn' | 'error';

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'sessiontoken',
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = redact(val);
      }
    }
    return output;
  }

  return value;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
