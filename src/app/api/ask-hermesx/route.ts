import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { askHermesxSchema } from '@/lib/validation/ask-hermesx';
import { askHermesX } from '@/lib/ai/qa';
import { ok, handleRouteError } from '@/lib/responses';
import { checkRateLimit } from '@/lib/security/rate-limit';

/**
 * POST /api/ask-hermesx
 *
 * Any authenticated role. Answers a natural-language question grounded
 * strictly in the caller's own workspace feedback via retrieval-augmented
 * generation. See lib/ai/qa.ts for the full pipeline.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    checkRateLimit({
      action: 'ask-hermesx',
      identifier: auth.userId,
      limit: 20,
      windowMs: 60_000,
    });

    const body = await request.json();
    const { question } = askHermesxSchema.parse(body);

    const result = await askHermesX(question, auth.workspaceId);

    return ok({
      answer: result.answer,
      confidence: result.confidence,
      citedFeedbackIds: result.citedFeedbackIds,
      sources: result.sources.map((source) => ({
        feedbackId: source.feedbackId,
        content: source.content,
        sentiment: source.sentiment,
        channel: source.channel,
        createdAt: source.createdAt,
        similarity: source.similarity,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
