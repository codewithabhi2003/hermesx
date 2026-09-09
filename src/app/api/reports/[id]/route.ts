import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { reportIdParamSchema } from '@/lib/validation/reports';
import { ok, handleRouteError } from '@/lib/responses';
import { NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: { id: string };
}

/** GET /api/reports/:id — any authenticated role, workspace scoped. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    const { id } = reportIdParamSchema.parse(params);

    const report = await prisma.report.findFirst({
      where: { id, workspaceId: auth.workspaceId },
      include: { generatedByUser: { select: { name: true, email: true } } },
    });

    if (!report) {
      throw new NotFoundError('Report not found.');
    }

    return ok(report);
  } catch (error) {
    return handleRouteError(error);
  }
}
