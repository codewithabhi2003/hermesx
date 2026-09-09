'use client';

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/providers/Providers';

/**
 * Must be called within <Providers>. Throws loudly rather than returning a
 * silently broken default — a component rendering outside the provider
 * tree is a real bug, not something to paper over.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within <Providers>.');
  }
  return context;
}
