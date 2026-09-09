import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'default' | 'primary' | 'positive' | 'negative' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  default: 'bg-hover text-text-secondary',
  primary: 'bg-primary-soft text-primary',
  positive: 'bg-positive/10 text-positive',
  negative: 'bg-negative/10 text-negative',
  neutral: 'bg-neutral/10 text-neutral',
};

export function Badge({ tone = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
