import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/providers/Providers';
import { Toast } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HermesX — AI-Powered Customer Feedback Intelligence',
  description:
    'Turn customer feedback into action with AI-powered sentiment analysis, theme clustering, and grounded Q&A.',
};

/**
 * Runs synchronously before React hydrates, so the correct theme is applied
 * to <html> on first paint — no flash of the wrong theme. Kept as a plain
 * inline script (not a component) specifically so it executes before any
 * hydration work.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('hermesx-theme');
    var theme = stored === 'night' || stored === 'light' ? stored : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toast />
      </body>
    </html>
  );
}
