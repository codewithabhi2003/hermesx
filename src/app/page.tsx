'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Sparkles,
  LayoutGrid,
  MessageSquareText,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { getChartColors } from '@/lib/utils';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Auto-Classification',
    description:
      'Every piece of feedback is automatically scored for sentiment and tagged with the themes it actually discusses — no manual tagging required.',
  },
  {
    icon: LayoutGrid,
    title: 'Theme Trends',
    description:
      'Watch which topics are rising or fading across your feedback over time, and catch emerging issues before they become widespread.',
  },
  {
    icon: MessageSquareText,
    title: 'Ask HermesX',
    description:
      'Ask a plain-language question about your customers and get an answer grounded directly in their actual feedback — with sources cited.',
  },
] as const;

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-semibold text-text-primary ${
        className ?? ''
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white">
        <Zap
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        />
      </span>

      <span className="text-lg">HermesX</span>
    </Link>
  );
}

/**
 * Slow-drifting blurred gradient orbs behind the hero.
 * Purely decorative and respects reduced-motion via global CSS.
 */
function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute right-0 top-32 h-80 w-80 rounded-full bg-primary-dark/20 blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute left-1/3 top-10 h-64 w-64 rounded-full bg-positive/10 blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

const HERO_THEMES = [
  {
    label: 'Feature Requests',
    pct: 92,
    color: '#3B82F6',
  },
  {
    label: 'Customer Support',
    pct: 78,
    color: '#10B981',
  },
  {
    label: 'Performance',
    pct: 58,
    color: '#EF4444',
  },
  {
    label: 'Onboarding',
    pct: 44,
    color: '#6366F1',
  },
  {
    label: 'Billing',
    pct: 32,
    color: '#F59E0B',
  },
] as const;

const TREND_POINTS =
  '0,50 20,35 40,48 60,20 80,40 100,12 120,45 140,25 160,52 180,18 200,42 220,8 240,38 260,48 280,22 300,35';

/**
 * A scaled-down mockup of the real dashboard's stats/chart/themes.
 * Kept in sync with the site's theme via useTheme.
 */
function HeroPreview() {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const isNight = theme === 'night';

  const cardClass = isNight
    ? 'border-white/10 bg-[#0A0A0A]'
    : 'border-gray-200 bg-white';

  const innerClass = isNight
    ? 'border-white/10 bg-white/5'
    : 'border-gray-100 bg-gray-50';

  const labelClass = isNight
    ? 'text-slate-400'
    : 'text-gray-500';

  const headingClass = isNight
    ? 'text-slate-200'
    : 'text-gray-700';

  const trackClass = isNight
    ? 'bg-white/10'
    : 'bg-gray-100';

  const stats = [
    {
      label: 'Total',
      value: '1,248',
      icon: MessageSquare,
      color: isNight ? '#E2E8F0' : '#111827',
    },
    {
      label: 'Positive',
      value: '848',
      icon: ThumbsUp,
      color: colors.positive,
    },
    {
      label: 'Neutral',
      value: '275',
      icon: Minus,
      color: colors.neutral,
    },
    {
      label: 'Negative',
      value: '125',
      icon: ThumbsDown,
      color: colors.negative,
    },
  ];

  return (
    <div className="relative animate-slide-up">
      <div
        className={`overflow-hidden rounded-2xl border p-5 shadow-2xl ${cardClass}`}
      >
        {/* Stat cards */}
        <motion.div
          className="mb-5 grid grid-cols-4 gap-2"
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className={`rounded-lg border p-2.5 ${innerClass}`}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 8,
                },
                show: {
                  opacity: 1,
                  y: 0,
                },
              }}
            >
              <stat.icon
                className={`mb-1 h-3 w-3 ${labelClass}`}
              />

              <p
                className="text-base font-bold leading-tight"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>

              <p className={`text-[9px] ${labelClass}`}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trend chart */}
        <div className="mb-5">
          <p
            className={`mb-2 text-[11px] font-semibold ${headingClass}`}
          >
            Feedback Trend
          </p>

          <svg
            viewBox="0 0 300 70"
            className="h-16 w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="hero-trend-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colors.primary}
                  stopOpacity={0.3}
                />

                <stop
                  offset="100%"
                  stopColor={colors.primary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <motion.polygon
              fill="url(#hero-trend-fill)"
              points={`0,70 ${TREND_POINTS} 300,70`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 1,
                delay: 0.6,
              }}
            />

            <motion.polyline
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={TREND_POINTS}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.6,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </div>

        {/* Top themes */}
        <div>
          <p
            className={`mb-2 text-[11px] font-semibold ${headingClass}`}
          >
            Top Themes
          </p>

          <div className="space-y-1.5">
            {HERO_THEMES.map((themeItem, i) => (
              <div
                key={themeItem.label}
                className="flex items-center gap-2"
              >
                <span
                  className={`w-[74px] flex-shrink-0 truncate text-[9px] ${labelClass}`}
                >
                  {themeItem.label}
                </span>

                <div
                  className={`h-2 flex-1 rounded-full ${trackClass}`}
                >
                  <motion.div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: themeItem.color,
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${themeItem.pct}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.9 + i * 0.1,
                      ease: 'easeOut',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        className={`absolute -bottom-6 -left-6 hidden rounded-xl border px-4 py-3 shadow-xl sm:block ${cardClass}`}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 1.4,
          duration: 0.5,
        }}
      >
        <p className={`text-xs ${labelClass}`}>
          Top theme this week
        </p>

        <p
          className={`text-sm font-semibold ${
            isNight ? 'text-slate-50' : 'text-gray-900'
          }`}
        >
          Feature Requests
        </p>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-base">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-base/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              How it works
            </a>
          </nav>

          {/* Only Sign In */}
          <Link href="/login">
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <AnimatedBackground />

        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Customer Feedback Intelligence for Modern Teams
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-[3.25rem]">
              Your Customers Have the Answers.{' '}
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                HermesX Finds Them.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-text-secondary">
              Understand what customers love, what frustrates them,
              and what they want next — with insights grounded in
              the feedback they actually shared.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-border bg-surface py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need to understand your customers
            </h2>

            <p className="mt-4 text-text-secondary">
              From raw feedback to clear, actionable insight —
              automatically.
            </p>
          </div>

          <div
            id="how-it-works"
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
                className="theme-transition rounded-card border border-border bg-card p-6 shadow-card hover:shadow-elevated"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <feature.icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="text-lg font-semibold text-text-primary">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm text-text-secondary">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-text-primary">
            Ready to listen to your customers?
          </h2>

          <p className="mt-4 text-text-secondary">
            Create your workspace in under a minute — no credit
            card required.
          </p>

          <div className="mt-8">
            <Link href="/signup">
              <Button variant="primary" size="lg">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Logo />

              <p className="mt-4 max-w-xs text-sm text-text-secondary">
                AI-powered customer feedback intelligence —
                understand what your customers are saying and turn
                it into action.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Product
              </h3>

              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Features
                  </a>
                </li>

                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    How it works
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Account
              </h3>

              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Sign in
                  </Link>
                </li>

                <li>
                  <Link
                    href="/signup"
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Get started
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} HermesX. All rights reserved.
            </p>

            <p className="text-xs uppercase tracking-wider text-text-muted">
              Customer feedback. Clearer insights. Bigger possibilities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}