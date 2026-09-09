import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/permissions';
import { createReportSchema, reportsQuerySchema } from '@/lib/validation/reports';
import { okPaginated, ok, handleRouteError } from '@/lib/responses';
import { generateReportNarrative } from '@/lib/ai/report-narrative';
import { checkRateLimit } from '@/lib/security/rate-limit';

const SAMPLE_FEEDBACK_LIMIT = 15;
const TOP_THEMES_LIMIT = 5;

/**
 * GET /api/reports
 *
 * Any authenticated role, workspace scoped, paginated, newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();

    const query = reportsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const where = { workspaceId: auth.workspaceId };

    const [total, reports] = await prisma.$transaction([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          title: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
          generatedBy: true,
          generatedByUser: { select: { name: true, email: true } },
        },
      }),
    ]);

    return okPaginated(reports, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/reports
 *
 * ADMIN/ANALYST. Aggregates real statistics for the requested period
 * (scoped to the caller's workspace), generates an AI narrative grounded
 * in those statistics, and stores the result. Nothing in the report is
 * fabricated outside of the narrative prose itself — every number comes
 * from PostgreSQL.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    checkRateLimit({
      action: 'reports:create',
      identifier: auth.workspaceId,
      limit: 10,
      windowMs: 60_000,
    });

    const body = await request.json();
    const { title, periodStart, periodEnd } = createReportSchema.parse(body);

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: auth.workspaceId },
    });

    const periodWhere = {
      workspaceId: auth.workspaceId,
      createdAt: { gte: periodStart, lte: periodEnd },
    };

    const [totalFeedback, positive, negative, neutral, topThemesRaw, sampleFeedback] =
      await Promise.all([
        prisma.feedback.count({ where: periodWhere }),
        prisma.feedback.count({ where: { ...periodWhere, sentiment: 'POSITIVE' } }),
        prisma.feedback.count({ where: { ...periodWhere, sentiment: 'NEGATIVE' } }),
        prisma.feedback.count({ where: { ...periodWhere, sentiment: 'NEUTRAL' } }),
        prisma.theme.findMany({
          where: {
            workspaceId: auth.workspaceId,
            feedbackThemes: { some: { feedback: periodWhere } },
          },
          include: {
            _count: { select: { feedbackThemes: { where: { feedback: periodWhere } } } },
          },
          orderBy: { feedbackThemes: { _count: 'desc' } },
          take: TOP_THEMES_LIMIT,
        }),
        prisma.feedback.findMany({
          where: periodWhere,
          select: { id: true, content: true, sentiment: true, channel: true },
          orderBy: { createdAt: 'desc' },
          take: SAMPLE_FEEDBACK_LIMIT,
        }),
      ]);

    const REPRESENTATIVE_QUOTES_LIMIT = 5;
    const representativeQuotes = sampleFeedback
      .filter((f) => f.sentiment !== null)
      .slice(0, REPRESENTATIVE_QUOTES_LIMIT)
      .map((f) => ({ content: f.content, sentiment: f.sentiment as string, channel: f.channel }));

    const topThemesWithShare = topThemesRaw.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      count: t._count.feedbackThemes,
      percentage:
        totalFeedback > 0 ? Math.round((t._count.feedbackThemes / totalFeedback) * 1000) / 10 : 0,
    }));

    // Equal-length prior period immediately preceding periodStart, for the
    // "majorChanges" narrative section to compare against.
    const periodLengthMs = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodLengthMs);
    const previousPeriodWhere = {
      workspaceId: auth.workspaceId,
      createdAt: { gte: previousPeriodStart, lt: periodStart },
    };

    const [prevTotal, prevPositive, prevNegative, prevNeutral] = await Promise.all([
      prisma.feedback.count({ where: previousPeriodWhere }),
      prisma.feedback.count({ where: { ...previousPeriodWhere, sentiment: 'POSITIVE' } }),
      prisma.feedback.count({ where: { ...previousPeriodWhere, sentiment: 'NEGATIVE' } }),
      prisma.feedback.count({ where: { ...previousPeriodWhere, sentiment: 'NEUTRAL' } }),
    ]);

    const narrative = await generateReportNarrative({
      workspaceName: workspace.name,
      periodStart,
      periodEnd,
      totalFeedback,
      sentimentBreakdown: { positive, negative, neutral },
      topThemes: topThemesWithShare.map((t) => ({ name: t.name, count: t.count })),
      previousPeriod:
        prevTotal > 0
          ? {
              totalFeedback: prevTotal,
              sentimentBreakdown: { positive: prevPositive, negative: prevNegative, neutral: prevNeutral },
            }
          : null,
      sampleFeedback,
    });

    const report = await prisma.report.create({
      data: {
        workspaceId: auth.workspaceId,
        generatedBy: auth.userId,
        title,
        periodStart,
        periodEnd,
        contentJson: {
          narrative,
          stats: {
            totalFeedback,
            positive,
            negative,
            neutral,
            unclassified: totalFeedback - positive - negative - neutral,
            topThemes: topThemesWithShare,
            representativeQuotes,
            previousPeriod:
              prevTotal > 0
                ? { totalFeedback: prevTotal, positive: prevPositive, negative: prevNegative, neutral: prevNeutral }
                : null,
          },
        },
      },
      include: { generatedByUser: { select: { name: true, email: true } } },
    });

    return ok(report, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}