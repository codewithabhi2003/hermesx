import { clsx, type ClassValue } from 'clsx';

/** Merges conditional class names. Thin wrapper so every component imports one thing. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Formats an ISO date string as "Jan 5, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Formats an ISO date string as a relative time, e.g. "2 hours ago". */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

/** Truncates text to `maxLength` characters, adding an ellipsis if cut. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** Formats a number with thousands separators, e.g. 1248 -> "1,248". */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Formats a -1..1 sentiment score as a signed percentage, e.g. 0.42 -> "+42%". */
export function formatSentimentScore(score: number | null): string {
  if (score === null) return '—';
  const percent = Math.round(score * 100);
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}

/** Capitalizes the first letter only, e.g. "APP_STORE" -> not touched (see channelLabel below). */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Human-readable label for a Channel enum value, e.g. "APP_STORE" -> "App Store". */
export function channelLabel(channel: string): string {
  return channel
    .toLowerCase()
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}

/** First letters of up to two words in a name, e.g. "Jane Doe" -> "JD". Used by avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Resolved hex colors for chart libraries (recharts reads `fill`/`stroke`
 * in JS, not just CSS, so a raw `var(--token)` string doesn't reliably
 * resolve across browsers). Kept in sync with the values in globals.css —
 * update both together if the palette ever changes.
 */
export function getChartColors(theme: 'light' | 'night') {
  return theme === 'night'
    ? { positive: '#34D399', negative: '#F87171', neutral: '#FBBF24', primary: '#818CF8' }
    : { positive: '#10B981', negative: '#EF4444', neutral: '#F59E0B', primary: '#6366F1' };
}
