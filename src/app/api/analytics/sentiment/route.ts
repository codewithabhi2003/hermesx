import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { ok, handleRouteError } from '@/lib/responses';

function toPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10; // one decimal place
}

/**
 * GET /api/analytics/sentiment
 *
 * Any authenticated role, workspace scoped. Breaks down sentiment across
 * ALL feedback, distinguishing rows that have not yet been AI-classified
 * (`sentiment` is null) from a genuine NEUTRAL classification.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    const workspaceId = auth.workspaceId;

    const [total, positive, negative, neutral, unclassified] = await Promise.all([
      prisma.feedback.count({ where: { workspaceId } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: 'POSITIVE' } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: 'NEGATIVE' } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: 'NEUTRAL' } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: null } }),
    ]);

    return ok({
      total,
      positive,
      negative,
      neutral,
      unclassified,
      percentages: {
        positive: toPercentage(positive, total),
        negative: toPercentage(negative, total),
        neutral: toPercentage(neutral, total),
        unclassified: toPercentage(unclassified, total),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
