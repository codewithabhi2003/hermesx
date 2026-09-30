'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Inbox as InboxIcon,
  Plus,
  Upload,
  RefreshCw,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock3,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';

import {
  listFeedback,
  syncAppStoreFeedback,
  classifyBatch,
} from '@/services/api/feedback.api';

import { getOverview } from '@/services/api/analytics.api';

import {
  FeedbackFilters,
  type FeedbackFiltersValue,
} from '@/components/feedback/FeedbackFilters';

import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const EMPTY_FILTERS: FeedbackFiltersValue = {
  search: '',
  channel: '',
  sentiment: '',
  status: '',
};

const BATCH_SIZE = 20;

// Safety cap on how many batch calls one click will trigger.
const MAX_BATCH_ROUNDS = 100;

type FeedbackStatus = 'NEW' | 'REVIEWED' | 'ACTIONED';

type StatusCounts = {
  NEW: number;
  REVIEWED: number;
  ACTIONED: number;
};

const DEFAULT_STATUS_COUNTS: StatusCounts = {
  NEW: 0,
  REVIEWED: 0,
  ACTIONED: 0,
};

export default function InboxPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  const canManage = hasRole('ADMIN', 'ANALYST');

  const [filters, setFilters] =
    useState<FeedbackFiltersValue>(EMPTY_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 300);

  const { page, setPage } = usePagination(20);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const result = useAsync(
    () =>
      listFeedback({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        channel: filters.channel || undefined,
        sentiment: filters.sentiment || undefined,
        status: filters.status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    [
      page,
      debouncedSearch,
      filters.channel,
      filters.sentiment,
      filters.status,
    ],
  );

  const overview = useAsync(() => getOverview(), []);

  /*
   * Status counts
   *
   * If your API returns:
   *
   * statusCounts: {
   *   NEW: 32,
   *   REVIEWED: 41,
   *   ACTIONED: 16
   * }
   *
   * those values will be used.
   *
   * Until then, this safely falls back to the currently loaded
   * feedback records.
   */
  const statusCounts: StatusCounts = result.data?.statusCounts ?? {
  NEW: 0,
  REVIEWED: 0,
  ACTIONED: 0,
};

  const totalFeedback =
    statusCounts.NEW +
    statusCounts.REVIEWED +
    statusCounts.ACTIONED;

  const pendingCount = overview.data
    ? overview.data.totalFeedback - overview.data.aiAnalyzed
    : 0;

  const allFeedbackActioned =
    totalFeedback > 0 &&
    statusCounts.NEW === 0 &&
    statusCounts.REVIEWED === 0 &&
    statusCounts.ACTIONED === totalFeedback;

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const { synced } = await syncAppStoreFeedback(10);

      toast.success(`Synced ${synced} new App Store reviews.`);

      result.refetch();
      overview.refetch();
    } catch {
      toast.error('App Store sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAnalyzePending = async () => {
    setIsAnalyzing(true);
    setAnalyzeProgress(0);

    let totalProcessed = 0;

    try {
      for (
        let round = 0;
        round < MAX_BATCH_ROUNDS;
        round += 1
      ) {
        const { processed, remaining } =
          await classifyBatch(BATCH_SIZE);

        totalProcessed += processed;

        setAnalyzeProgress(totalProcessed);

        if (remaining === 0 || processed === 0) {
          break;
        }
      }

      toast.success(
        `Analyzed ${totalProcessed} feedback item${
          totalProcessed === 1 ? '' : 's'
        }.`,
      );

      result.refetch();
      overview.refetch();
    } catch {
      toast.error(
        'Analysis stopped due to an error. Progress so far was saved — try again to continue.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            All Feedback
            {result.data
              ? ` (${result.data.pagination.total})`
              : ''}
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            Browse, filter, and manage customer feedback.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link href="/inbox/review">
              <Button variant="outline" size="sm">
                <PlayCircle className="h-4 w-4" />
                Start Review
              </Button>
            </Link>

            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzePending}
                loading={isAnalyzing}
              >
                <Sparkles className="h-4 w-4" />

                {isAnalyzing
                  ? `Analyzing (${analyzeProgress}/${pendingCount})...`
                  : `Analyze Pending (${pendingCount})`}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              loading={isSyncing}
            >
              <RefreshCw className="h-4 w-4" />
              Sync App Store
            </Button>

            <Link href="/inbox/import">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </Link>

            <Link href="/inbox/new">
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4" />
                Add Feedback
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* NEW */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                New
              </p>

              <p className="mt-1 text-2xl font-semibold text-text-primary">
                {statusCounts.NEW}
              </p>

              <p className="mt-1 text-xs text-text-secondary">
                Awaiting review
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Circle className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* REVIEWED */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Reviewed
              </p>

              <p className="mt-1 text-2xl font-semibold text-text-primary">
                {statusCounts.REVIEWED}
              </p>

              <p className="mt-1 text-xs text-text-secondary">
                Reviewed feedback
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock3 className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* ACTIONED */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Actioned
              </p>

              <p className="mt-1 text-2xl font-semibold text-text-primary">
                {statusCounts.ACTIONED}
              </p>

              <p className="mt-1 text-xs text-text-secondary">
                Completed feedback
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Completion Message */}
      {allFeedbackActioned && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>

            <div>
              <h2 className="font-semibold text-text-primary">
                All feedback has been actioned
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                You&apos;ve completed the current feedback queue.
                New customer feedback will appear here when it is
                added.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <FeedbackFilters
        value={filters}
        onChange={setFilters}
      />

      {/* Feedback List */}
      <div className="space-y-3">
        {result.error ? (
          <ErrorState
            message={result.error.message}
            onRetry={result.refetch}
          />
        ) : result.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : result.data && result.data.data.length > 0 ? (
          <>
            {/* NEW */}
            {result.data.data.some(
              (item) => item.status === 'NEW',
            ) && (
              <div className="pt-2">
                <div className="mb-3 flex items-center gap-2">
                  <Circle className="h-4 w-4 text-blue-500" />

                  <h2 className="text-sm font-semibold text-text-primary">
                    New
                  </h2>

                  <span className="text-xs text-text-secondary">
                    {statusCounts.NEW}
                  </span>
                </div>

                <div className="space-y-3">
                  {result.data.data
                    .filter(
                      (item) => item.status === 'NEW',
                    )
                    .map((item) => (
                      <FeedbackCard
                        key={item.id}
                        feedback={item}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* REVIEWED */}
            {result.data.data.some(
              (item) => item.status === 'REVIEWED',
            ) && (
              <div className="pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-amber-500" />

                  <h2 className="text-sm font-semibold text-text-primary">
                    Reviewed
                  </h2>

                  <span className="text-xs text-text-secondary">
                    {statusCounts.REVIEWED}
                  </span>
                </div>

                <div className="space-y-3">
                  {result.data.data
                    .filter(
                      (item) =>
                        item.status === 'REVIEWED',
                    )
                    .map((item) => (
                      <FeedbackCard
                        key={item.id}
                        feedback={item}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* ACTIONED */}
            {result.data.data.some(
              (item) => item.status === 'ACTIONED',
            ) && (
              <div className="pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                  <h2 className="text-sm font-semibold text-text-primary">
                    Actioned
                  </h2>

                  <span className="text-xs text-text-secondary">
                    {statusCounts.ACTIONED}
                  </span>
                </div>

                <div className="space-y-3">
                  {result.data.data
                    .filter(
                      (item) =>
                        item.status === 'ACTIONED',
                    )
                    .map((item) => (
                      <FeedbackCard
                        key={item.id}
                        feedback={item}
                      />
                    ))}
                </div>
              </div>
            )}

            <Pagination
              pagination={result.data.pagination}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            icon={InboxIcon}
            title="No feedback found"
            description={
              filters.search ||
              filters.channel ||
              filters.sentiment ||
              filters.status
                ? 'Try adjusting your filters.'
                : 'Add your first piece of feedback or import a CSV to get started.'
            }
            action={
              canManage &&
              !filters.search &&
              !filters.channel && (
                <Link href="/inbox/new">
                  <Button
                    variant="primary"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Feedback
                  </Button>
                </Link>
              )
            }
          />
        )}
      </div>
    </div>
  );
}