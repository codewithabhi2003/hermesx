import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { ok, handleRouteError } from '@/lib/responses';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_THEMES_LIMIT = 5;

/**
 * GET /api/analytics/overview
 *
 * Any authenticated role. Every figure is computed live from PostgreSQL,
 * scoped to the authenticated workspace — nothing here is hard-coded.
 * Uses `actioned`, never `actionable`, per the frozen DTO contract.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    const workspaceId = auth.workspaceId;
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

    const [total, positive, negative, neutral, actioned, newThisWeek, aiAnalyzed, themeCounts] =
      await Promise.all([
        prisma.feedback.count({ where: { workspaceId } }),
        prisma.feedback.count({ where: { workspaceId, sentiment: 'POSITIVE' } }),
        prisma.feedback.count({ where: { workspaceId, sentiment: 'NEGATIVE' } }),
        prisma.feedback.count({ where: { workspaceId, sentiment: 'NEUTRAL' } }),
        prisma.feedback.count({ where: { workspaceId, status: 'ACTIONED' } }),
        prisma.feedback.count({ where: { workspaceId, createdAt: { gte: sevenDaysAgo } } }),
        prisma.feedback.count({ where: { workspaceId, aiAnalyzed: true } }),
        prisma.theme.findMany({
          where: { workspaceId },
          include: { _count: { select: { feedbackThemes: true } } },
          orderBy: { feedbackThemes: { _count: 'desc' } },
          take: TOP_THEMES_LIMIT,
        }),
      ]);

    return ok({
      totalFeedback: total,
      positive,
      negative,
      neutral,
      actioned,
      newThisWeek,
      aiAnalyzed,
      topThemes: themeCounts.map((theme) => ({
        id: theme.id,
        name: theme.name,
        color: theme.color,
        count: theme._count.feedbackThemes,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
