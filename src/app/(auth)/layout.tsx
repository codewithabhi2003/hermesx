import Link from 'next/link';
import { Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white">
            <Zap className="h-4 w-4" fill="currentColor" aria-hidden="true" />
          </span>
          <span className="text-lg">HermesX</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </main>
    </div>
  );
}
