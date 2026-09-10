import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { trendsQuerySchema } from '@/lib/validation/analytics';
import { ok, handleRouteError } from '@/lib/responses';

const PERIOD_TO_DAYS: Record<'7d' | '30d' | '90d', number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * GET /api/analytics/trends?period=7d|30d|90d
 *
 * Any authenticated role, workspace scoped. Unlike /api/analytics/volume
 * (total count per day), this returns a per-day POSITIVE/NEGATIVE/NEUTRAL
 * breakdown for stacked sentiment-trend charts, with missing days filled
 * to zero for a continuous series.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { period } = trendsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const days = PERIOD_TO_DAYS[period];
    const startDate = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

    const rows = await prisma.$queryRaw<
      Array<{ day: Date; sentiment: string | null; count: bigint }>
    >(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, sentiment::text AS sentiment, COUNT(*)::bigint AS count
      FROM "feedback"
      WHERE "workspaceId" = ${auth.workspaceId}
        AND "createdAt" >= ${startDate}
      GROUP BY day, sentiment
      ORDER BY day ASC
    `);

    const byDate = new Map<string, { positive: number; negative: number; neutral: number }>();
    for (const row of rows) {
      const key = formatDate(row.day);
      const bucket = byDate.get(key) ?? { positive: 0, negative: 0, neutral: 0 };
      if (row.sentiment === 'POSITIVE') bucket.positive += Number(row.count);
      else if (row.sentiment === 'NEGATIVE') bucket.negative += Number(row.count);
      else if (row.sentiment === 'NEUTRAL') bucket.neutral += Number(row.count);
      byDate.set(key, bucket);
    }

    const series = [];
    for (let i = 0; i < days; i += 1) {
      const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = formatDate(day);
      const bucket = byDate.get(key) ?? { positive: 0, negative: 0, neutral: 0 };
      series.push({ date: key, ...bucket });
    }

    return ok({ period, series });
  } catch (error) {
    return handleRouteError(error);
  }
}
