import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/permissions';
import { createFeedbackSchema, feedbackQuerySchema } from '@/lib/validation/feedback';
import { okPaginated, ok, handleRouteError } from '@/lib/responses';
import { classifyAndPersist } from '@/lib/ai/classifier';
import { upsertFeedbackEmbedding } from '@/lib/embeddings/cohere';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

function toFeedbackDto(
  feedback: Prisma.FeedbackGetPayload<{ include: { feedbackThemes: { include: { theme: true } } } }>
) {
  return {
    id: feedback.id,
    content: feedback.content,
    channel: feedback.channel,
    sourceRef: feedback.sourceRef,
    customerLabel: feedback.customerLabel,
    sentiment: feedback.sentiment,
    sentimentScore: feedback.sentimentScore,
    featureArea: feedback.featureArea,
    aiRationale: feedback.aiRationale,
    status: feedback.status,
    aiAnalyzed: feedback.aiAnalyzed,
    classifiedAt: feedback.classifiedAt,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    workspaceId: feedback.workspaceId,
    themes: feedback.feedbackThemes.map((ft) => ({
      id: ft.theme.id,
      name: ft.theme.name,
      color: ft.theme.color,
      confidence: ft.confidence,
    })),
  };
}

/**
 * GET /api/feedback
 *
 * Any authenticated role. Supports pagination, full-text-ish search,
 * channel/sentiment/status/theme filters, a date range, and sorting.
 * Every filter is applied on top of a hard `workspaceId` constraint so a
 * caller can never see another tenant's feedback regardless of the query
 * string supplied.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();

    const query = feedbackQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const where: Prisma.FeedbackWhereInput = {
      workspaceId: auth.workspaceId, // non-negotiable tenant scope
    };

    if (query.channel) where.channel = query.channel;
    if (query.sentiment) where.sentiment = query.sentiment;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { content: { contains: query.search, mode: 'insensitive' } },
        { customerLabel: { contains: query.search, mode: 'insensitive' } },
        { sourceRef: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.theme) {
      // Scoped implicitly: FeedbackTheme -> Theme is only ever created
      // within this workspace, and the outer `workspaceId` filter above
      // already restricts which Feedback rows are visible.
      where.feedbackThemes = { some: { themeId: query.theme } };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate ? { gte: query.startDate } : {}),
        ...(query.endDate ? { lte: query.endDate } : {}),
      };
    }

    const [total, rows] = await prisma.$transaction([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({
        where,
        include: { feedbackThemes: { include: { theme: true } } },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return okPaginated(rows.map(toFeedbackDto), {
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
 * POST /api/feedback
 *
 * ADMIN/ANALYST. Creates feedback under the authenticated workspace, then
 * best-effort attempts AI classification and embedding generation. Both
 * are allowed to fail independently without rolling back the feedback
 * row — a failure leaves `aiAnalyzed = false` and is safe to retry via
 * /api/ai/reclassify/:feedbackId later.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    checkRateLimit({
      action: 'feedback:create',
      identifier: auth.workspaceId,
      limit: 60,
      windowMs: 60_000,
    });

    const body = await request.json();
    const input = createFeedbackSchema.parse(body);

    const feedback = await prisma.feedback.create({
      data: {
        content: input.content,
        channel: input.channel,
        sourceRef: input.sourceRef ?? null,
        customerLabel: input.customerLabel ?? null,
        status: 'NEW',
        workspaceId: auth.workspaceId, // server controls workspace, status, AI fields
      },
    });

    try {
      await classifyAndPersist(feedback.id, auth.workspaceId);
    } catch (error) {
      logger.error('Feedback classification failed at creation time', {
        feedbackId: feedback.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await upsertFeedbackEmbedding(feedback.id, feedback.content);
    } catch (error) {
      logger.error('Feedback embedding failed at creation time', {
        feedbackId: feedback.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const finalFeedback = await prisma.feedback.findUniqueOrThrow({
      where: { id: feedback.id },
      include: { feedbackThemes: { include: { theme: true } } },
    });

    return ok(toFeedbackDto(finalFeedback), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
