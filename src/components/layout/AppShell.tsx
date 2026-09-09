'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Why this file exists: the parent (app)/layout.tsx must remain a Server
 * Component so it can call `getServerAuthSession()` and `redirect()`
 * server-side before anything renders (the actual auth guard). But the
 * mobile hamburger menu needs client-side state shared between `TopBar`
 * (the button) and `Sidebar` (the drawer it opens). This thin client
 * component is the seam between those two requirements.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
