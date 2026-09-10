'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToast, type ToastType } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLOR_CLASSES: Record<ToastType, string> = {
  success: 'text-positive',
  error: 'text-negative',
  info: 'text-primary',
};

/**
 * Mounted once in the root layout. Renders whatever `useToast()` currently
 * holds — see hooks/useToast.ts for the underlying store (max 3 toasts,
 * ~4s auto-dismiss, bottom-right). AnimatePresence gives each toast a real
 * exit animation instead of just vanishing when it's removed from state.
 */
export function Toast() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const Icon = ICONS[item.type];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-card border border-border bg-elevated p-4 shadow-elevated theme-transition'
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', COLOR_CLASSES[item.type])} aria-hidden="true" />
              <p className="flex-1 text-sm text-text-primary">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
