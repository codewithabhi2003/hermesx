'use client';

import { useAsync } from '@/hooks/useAsync';
import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { Avatar } from '@/components/ui/Avatar';
import { getWorkspace } from '@/services/api/workspace.api';
import { Skeleton } from '@/components/ui/Skeleton';

export interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar();
  const workspace = useAsync(() => getWorkspace(), []);

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-base px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-hover md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {workspace.isLoading ? (
          <Skeleton className="h-7 w-28 rounded-lg" />
        ) : (
          <span className="truncate rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary">
            {workspace.data?.name}
          </span>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">{user.role}</span>
          <Avatar name={user.name} avatarUrl={avatarUrl} size="sm" />
        </div>
      )}
    </header>
  );
}