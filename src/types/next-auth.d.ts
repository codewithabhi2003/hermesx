import { Role } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

/**
 * Extend NextAuth's built-in types so the rest of the codebase gets
 * type-safe access to `session.user.id`, `.role`, and `.workspaceId`
 * instead of casting `any` everywhere.
 *
 * IMPORTANT: these fields are for UI convenience only. Server-side
 * authorization must still go through `requireAuth()` / `requireRole()`
 * in `lib/auth/permissions.ts`, which re-verifies against the database.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      workspaceId: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    workspaceId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    workspaceId: string;
  }
}