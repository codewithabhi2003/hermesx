'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  LayoutDashboard,
  Inbox,
  TrendingUp,
  MessageSquareText,
  FileText,
  Tags,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/ask-hermesx', label: 'Ask HermesX', icon: MessageSquareText },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/themes', label: 'Themes', icon: Tags },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { avatarUrl } = useAvatar();

  const firstName = user?.name?.trim().split(/\s+/)[0];

  const displayName = firstName
    ? `${firstName.charAt(0).toUpperCase()}${firstName.slice(1).toLowerCase()}`
    : '';

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white">
          <Zap
            className="h-4 w-4"
            fill="currentColor"
            aria-hidden="true"
          />
        </span>

        <span className="text-lg font-semibold text-text-primary">
          HermesX
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:bg-hover hover:text-text-primary',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-nav"
                  className="absolute inset-0 rounded-lg bg-primary-soft"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                  }}
                />
              )}

              <item.icon
                className="relative z-10 h-4 w-4 flex-shrink-0"
                aria-hidden="true"
              />

              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar
              name={user.name}
              avatarUrl={avatarUrl}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {displayName}
              </p>

              <p className="truncate text-xs text-text-muted">
                {user.role}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-hover hover:text-negative"
        >
          <LogOut
            className="h-4 w-4"
            aria-hidden="true"
          />

          Log out
        </button>
      </div>
    </div>
  );
}

export function Sidebar({
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop — always visible, fixed width */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border md:block">
        <SidebarContent />
      </aside>

      {/* Mobile — slide-in drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              aria-hidden="true"
            />

            <motion.div
              className="relative flex h-full w-64 flex-col border-r border-border shadow-elevated"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 32,
              }}
            >
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close menu"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-hover"
              >
                <X className="h-4 w-4" />
              </button>

              <SidebarContent onNavigate={onMobileClose} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}