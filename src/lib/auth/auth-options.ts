import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { credentialsSchema } from '@/lib/validation/auth';
import { logger } from '@/lib/logger';

/**
 * NextAuth/Auth.js configuration.
 *
 * HermesX authenticates with email + password only (Credentials provider).
 * We deliberately keep the session payload minimal — id, role, workspaceId
 * — and never place `passwordHash` or any secret on it. Sensitive
 * authorization decisions must still re-verify against the database via
 * `requireAuth()` / `requireRole()` (see lib/auth/permissions.ts); this
 * session is for UI convenience and cheap route-level checks only.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          logger.warn('Failed login attempt', { email });
          return null;
        }

        // Fire-and-forget lastLoginAt update — never block/fail auth on it.
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch((err) => logger.error('Failed to update lastLoginAt', { message: String(err) }));

        // Only the safe identity fields are returned — never passwordHash,
        // and deliberately NEVER avatarUrl either. The JWT session becomes
        // a cookie sent on every request; a base64 image in it is exactly
        // what causes "431 Request Header Fields Too Large" once a photo
        // is uploaded. Avatars are fetched via GET /api/profile instead —
        // see hooks/useAvatar.ts.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        token.name = user.name;
        token.email = user.email;
      }

      // Triggered by the client calling `useSession().update(data)` — see
      // the Profile settings page. Lets name/email changes show up
      // immediately in the Sidebar/TopBar without forcing a re-login.
      // Deliberately NOT used for avatarUrl (see the note above) — never
      // add it back here without a plan for keeping the cookie small.
      // Never trust this path for role/workspaceId — those only ever come
      // from the `user` branch above (initial sign-in, re-reading the DB).
      if (trigger === 'update' && session) {
        if (typeof session.name === 'string') token.name = session.name;
        if (typeof session.email === 'string') token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.workspaceId = token.workspaceId;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      return session;
    },
  },
};