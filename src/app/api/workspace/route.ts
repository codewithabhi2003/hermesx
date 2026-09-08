import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/permissions';
import { updateWorkspaceSchema } from '@/lib/validation/workspace';
import { ok, handleRouteError } from '@/lib/responses';
import { NotFoundError } from '@/lib/errors';

/**
 * GET /api/workspace
 *
 * Any authenticated role. Always returns the CALLER's own workspace —
 * there is no way to request a different one.
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    const workspace = await prisma.workspace.findUnique({
      where: { id: auth.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found.');
    }

    return ok(workspace);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * PATCH /api/workspace
 *
 * ADMIN only. Updates the caller's own workspace name. `workspaceId` is
 * never accepted from the request body — the target is always the
 * authenticated admin's own workspace.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');

    const body = await request.json();
    const { name } = updateWorkspaceSchema.parse(body);

    const workspace = await prisma.workspace.update({
      where: { id: auth.workspaceId },
      data: { name },
    });

    return ok(workspace);
  } catch (error) {
    return handleRouteError(error);
  }
}
