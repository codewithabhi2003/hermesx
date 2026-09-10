'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-card focus-visible:ring-2 focus-visible:ring-primary-ring',
  secondary:
    'bg-elevated text-text-primary border border-border hover:bg-hover focus-visible:ring-2 focus-visible:ring-primary-ring',
  outline:
    'bg-transparent text-text-primary border border-border-strong hover:bg-hover focus-visible:ring-2 focus-visible:ring-primary-ring',
  ghost: 'bg-transparent text-text-secondary hover:bg-hover hover:text-text-primary',
  danger: 'bg-negative text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-negative',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

/**
 * `whileTap`/`whileHover` are skipped entirely when the button is disabled
 * or loading — a scaling-down "press" animation on a button that can't
 * actually be clicked reads as a bug, not polish.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const isInteractive = !(disabled || loading);

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        whileHover={isInteractive ? { scale: 1.02 } : undefined}
        whileTap={isInteractive ? { scale: 0.97 } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-colors duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';