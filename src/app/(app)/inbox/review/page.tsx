'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  SkipForward,
  Sparkles,
  RotateCw,
  PartyPopper,
} from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { listFeedback, updateFeedback, classifyFeedback, reclassifyFeedback } from '@/services/api/feedback.api';
import { ApiClientError } from '@/services/api/client';
import { Button } from '@/components/ui/Button';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { ThemeChip } from '@/components/ui/ThemeChip';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatSentimentScore, channelLabel } from '@/lib/utils';
import type { FeedbackDto } from '@/types';

// Bounded queue size per "Start Review" session — matches the same
// serverless-time-limit reasoning as the batch classify endpoint. A
// workspace with more than this many unreviewed items just clicks "Start
// Review" again after finishing this batch to continue.
const REVIEW_QUEUE_LIMIT = 20;

export default function ReviewModePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Priority proxy: most-negative-first, using the existing sentimentScore
  // column — no schema changes needed to get a meaningful review order.
  const queueResult = useAsync(
    () =>
      listFeedback({
        status: 'NEW',
        sortBy: 'sentimentScore',
        sortOrder: 'asc',
        limit: REVIEW_QUEUE_LIMIT,
        page: 1,
      }),
    []
  );

  const [queue, setQueue] = useState<FeedbackDto[]>([]);
  const [index, setIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (queueResult.data) {
      setQueue(queueResult.data.data);
      setIndex(0);
    }
  }, [queueResult.data]);

  const current = queue[index];
  const isDone = queue.length > 0 && index >= queue.length;

  const advance = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  const handleMarkReviewed = useCallback(async () => {
    if (!current || isBusy) return;
    setIsBusy(true);
    try {
      await updateFeedback(current.id, { status: 'REVIEWED' });
      setReviewedCount((c) => c + 1);
      advance();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update status.');
    } finally {
      setIsBusy(false);
    }
  }, [current, isBusy, advance, toast]);

  const handleSkip = useCallback(() => {
    if (isBusy) return;
    advance();
  }, [isBusy, advance]);

  const handlePrevious = useCallback(() => {
    if (isBusy) return;
    setIndex((i) => Math.max(0, i - 1));
  }, [isBusy]);

  const handleAnalyze = useCallback(async () => {
    if (!current || isBusy) return;
    setIsBusy(true);
    try {
      const updated = current.aiAnalyzed
        ? await reclassifyFeedback(current.id)
        : await classifyFeedback(current.id);
      setQueue((q) => q.map((item, i) => (i === index ? updated : item)));
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'AI analysis failed.');
    } finally {
      setIsBusy(false);
    }
  }, [current, isBusy, index, toast]);

  // Keyboard shortcuts: R = mark reviewed & next, → = skip, ← = previous.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        handleMarkReviewed();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleSkip();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMarkReviewed, handleSkip, handlePrevious]);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-base px-6 py-4">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {queue.length > 0 ? `${Math.min(index + 1, queue.length)} / ${queue.length}` : 'Review Mode'}
          </p>
          <p className="text-xs text-text-muted">Priority queue — most negative feedback first</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/inbox')}
          aria-label="Exit review mode"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-hover"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        {queueResult.error ? (
          <ErrorState message={queueResult.error.message} onRetry={queueResult.refetch} />
        ) : queueResult.isLoading ? (
          <div className="w-full max-w-xl space-y-4">
            <Skeleton className="h-48" />
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="Nothing to review"
            description="There's no unreviewed feedback right now. New items will show up here as they come in."
            action={
              <Button variant="primary" size="sm" onClick={() => router.push('/inbox')}>
                Back to Inbox
              </Button>
            }
          />
        ) : isDone ? (
          <EmptyState
            icon={PartyPopper}
            title="All caught up!"
            description={`You reviewed ${reviewedCount} of ${queue.length} feedback items in this session.${
              queueResult.data && queueResult.data.pagination.total > REVIEW_QUEUE_LIMIT
                ? ' There are more waiting — start a new review session to continue.'
                : ''
            }`}
            action={
              <Button variant="primary" size="sm" onClick={() => router.push('/inbox')}>
                Back to Inbox
              </Button>
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-card border border-border bg-card p-6 shadow-elevated"
            >
              <div className="flex items-center gap-2">
                <SentimentBadge sentiment={current.sentiment} />
                <Badge tone="default">{channelLabel(current.channel)}</Badge>
                {current.customerLabel && (
                  <span className="text-xs text-text-muted">{current.customerLabel}</span>
                )}
              </div>

              <p className="mt-4 text-base leading-relaxed text-text-primary">{current.content}</p>

              {current.aiAnalyzed ? (
                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>Sentiment score: {formatSentimentScore(current.sentimentScore)}</span>
                    {current.featureArea && <span>Feature: {current.featureArea}</span>}
                  </div>
                  {current.themes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {current.themes.map((theme) => (
                        <ThemeChip key={theme.id} name={theme.name} color={theme.color} />
                      ))}
                    </div>
                  )}
                  {current.aiRationale && (
                    <p className="text-sm text-text-secondary">{current.aiRationale}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    <RotateCw className="h-3 w-3" />
                    Re-analyze
                  </button>
                </div>
              ) : (
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-text-secondary">Not yet analyzed.</p>
                  <Button variant="outline" size="sm" onClick={handleAnalyze} loading={isBusy}>
                    <Sparkles className="h-4 w-4" />
                    Analyze now
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Action bar */}
      {!isDone && queue.length > 0 && (
        <div className="flex items-center justify-center gap-3 border-t border-border bg-base p-4">
          <Button variant="ghost" size="md" onClick={handlePrevious} disabled={index === 0 || isBusy}>
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="md" onClick={handleSkip} disabled={isBusy}>
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
          <Button variant="primary" size="lg" onClick={handleMarkReviewed} loading={isBusy}>
            <CheckCircle2 className="h-4 w-4" />
            Mark Reviewed & Next
          </Button>
          <div className="ml-4 hidden gap-3 text-xs text-text-muted sm:flex">
            <span><kbd className="rounded border border-border px-1.5 py-0.5">R</kbd> Review</span>
            <span><kbd className="rounded border border-border px-1.5 py-0.5">→</kbd> Skip</span>
            <span><kbd className="rounded border border-border px-1.5 py-0.5">←</kbd> Back</span>
          </div>
        </div>
      )}
    </div>
  );
}