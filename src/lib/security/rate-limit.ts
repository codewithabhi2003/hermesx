import { RateLimitedError } from '@/lib/errors';

/**
 * Simple fixed-window, in-memory rate limiter.
 *
 * LIMITATION: Vercel serverless functions are not guaranteed to share
 * memory across invocations or regions — each cold instance gets its own
 * counter map. This gives us "best effort" throttling per warm instance,
 * which is sufficient to blunt casual abuse and accidental retry storms,
 * but it is NOT a substitute for a shared store (e.g. Redis/Upstash) under
 * real adversarial load. Upgrading to a shared limiter is a drop-in
 * replacement for `checkRateLimit` and is intentionally out of scope here
 * per the project brief.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Logical action name, combined with the identity key to scope the bucket. */
  action: string;
  /** Caller identity — e.g. IP address, user id, or email being attempted. */
  identifier: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/**
 * Throws `RateLimitedError` if the caller has exceeded `limit` requests for
 * `action` within `windowMs`. Otherwise records the attempt and returns.
 */
export function checkRateLimit(options: RateLimitOptions): void {
  const key = `${options.action}:${options.identifier}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (existing.count >= options.limit) {
    throw new RateLimitedError();
  }

  existing.count += 1;
}

/** Best-effort client identifier for rate limiting anonymous requests. */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}
