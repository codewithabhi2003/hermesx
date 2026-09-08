'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Inbox as InboxIcon, Plus, Upload, RefreshCw, Sparkles, PlayCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import { listFeedback, syncAppStoreFeedback, classifyBatch } from '@/services/api/feedback.api';
import { getOverview } from '@/services/api/analytics.api';
import { FeedbackFilters, type FeedbackFiltersValue } from '@/components/feedback/FeedbackFilters';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const EMPTY_FILTERS: FeedbackFiltersValue = { search: '', channel: '', sentiment: '', status: '' };
const BATCH_SIZE = 20;
// Safety cap on how many batch calls one click will trigger, so a stuck
// classification (e.g. a persistently failing row) can't spin forever.
const MAX_BATCH_ROUNDS = 100;

export default function InboxPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasRole('ADMIN', 'ANALYST');

  const [filters, setFilters] = useState<FeedbackFiltersValue>(EMPTY_FILTERS);
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
    [page, debouncedSearch, filters.channel, filters.sentiment, filters.status]
  );

  const overview = useAsync(() => getOverview(), []);
  const pendingCount = overview.data ? overview.data.totalFeedback - overview.data.aiAnalyzed : 0;

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
      for (let round = 0; round < MAX_BATCH_ROUNDS; round += 1) {
        const { processed, remaining } = await classifyBatch(BATCH_SIZE);
        totalProcessed += processed;
        setAnalyzeProgress(totalProcessed);

        if (remaining === 0 || processed === 0) break;
      }

      toast.success(`Analyzed ${totalProcessed} feedback item${totalProcessed === 1 ? '' : 's'}.`);
      result.refetch();
      overview.refetch();
    } catch {
      toast.error('Analysis stopped due to an error. Progress so far was saved — try again to continue.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            All Feedback{result.data ? ` (${result.data.pagination.total})` : ''}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Browse, filter, and manage customer feedback.</p>
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
              <Button variant="outline" size="sm" onClick={handleAnalyzePending} loading={isAnalyzing}>
                <Sparkles className="h-4 w-4" />
                {isAnalyzing ? `Analyzing (${analyzeProgress}/${pendingCount})...` : `Analyze Pending (${pendingCount})`}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSync} loading={isSyncing}>
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

      <FeedbackFilters value={filters} onChange={setFilters} />

      <div className="space-y-3">
        {result.error ? (
          <ErrorState message={result.error.message} onRetry={result.refetch} />
        ) : result.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : result.data && result.data.data.length > 0 ? (
          <>
            {result.data.data.map((item) => (
              <FeedbackCard key={item.id} feedback={item} />
            ))}
            <Pagination pagination={result.data.pagination} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={InboxIcon}
            title="No feedback found"
            description={
              filters.search || filters.channel || filters.sentiment || filters.status
                ? 'Try adjusting your filters.'
                : 'Add your first piece of feedback or import a CSV to get started.'
            }
            action={
              canManage &&
              !filters.search &&
              !filters.channel && (
                <Link href="/inbox/new">
                  <Button variant="primary" size="sm">
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