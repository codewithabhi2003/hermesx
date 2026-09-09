'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to Night mode' : 'Switch to Light mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border',
        'bg-elevated text-text-secondary hover:text-text-primary hover:bg-hover',
        'transition-colors duration-150',
        className
      )}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
