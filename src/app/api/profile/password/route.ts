import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { changePasswordSchema } from '@/lib/validation/profile';
import { ok, handleRouteError } from '@/lib/responses';
import { ValidationError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/security/rate-limit';

const SALT_ROUNDS = 12;

/**
 * PATCH /api/profile/password
 *
 * Any authenticated role. Requires the CURRENT password to be supplied
 * and verified before a new one is set — this is the only endpoint in the
 * app that changes a password, and it always acts on the caller's own
 * account (no admin override; an admin resetting someone else's password
 * is out of scope here).
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();

    // Deliberately tight — this endpoint is the one place a compromised
    // session could be used to brute-force the current password.
    checkRateLimit({
      action: 'profile:change-password',
      identifier: auth.userId,
      limit: 5,
      windowMs: 60_000,
    });

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });

    const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentMatches) {
      throw new ValidationError('Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: auth.userId }, data: { passwordHash } });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
