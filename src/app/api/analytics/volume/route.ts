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
 * GET /api/analytics/volume?period=7d|30d|90d
 *
 * Any authenticated role, workspace scoped. Returns a CONTINUOUS daily
 * series (missing days filled with 0) so charting libraries never have to
 * guess about gaps.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { period } = trendsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const days = PERIOD_TO_DAYS[period];
    const startDate = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

    const rows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "feedback"
      WHERE "workspaceId" = ${auth.workspaceId}
        AND "createdAt" >= ${startDate}
      GROUP BY day
      ORDER BY day ASC
    `);

    const countsByDate = new Map<string, number>();
    for (const row of rows) {
      countsByDate.set(formatDate(row.day), Number(row.count));
    }

    const series: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i += 1) {
      const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = formatDate(day);
      series.push({ date: key, count: countsByDate.get(key) ?? 0 });
    }

    return ok({ period, series });
  } catch (error) {
    return handleRouteError(error);
  }
}
