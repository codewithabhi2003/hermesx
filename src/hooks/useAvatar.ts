'use client';

import { useSyncExternalStore, useEffect } from 'react';
import { getProfile } from '@/services/api/profile.api';

/**
 * The current user's avatar, held OUTSIDE the NextAuth session/cookie on
 * purpose. Photos are fetched via GET /api/profile and kept only in memory
 * (module-level state, same external-store pattern as useToast) — never
 * placed in a cookie or JWT. See auth-options.ts for the incident this is
 * fixing: a base64 image in the session cookie caused every request's
 * headers to exceed the server's size limit ("431 Request Header Fields
 * Too Large") as soon as a photo was uploaded.
 */

interface AvatarState {
  avatarUrl: string | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

let state: AvatarState = { avatarUrl: null, status: 'idle' };
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AvatarState {
  return state;
}

function getServerSnapshot(): AvatarState {
  return { avatarUrl: null, status: 'idle' };
}

let loadPromise: Promise<void> | null = null;

function loadOnce() {
  if (state.status === 'loading' || state.status === 'loaded') return;
  if (loadPromise) return;

  state = { ...state, status: 'loading' };
  emitChange();

  loadPromise = getProfile()
    .then((profile) => {
      state = { avatarUrl: profile.avatarUrl, status: 'loaded' };
    })
    .catch(() => {
      state = { ...state, status: 'error' };
    })
    .finally(() => {
      emitChange();
      loadPromise = null;
    });
}

/** Call this right after a successful profile update so every consumer (Sidebar, TopBar) updates immediately. */
export function setAvatarUrl(avatarUrl: string | null): void {
  state = { avatarUrl, status: 'loaded' };
  emitChange();
}

export function useAvatar(): AvatarState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    loadOnce();
  }, []);

  return snapshot;
}