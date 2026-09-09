import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { ok, handleRouteError } from '@/lib/responses';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { classifyAndPersist } from '@/lib/ai/classifier';
import { upsertFeedbackEmbedding } from '@/lib/embeddings/cohere';
import { logger } from '@/lib/logger';

/**
 * Simulated App Store review pool.
 *
 * This is a deliberately fabricated dataset — the project brief forbids
 * connecting to the real App Store API. It exists purely to give the
 * product something realistic to demo classification and analytics on.
 */
const REVIEW_TEMPLATES = [
  { text: 'Crashes every time I try to open the settings page after the last update.', label: 'appstore_user_2291' },
  { text: 'Checkout keeps failing with my saved card, had to switch to PayPal to finish an order.', label: 'jmartin87' },
  { text: 'Love the new dashboard redesign, so much easier to find what I need now.', label: 'sunny_reviews' },
  { text: 'Support took three days to respond to my ticket about a duplicate charge.', label: 'anon_user_44' },
  { text: 'The app is fast and the onboarding flow finally makes sense. Great job team.', label: 'priya.k' },
  { text: 'Login keeps timing out on my tablet, works fine on my phone though.', label: 'devlin_t' },
  { text: 'Pricing changed without much warning and now the plan I liked is gone.', label: 'grumpy_penguin' },
  { text: 'Search results feel a lot more relevant since the last release, nice improvement.', label: 'wanderlust22' },
  { text: 'App froze during a payment and I got charged twice, please fix this urgently.', label: 'noreply_user' },
  { text: 'Really impressed with how smooth the mobile experience is now compared to six months ago.', label: 'techreviewer_r' },
  { text: 'Notifications are way too frequent, I get the same alert three times a day.', label: 'quietmode_fan' },
  { text: 'The export feature saved me hours of manual work, exactly what our team needed.', label: 'ops_lead_22' },
  { text: 'Cannot find where to update my billing address anymore, the menu moved.', label: 'confused_user9' },
  { text: 'Customer support was fantastic, resolved my issue within minutes over chat.', label: 'happy_customer1' },
  { text: 'The app feels sluggish on older devices, takes forever to load the home screen.', label: 'legacy_phone_user' },
];

const requestSchema = z.object({
  count: z.coerce.number().int().min(1).max(20).default(10),
});

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * POST /api/sources/app-store/sync
 *
 * ADMIN/ANALYST. Generates realistic simulated App Store feedback for the
 * authenticated workspace and runs it through the same best-effort
 * classification and embedding pipeline as manually created feedback.
 * Never connects to any real App Store API.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    checkRateLimit({
      action: 'app-store-sync',
      identifier: auth.workspaceId,
      limit: 5,
      windowMs: 60_000,
    });

    let count = 10;
    try {
      const body = await request.json();
      count = requestSchema.parse(body ?? {}).count;
    } catch {
      // No body / invalid JSON is fine — fall back to the default count.
      count = requestSchema.parse({}).count;
    }

    const createdIds: string[] = [];

    for (let i = 0; i < count; i += 1) {
      const review = pickRandom(REVIEW_TEMPLATES);

      const feedback = await prisma.feedback.create({
        data: {
          content: review.text,
          channel: 'APP_STORE',
          sourceRef: `simulated-${Date.now()}-${i}`,
          customerLabel: review.label,
          status: 'NEW',
          workspaceId: auth.workspaceId,
        },
      });

      createdIds.push(feedback.id);

      try {
        await classifyAndPersist(feedback.id, auth.workspaceId);
      } catch (error) {
        logger.error('Simulated feedback classification failed', {
          feedbackId: feedback.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        await upsertFeedbackEmbedding(feedback.id, feedback.content);
      } catch (error) {
        logger.error('Simulated feedback embedding failed', {
          feedbackId: feedback.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return ok({ synced: createdIds.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
