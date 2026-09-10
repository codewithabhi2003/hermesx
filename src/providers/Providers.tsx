'use client';

import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

export type ThemeMode = 'light' | 'night';

const THEME_STORAGE_KEY = 'hermesx-theme';

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Exported so `hooks/useTheme.ts` can consume it. Defined here (rather than
 * in its own file) because the provider that populates it lives in this
 * same file — keeping the context and its provider together avoids a
 * circular import between providers/ and hooks/.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  // MUST start at the same value the server rendered ('light') — reading
  // document/localStorage here (even in a lazy initializer) runs during the
  // client's first render too, so if the real stored theme were 'night' the
  // very first client render would already diverge from the server's HTML
  // (e.g. rendering the Sun icon's <circle> where the server rendered the
  // Moon icon's <path>), which is exactly what a hydration error reports.
  const [theme, setThemeState] = useState<ThemeMode>('light');

  // Runs only on the client, AFTER hydration has already succeeded — safe
  // to diverge from the server output here. This is what actually applies
  // the real stored theme (the inline script in layout.tsx already set the
  // DOM attribute before paint to avoid a visual flash; this syncs React's
  // own state to match so icons/UI react to it too).
  useEffect(() => {
    const stored = document.documentElement.dataset.theme as ThemeMode | undefined;
    if (stored && stored !== 'light') {
      setThemeState(stored);
    }
  }, []);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'night' : 'light');

  // Keep multiple tabs in sync if the theme changes elsewhere.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        const next = event.newValue as ThemeMode;
        setThemeState(next);
        document.documentElement.dataset.theme = next;
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
