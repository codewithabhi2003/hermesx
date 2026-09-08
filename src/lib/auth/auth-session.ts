import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Thin wrapper around `getServerSession` so Route Handlers and server
 * components import a single, memorable function instead of re-passing
 * `authOptions` everywhere.
 */
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
