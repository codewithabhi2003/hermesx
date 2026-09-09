import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { classifyAndPersist } from '@/lib/ai/classifier';
import { ok, handleRouteError } from '@/lib/responses';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/security/rate-limit';

interface RouteParams {
  params: { feedbackId: string };
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

/**
 * POST /api/ai/classify/:feedbackId
 *
 * ADMIN/ANALYST. Runs classification for feedback that has NOT yet been
 * analyzed. Already-analyzed feedback should go through
 * /api/ai/reclassify/:feedbackId instead, which exists specifically to
 * force a re-run.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    checkRateLimit({
      action: 'ai:classify',
      identifier: auth.workspaceId,
      limit: 30,
      windowMs: 60_000,
    });

    const existing = await prisma.feedback.findFirst({
      where: { id: params.feedbackId, workspaceId: auth.workspaceId },
    });

    if (!existing) {
      throw new NotFoundError('Feedback not found.');
    }

    if (existing.aiAnalyzed) {
      throw new ConflictError(
        'This feedback has already been analyzed. Use /api/ai/reclassify to force a re-run.'
      );
    }

    await classifyAndPersist(existing.id, auth.workspaceId);

    const feedback = await prisma.feedback.findUniqueOrThrow({
      where: { id: existing.id },
      include: { feedbackThemes: { include: { theme: true } } },
    });

    return ok(toFeedbackDto(feedback));
  } catch (error) {
    return handleRouteError(error);
  }
}
