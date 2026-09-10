'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import type { Role } from '@/types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
}

export interface UseAuthResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** UI-visibility convenience only — the backend remains the actual authority. */
  hasRole: (...roles: Role[]) => boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        workspaceId: session.user.workspaceId,
      }
    : null;

  return {
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    hasRole: (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    signOut: async () => {
      await nextAuthSignOut({ callbackUrl: '/login' });
    },
  };
}