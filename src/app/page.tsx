import Link from 'next/link';
import { Zap, Sparkles, LayoutGrid, MessageSquareText, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
    <Link href="/" className={`flex items-center gap-2 font-semibold text-text-primary ${className ?? ''}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white">
        <Zap className="h-4 w-4" fill="currentColor" aria-hidden="true" />
      </span>
      <span className="text-lg">HermesX</span>
    </Link>
  );
}

/** Purely illustrative product preview — generic placeholder figures, not tied to any real account. */
function HeroPreview() {
  return (
    <div className="relative animate-slide-up">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">This week</p>
            <p className="text-2xl font-semibold text-text-primary">1,248 Feedback</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-positive/10 px-2.5 py-1 text-xs font-medium text-positive">68% Positive</span>
          </div>
        </div>

        {/* Fake bar chart — decorative only */}
        <div className="mb-6 flex h-28 items-end gap-2">
          {[40, 65, 50, 80, 60, 90, 70].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary/20 to-primary"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <div>
            <p className="flex items-center gap-1 text-xs text-positive"><TrendingUp className="h-3 w-3" /> 68%</p>
            <p className="text-xs text-text-muted">Positive</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-text-muted"><Minus className="h-3 w-3" /> 22%</p>
            <p className="text-xs text-text-muted">Neutral</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-negative"><TrendingDown className="h-3 w-3" /> 10%</p>
            <p className="text-xs text-text-muted">Negative</p>
          </div>
        </div>
      </div>

      {/* Floating badge card */}
      <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-elevated px-4 py-3 shadow-elevated sm:block animate-fade-in">
        <p className="text-xs text-text-muted">Top theme this week</p>
        <p className="text-sm font-semibold text-text-primary">App Performance</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-base/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI-Powered Feedback Intelligence
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Turn Customer Feedback{' '}
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Into Action
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-text-secondary">
              AI-powered sentiment analysis, theme clustering, and grounded Q&A — HermesX helps you
              understand what your customers really think and build products they love.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need to understand your customers
            </h2>
            <p className="mt-4 text-text-secondary">
              From raw feedback to clear, actionable insight — automatically.
            </p>
          </div>

          <div id="how-it-works" className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="theme-transition rounded-card border border-border bg-card p-6 shadow-card hover:shadow-elevated"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Ready to listen to your customers?</h2>
          <p className="mt-4 text-text-secondary">
            Create your workspace in under a minute — no credit card required.
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
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Customer feedback. Clearer insights. Bigger possibilities.
          </p>
        </div>
      </footer>
    </div>
  );
}
