import type { Config } from 'tailwindcss';

/**
 * Colors are intentionally mapped to CSS custom properties (defined in
 * globals.css) rather than hard-coded hex values. That's what makes
 * `bg-surface`, `text-primary`, etc. automatically flip between Light and
 * Night mode without any conditional class logic in components — the
 * variable changes, Tailwind's utility class doesn't need to.
 */
const config: Config = {
  darkMode: ['selector', '[data-theme="night"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        sidebar: 'var(--bg-sidebar)',
        input: 'var(--bg-input)',
        hover: 'var(--bg-hover)',
        elevated: 'var(--bg-elevated)',

        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          soft: 'var(--primary-soft)',
          ring: 'var(--primary-ring)',
        },

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',

        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',

        positive: 'var(--positive)',
        negative: 'var(--negative)',
        neutral: 'var(--neutral)',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        elevated: '0 4px 16px -4px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
