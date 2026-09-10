'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/hooks/useTheme';
import { getTrends, getThemeAnalytics } from '@/services/api/analytics.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { SentimentDonutChart } from '@/components/charts/SentimentDonutChart';
import { getChartColors } from '@/lib/utils';
import type { AnalyticsPeriod } from '@/types';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function TrendsPage() {
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const trends = useAsync(() => getTrends(period), [period]);
  const themes = useAsync(() => getThemeAnalytics(), []);

  const themeDistribution = (themes.data ?? [])
    .slice(0, 6)
    .map((t) => ({
      name: t.name,
      value: t.feedbackCount,
      color: t.color,
    }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Theme Trends
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            Track how key themes and sentiment evolve over time.
          </p>
        </div>

        <Select
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value as AnalyticsPeriod)
          }
          className="w-44"
        />
      </div>

      {/* Sentiment Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Over Time</CardTitle>
        </CardHeader>

        <CardContent>
          {trends.error ? (
            <ErrorState
              message={trends.error.message}
              onRetry={trends.refetch}
            />
          ) : trends.isLoading || !trends.data ? (
            <Skeleton className="h-72" />
          ) : (
            <TrendLineChart
              data={trends.data.series.map((point) => ({
                date: point.date,
                positive: point.positive,
                negative: point.negative,
                neutral: point.neutral,
              }))}
              series={[
                {
                  dataKey: 'positive',
                  name: 'Positive',
                  color: colors.positive,
                },
                {
                  dataKey: 'negative',
                  name: 'Negative',
                  color: colors.negative,
                },
                {
                  dataKey: 'neutral',
                  name: 'Neutral',
                  color: colors.neutral,
                },
              ]}
              height={320}
            />
          )}
        </CardContent>
      </Card>

      {/* Theme Distribution + Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Theme Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Distribution</CardTitle>
          </CardHeader>

          <CardContent className="flex min-h-[420px] items-center justify-center">
            {themes.error ? (
              <ErrorState
                message={themes.error.message}
                onRetry={themes.refetch}
              />
            ) : themes.isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : themeDistribution.length > 0 ? (
              <div className="w-full">
                <SentimentDonutChart data={themeDistribution} />
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No themes yet"
                description="Themes appear once feedback has been classified."
              />
            )}
          </CardContent>
        </Card>

        {/* Theme Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Leaderboard</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {themes.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))
            ) : themes.data && themes.data.length > 0 ? (
              (() => {
                const maxCount = Math.max(
                  ...themes.data.map((t) => t.feedbackCount),
                  1
                );

                return themes.data.map((t) => {
                  const total = t.feedbackCount || 1;

                  const neutralCount = Math.max(
                    total -
                      t.sentimentBreakdown.positive -
                      t.sentimentBreakdown.negative,
                    0
                  );

                  const barWidthPct =
                    (t.feedbackCount / maxCount) * 100;

                  return (
                    <div key={t.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: t.color,
                            }}
                          />

                          {t.name}
                        </span>

                        <span className="text-xs font-medium text-text-muted">
                          {t.feedbackCount} total
                        </span>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-hover">
                        <div
                          className="flex h-full"
                          style={{
                            width: `${barWidthPct}%`,
                          }}
                        >
                          <div
                            style={{
                              width: `${
                                (t.sentimentBreakdown.positive /
                                  total) *
                                100
                              }%`,
                              backgroundColor: colors.positive,
                            }}
                          />

                          <div
                            style={{
                              width: `${
                                (neutralCount / total) * 100
                              }%`,
                              backgroundColor: colors.neutral,
                            }}
                          />

                          <div
                            style={{
                              width: `${
                                (t.sentimentBreakdown.negative /
                                  total) *
                                100
                              }%`,
                              backgroundColor: colors.negative,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-1.5 flex gap-3 text-xs">
                        <span
                          style={{
                            color: colors.positive,
                          }}
                        >
                          {t.sentimentBreakdown.positive} pos
                        </span>

                        <span
                          style={{
                            color: colors.negative,
                          }}
                        >
                          {t.sentimentBreakdown.negative} neg
                        </span>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No themes yet"
                description="Themes appear once feedback has been classified."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}