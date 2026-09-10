import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { createUserSchema } from '@/lib/validation/users';
import { ok, handleRouteError } from '@/lib/responses';
import { ConflictError } from '@/lib/errors';

const SALT_ROUNDS = 12;

/**
 * GET /api/users
 *
 * ADMIN only. Returns every user belonging to the authenticated admin's
 * workspace. Never accepts a workspace filter from the client — the
 * workspace is always derived from the authoritative session.
 */
export async function GET() {
  try {
    const auth = await requireRole('ADMIN');

    const users = await prisma.user.findMany({
      where: { workspaceId: auth.workspaceId },
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
      orderBy: { createdAt: 'asc' },
    });

    return ok(users);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/users
 *
 * ADMIN only. Creates a new user that automatically belongs to the
 * authenticated admin's workspace. `workspaceId` is never accepted from
 * the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');

    const body = await request.json();
    const { name, email, password, role } = createUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        workspaceId: auth.workspaceId, // never trust a client-supplied workspaceId
      },
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

    return ok(user, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
