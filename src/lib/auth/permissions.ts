import type { Role } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getServerAuthSession } from '@/lib/auth/auth-session';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

/**
 * Authoritative request context.
 *
 * Everything a Route Handler needs to safely scope a query, sourced from
 * the DATABASE — never taken at face value from the client-controlled
 * session object.
 */
export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: Role;
  name: string;
  email: string;
}

/**
 * Verify the caller is authenticated AND re-load the current, authoritative
 * record from PostgreSQL.
 *
 * This exists to close the gap a pure JWT/session check would leave open:
 * a session token can remain valid after a user's role changes, their
 * workspace changes, or they are deleted outright. By re-reading the
 * database on every privileged call we make sure stale session data can
 * never preserve revoked privileges.
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Reject deleted users outright — the session token alone is never enough.
  if (!user) {
    throw new UnauthorizedError('Your session is no longer valid. Please sign in again.');
  }

  // Reject workspace mismatches between the token and the current record.
  if (user.workspaceId !== session.user.workspaceId) {
    throw new UnauthorizedError('Your session is no longer valid. Please sign in again.');
  }

  return {
    userId: user.id,
    workspaceId: user.workspaceId,
    role: user.role, // Always the CURRENT database role, never the token's.
    name: user.name,
    email: user.email,
  };
}

/**
 * Require authentication AND that the caller's current database role is one
 * of `roles`.
 *
 * Usage:
 * ```ts
 * const auth = await requireRole('ADMIN', 'ANALYST');
 * ```
 */
export async function requireRole(...roles: Role[]): Promise<AuthContext> {
  const auth = await requireAuth();

  if (!roles.includes(auth.role)) {
    throw new ForbiddenError('You do not have permission to perform this action.');
  }

  return auth;
}
