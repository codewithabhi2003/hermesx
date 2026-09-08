import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { signupSchema } from '@/lib/validation/auth';
import { ok, handleRouteError } from '@/lib/responses';
import { ConflictError } from '@/lib/errors';
import { checkRateLimit, getClientIdentifier } from '@/lib/security/rate-limit';

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/signup
 *
 * Registers a brand-new workspace and its first ADMIN user in a single
 * transaction. This is the ONLY custom auth endpoint in the application —
 * actual login continues to flow entirely through NextAuth's Credentials
 * provider at /api/auth/[...nextauth].
 */
export async function POST(request: NextRequest) {
  try {
    checkRateLimit({
      action: 'signup',
      identifier: getClientIdentifier(request),
      limit: 5,
      windowMs: 60_000,
    });

    const body = await request.json();
    const { name, email, password, workspaceName } = signupSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: workspaceName },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'ADMIN',
          workspaceId: workspace.id,
        },
      });

      return { workspace, user };
    });

    return ok(
      {
        workspaceId: result.workspace.id,
        userId: result.user.id,
        email: result.user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
