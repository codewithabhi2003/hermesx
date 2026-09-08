import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { updateUserSchema, userIdParamSchema } from '@/lib/validation/users';
import { ok, handleRouteError } from '@/lib/responses';
import { NotFoundError, ValidationError } from '@/lib/errors';

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/users/:id
 *
 * ADMIN only. Allows updating `name` and `role`. Workspace scoped — an
 * admin from one workspace can never modify a user from another, and a
 * mismatched id resolves to 404 rather than 403 to avoid confirming the
 * id exists in someone else's tenant.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN');
    const { id } = userIdParamSchema.parse(params);

    const body = await request.json();
    const updates = updateUserSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found.');
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return ok(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/users/:id
 *
 * ADMIN only. Workspace scoped. An admin cannot delete their own account
 * through this endpoint.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN');
    const { id } = userIdParamSchema.parse(params);

    if (id === auth.userId) {
      throw new ValidationError('You cannot delete your own account.');
    }

    const existingUser = await prisma.user.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found.');
    }

    await prisma.user.delete({ where: { id: existingUser.id } });

    return ok({ id: existingUser.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
