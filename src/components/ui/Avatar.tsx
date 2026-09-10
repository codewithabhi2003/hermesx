import { initials, cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-20 w-20 text-xl',
};

/**
 * Shows the uploaded photo when present, otherwise falls back to a
 * colored initials circle. Used everywhere a user is represented — the
 * Sidebar, TopBar, Team list, and the Profile settings page all render
 * through this one component so photo support only had to be added once.
 */
export function Avatar({ name, avatarUrl, size = 'md', className }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URLs / user photos aren't a fit for next/image's static optimization
      <img
        src={avatarUrl}
        alt={name}
        className={cn('flex-shrink-0 rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary',
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
