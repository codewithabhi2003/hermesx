'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { createFeedback } from '@/services/api/feedback.api';
import { ApiClientError } from '@/services/api/client';

const CHANNEL_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'APP_STORE', label: 'App Store' },
  { value: 'SURVEY', label: 'Survey' },
  { value: 'SALES', label: 'Sales' },
  { value: 'SOCIAL', label: 'Social' },
];

const schema = z.object({
  content: z.string().trim().min(1, 'Feedback content is required').max(10_000),
  channel: z.enum(['MANUAL', 'SUPPORT', 'APP_STORE', 'SURVEY', 'SALES', 'SOCIAL']),
  sourceRef: z.string().trim().max(300).optional(),
  customerLabel: z.string().trim().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AddFeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { channel: 'MANUAL' } });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await createFeedback({
        content: values.content,
        channel: values.channel,
        sourceRef: values.sourceRef || undefined,
        customerLabel: values.customerLabel || undefined,
      });
      toast.success('Feedback added and queued for AI analysis.');
      router.push('/inbox');
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : 'Failed to add feedback.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Feedback</CardTitle>
          <p className="mt-1 text-sm text-text-secondary">Manually add customer feedback for analysis.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Textarea
              label="Feedback content"
              required
              rows={5}
              placeholder="Enter the customer feedback..."
              error={errors.content?.message}
              {...register('content')}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Source" options={CHANNEL_OPTIONS} {...register('channel')} />
              <Input
                label="Customer (optional)"
                placeholder="Customer name or email"
                error={errors.customerLabel?.message}
                {...register('customerLabel')}
              />
            </div>

            <Input
              label="Source reference (optional)"
              placeholder="e.g. ticket ID, review URL"
              hint="An identifier tying this back to where it came from."
              error={errors.sourceRef?.message}
              {...register('sourceRef')}
            />

            {formError && (
              <p role="alert" className="text-sm text-negative">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/inbox')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Add Feedback
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
