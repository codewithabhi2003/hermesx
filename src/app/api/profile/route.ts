import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { updateProfileSchema } from '@/lib/validation/profile';
import { ok, handleRouteError } from '@/lib/responses';
import { ConflictError } from '@/lib/errors';

/**
 * GET /api/profile
 *
 * Any authenticated role. Always returns the CALLER's own profile — there
 * is no id parameter, so there is no way to fetch anyone else's via this
 * route. Full user management (viewing/editing OTHER users) stays on the
 * existing ADMIN-only /api/users endpoints.
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
        avatarUrl: true,
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
 * PATCH /api/profile
 *
 * Any authenticated role. Updates the caller's own name, email, and/or
 * avatar. `role` and `workspaceId` are never accepted here — changing
 * those stays admin-only via /api/users/:id.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();

    const body = await request.json();
    const updates = updateProfileSchema.parse(body);

    if (updates.email) {
      const existing = await prisma.user.findUnique({ where: { email: updates.email } });
      if (existing && existing.id !== auth.userId) {
        throw new ConflictError('An account with this email already exists.');
      }
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
        avatarUrl: true,
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
