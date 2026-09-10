import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { ok, handleRouteError } from '@/lib/responses';

/**
 * GET /api/analytics/themes
 *
 * Any authenticated role, workspace scoped. Returns every theme ranked by
 * feedback volume, each with its own sentiment breakdown so the frontend
 * can render a leaderboard without N follow-up requests.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth();

    const themes = await prisma.theme.findMany({
      where: { workspaceId: auth.workspaceId },
      include: {
        feedbackThemes: {
          include: { feedback: { select: { sentiment: true } } },
        },
      },
      orderBy: { feedbackThemes: { _count: 'desc' } },
    });

    const result = themes.map((theme) => {
      const sentiments = theme.feedbackThemes.map((ft) => ft.feedback.sentiment);
      const positive = sentiments.filter((s) => s === 'POSITIVE').length;
      const negative = sentiments.filter((s) => s === 'NEGATIVE').length;
      const neutral = sentiments.filter((s) => s === 'NEUTRAL').length;

      return {
        id: theme.id,
        name: theme.name,
        color: theme.color,
        feedbackCount: theme.feedbackThemes.length,
        sentimentBreakdown: { positive, negative, neutral },
      };
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
