import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/permissions';
import { updateFeedbackSchema, feedbackIdParamSchema } from '@/lib/validation/feedback';
import { ok, handleRouteError } from '@/lib/responses';
import { NotFoundError } from '@/lib/errors';
import { upsertFeedbackEmbedding } from '@/lib/embeddings/cohere';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: { id: string };
}

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

/** GET /api/feedback/:id — any authenticated role, workspace scoped. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    const { id } = feedbackIdParamSchema.parse(params);

    const feedback = await prisma.feedback.findFirst({
      where: { id, workspaceId: auth.workspaceId },
      include: { feedbackThemes: { include: { theme: true } } },
    });

    if (!feedback) {
      throw new NotFoundError('Feedback not found.');
    }

    return ok(toFeedbackDto(feedback));
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * PATCH /api/feedback/:id
 *
 * ADMIN/ANALYST. Only whitelisted fields may be changed by the client —
 * `workspaceId`, `sentiment`, `sentimentScore`, `aiRationale`,
 * `aiAnalyzed`, and `classifiedAt` are always server-controlled. If
 * `content` changes, prior AI analysis is marked stale and the embedding
 * is regenerated so retrieval stays accurate.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');
    const { id } = feedbackIdParamSchema.parse(params);

    const body = await request.json();
    const updates = updateFeedbackSchema.parse(body);

    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!existing) {
      throw new NotFoundError('Feedback not found.');
    }

    const contentChanged =
      typeof updates.content === 'string' && updates.content !== existing.content;

    const feedback = await prisma.feedback.update({
      where: { id: existing.id },
      data: {
        ...updates,
        ...(contentChanged
          ? {
              // Content changed — prior sentiment/theme analysis can no
              // longer be trusted. Reclassification is recommended via
              // POST /api/ai/reclassify/:feedbackId.
              aiAnalyzed: false,
              classifiedAt: null,
            }
          : {}),
      },
      include: { feedbackThemes: { include: { theme: true } } },
    });

    if (contentChanged) {
      try {
        await upsertFeedbackEmbedding(feedback.id, feedback.content);
      } catch (error) {
        logger.error('Feedback embedding regeneration failed on update', {
          feedbackId: feedback.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return ok(toFeedbackDto(feedback));
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/feedback/:id — ADMIN/ANALYST, workspace scoped. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');
    const { id } = feedbackIdParamSchema.parse(params);

    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!existing) {
      throw new NotFoundError('Feedback not found.');
    }

    // Cascade deletes FeedbackTheme and Embedding rows (see schema.prisma).
    await prisma.feedback.delete({ where: { id: existing.id } });

    return ok({ id: existing.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
