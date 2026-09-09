import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/auth-session';
import { AppShell } from '@/components/layout/AppShell';

/**
 * Every route under (app)/ — dashboard, inbox, trends, ask-hermesx,
 * reports, themes, settings — is gated here, server-side, before any of
 * it renders. This reuses the exact same `getServerAuthSession()` the
 * backend's own Route Handlers rely on (see lib/auth/permissions.ts), so
 * there is only one source of truth for "is this session valid," not a
 * separate frontend-only check that could drift from it.
 *
 * Role-based UI (hiding buttons a VIEWER shouldn't see) happens further
 * down in individual pages via `useAuth().hasRole(...)` — this layout only
 * answers "logged in or not."
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect('/login');
  }

  return <AppShell>{children}</AppShell>;
}
