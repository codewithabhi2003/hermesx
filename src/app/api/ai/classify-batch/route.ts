import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { classifyBatchSchema } from '@/lib/validation/ai';
import { classifyAndPersist } from '@/lib/ai/classifier';
import { ok, handleRouteError } from '@/lib/responses';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

// Bounded to `limit` (max 30) rows per call specifically so this stays
// well inside serverless time limits even without a custom maxDuration —
// the frontend calls this repeatedly (see Inbox's "Analyze pending"
// button) until `remaining` reaches 0, rather than asking for everything
// in one request.
export const maxDuration = 45;

/**
 * POST /api/ai/classify-batch
 *
 * ADMIN/ANALYST. Classifies up to `limit` currently-unanalyzed feedback
 * rows in the caller's workspace, oldest first, and reports how many are
 * still left. Exists so a workspace with hundreds or thousands of
 * imported/synced feedback items doesn't require opening each one
 * individually to trigger AI analysis — see /inbox's "Analyze pending
 * feedback" action, which calls this in a loop with a progress indicator.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    checkRateLimit({
      action: 'ai:classify-batch',
      identifier: auth.workspaceId,
      limit: 20,
      windowMs: 60_000,
    });

    let limit = 20;
    try {
      const body = await request.json();
      limit = classifyBatchSchema.parse(body ?? {}).limit;
    } catch {
      limit = classifyBatchSchema.parse({}).limit;
    }

    const pending = await prisma.feedback.findMany({
      where: { workspaceId: auth.workspaceId, aiAnalyzed: false },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let processed = 0;
    for (const item of pending) {
      try {
        await classifyAndPersist(item.id, auth.workspaceId);
        processed += 1;
      } catch (error) {
        logger.error('Batch classification failed for one item', {
          feedbackId: item.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const remaining = await prisma.feedback.count({
      where: { workspaceId: auth.workspaceId, aiAnalyzed: false },
    });

    return ok({ processed, remaining });
  } catch (error) {
    return handleRouteError(error);
  }
}