'use client';

import { useSyncExternalStore } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

/**
 * Module-level store (not React Context) so `toast.success(...)` can be
 * called from anywhere — including outside components, e.g. inside a
 * service function's catch block — without needing a Provider in the tree.
 * `<Toast />` (components/ui/Toast.tsx) is the single renderer that
 * subscribes to this store; mount it once, near the root layout.
 */
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ToastItem[] {
  return toasts;
}

function getServerSnapshot(): ToastItem[] {
  return [];
}

function addToast(type: ToastType, message: string) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  // Cap at MAX_TOASTS — oldest drops off rather than stacking indefinitely.
  toasts = [...toasts, { id, type, message }].slice(-MAX_TOASTS);
  emitChange();

  setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

export function useToast() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    toasts: items,
    dismiss: dismissToast,
    toast: {
      success: (message: string) => addToast('success', message),
      error: (message: string) => addToast('error', message),
      info: (message: string) => addToast('info', message),
    },
  };
}
