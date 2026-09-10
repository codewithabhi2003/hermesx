'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@hermesx.dev',
    password: 'Password123!',
  },
  {
    role: 'Analyst',
    email: 'analyst@hermesx.dev',
    password: 'Password123!',
  },
  {
    role: 'Viewer',
    email: 'viewer@hermesx.dev',
    password: 'Password123!',
  },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setFormError('Invalid email or password');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const fillDemoAccount = (
  email: string,
  password: string,
) => {
  setFormError(null);
  setValue('email', email, {
    shouldValidate: true,
  });
  setValue('password', password, {
    shouldValidate: true,
  });
};

  return (
    <Card>
      <CardContent className="p-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Welcome back
        </h1>

        <p className="mt-1 text-sm text-text-secondary">
          Sign in to your account
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-4"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          {formError && (
            <p role="alert" className="text-sm text-negative">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
          >
            Sign in
          </Button>
        </form>

        {/* Demo access */}
        <div className="mt-6 rounded-xl border border-border bg-surface-secondary p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-text-primary">
              Try the demo
            </p>

            <p className="mt-1 text-xs text-text-secondary">
              Choose a role to fill the demo credentials.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() =>
  fillDemoAccount(account.email, account.password)
}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary transition hover:border-primary hover:text-primary"
              >
                {account.role}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}