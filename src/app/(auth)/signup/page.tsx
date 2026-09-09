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
import { signup } from '@/services/api/auth.api';
import { ApiClientError } from '@/services/api/client';

const signupSchema = z
  .object({
    workspaceName: z.string().trim().min(1, 'Workspace name is required'),
    name: z.string().trim().min(1, 'Your name is required'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupFormValues) => {
    setFormError(null);

    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        workspaceName: values.workspaceName,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      return;
    }

    // Signup succeeded but does NOT establish a session by itself —
    // authenticate through NextAuth Credentials right after.
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      // Account was created but the auto-login failed for some reason —
      // send them to log in manually rather than leaving them stuck.
      router.push('/login');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="p-8">
        <h1 className="text-2xl font-semibold text-text-primary">Create your account</h1>
        <p className="mt-1 text-sm text-text-secondary">Start turning feedback into insights</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          <Input
            label="Workspace name"
            placeholder="Acme Inc"
            error={errors.workspaceName?.message}
            {...register('workspaceName')}
          />
          <Input
            label="Your name"
            placeholder="Jane Doe"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {formError && (
            <p role="alert" className="text-sm text-negative">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
