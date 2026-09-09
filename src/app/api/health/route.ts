import { prisma } from '@/lib/db/prisma';
import { ok, fail } from '@/lib/responses';
import { logger } from '@/lib/logger';

/**
 * GET /api/health
 *
 * Public, unauthenticated. Confirms the process is up and the database is
 * reachable. Intended for uptime monitors and deploy checks — it must
 * never require a session and must never leak internal details beyond a
 * boolean-ish status.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Health check failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return fail('DATABASE_ERROR', 'The database is currently unreachable.', 503);
  }
}
