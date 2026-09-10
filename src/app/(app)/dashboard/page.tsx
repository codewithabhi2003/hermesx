'use client';

import Link from 'next/link';
import { MessageSquare, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/hooks/useTheme';
import { getOverview, getVolume } from '@/services/api/analytics.api';
import { listFeedback } from '@/services/api/feedback.api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { ThemeBarChart } from '@/components/charts/ThemeBarChart';
import { getChartColors } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = getChartColors(theme);

  const overview = useAsync(() => getOverview(), []);
  const volume = useAsync(() => getVolume('30d'), []);
  const recent = useAsync(
    () =>
      listFeedback({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    [],
  );

  const isLoading = overview.isLoading || volume.isLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Welcome back
{user
  ? `, ${user.name.trim().charAt(0).toUpperCase()}${user.name.trim().slice(1).toLowerCase()}`
  : ''}
        </h1>

        <p className="mt-1 text-sm text-text-secondary">
          Here&apos;s what your customers are saying today.
        </p>
      </div>

      {overview.error ? (
        <ErrorState
          message={overview.error.message}
          onRetry={overview.refetch}
        />
      ) : isLoading || !overview.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Feedback"
            value={overview.data.totalFeedback}
            icon={MessageSquare}
            tone="primary"
          />

          <StatCard
            label="Positive"
            value={overview.data.positive}
            icon={ThumbsUp}
            tone="positive"
          />

          <StatCard
            label="Neutral"
            value={overview.data.neutral}
            icon={Minus}
            tone="neutral"
          />

          <StatCard
            label="Negative"
            value={overview.data.negative}
            icon={ThumbsDown}
            tone="negative"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Feedback Trend (Last 30 Days)</CardTitle>
          </CardHeader>

          <CardContent>
  {volume.error ? (
    <ErrorState
      message={volume.error.message}
      onRetry={volume.refetch}
    />
  ) : volume.isLoading || !volume.data ? (
    <Skeleton className="h-64" />
  ) : (
    <TrendLineChart
      data={volume.data.series.map((point) => ({
        date: point.date,
        count: point.count,
      }))}
      series={[
        {
          dataKey: 'count',
          name: 'Feedback',
          color: colors.primary,
        },
      ]}
    />
  )}
</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Themes</CardTitle>
          </CardHeader>

          <CardContent>
            {overview.data && (
              <ThemeBarChart
                data={overview.data.topThemes.map((t) => ({
                  name: t.name,
                  count: t.count,
                  color: t.color,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Feedback</CardTitle>

          <Link
            href="/inbox"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>

        <CardContent className="space-y-3">
          {recent.error ? (
            <ErrorState
              message={recent.error.message}
              onRetry={recent.refetch}
            />
          ) : recent.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))
          ) : recent.data && recent.data.data.length > 0 ? (
            recent.data.data.map((item) => (
              <FeedbackCard key={item.id} feedback={item} />
            ))
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No feedback yet"
              description="Add your first piece of feedback or import a CSV to get started."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}