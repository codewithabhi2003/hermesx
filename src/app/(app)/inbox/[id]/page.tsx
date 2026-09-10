'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Trash2, RotateCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import {
  getFeedback,
  updateFeedback,
  deleteFeedback,
  classifyFeedback,
  reclassifyFeedback,
} from '@/services/api/feedback.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { ThemeChip } from '@/components/ui/ThemeChip';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ApiClientError } from '@/services/api/client';
import { formatDate, formatSentimentScore, channelLabel } from '@/lib/utils';
import type { Status } from '@/types';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ACTIONED', label: 'Actioned' },
];

export default function FeedbackDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasRole('ADMIN', 'ANALYST');

  const feedbackResult = useAsync(() => getFeedback(params.id), [params.id]);

  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const feedback = feedbackResult.data;
  const currentStatus = pendingStatus ?? feedback?.status;
  const hasStatusChanged = feedback && pendingStatus && pendingStatus !== feedback.status;

  const handleSaveStatus = async () => {
    if (!feedback || !pendingStatus) return;
    setIsSaving(true);
    try {
      await updateFeedback(feedback.id, { status: pendingStatus });
      toast.success('Status updated.');
      setPendingStatus(null);
      feedbackResult.refetch();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClassify = async () => {
    if (!feedback) return;
    setIsClassifying(true);
    try {
      feedback.aiAnalyzed ? await reclassifyFeedback(feedback.id) : await classifyFeedback(feedback.id);
      toast.success('Feedback classified.');
      feedbackResult.refetch();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Classification failed.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleDelete = async () => {
    if (!feedback) return;
    setIsDeleting(true);
    try {
      await deleteFeedback(feedback.id);
      toast.success('Feedback deleted.');
      router.push('/inbox');
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete feedback.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/inbox" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </Link>

      {feedbackResult.error ? (
        <ErrorState message={feedbackResult.error.message} onRetry={feedbackResult.refetch} />
      ) : feedbackResult.isLoading || !feedback ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <SentimentBadge sentiment={feedback.sentiment} />
                <Badge tone="default">{channelLabel(feedback.channel)}</Badge>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete feedback"
                  className="text-text-muted hover:text-negative"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed text-text-primary">{feedback.content}</p>

              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-text-muted">Customer</dt>
                  <dd className="text-text-primary">{feedback.customerLabel ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Source</dt>
                  <dd className="text-text-primary">{feedback.sourceRef ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Received</dt>
                  <dd className="text-text-primary">{formatDate(feedback.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {feedback.aiAnalyzed ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-text-muted">Sentiment score</dt>
                      <dd className="text-text-primary">{formatSentimentScore(feedback.sentimentScore)}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Feature area</dt>
                      <dd className="text-text-primary">{feedback.featureArea ?? '—'}</dd>
                    </div>
                  </div>

                  {feedback.themes.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs text-text-muted">Themes</p>
                      <div className="flex flex-wrap gap-2">
                        {feedback.themes.map((theme) => (
                          <ThemeChip key={theme.id} name={theme.name} color={theme.color} />
                        ))}
                      </div>
                    </div>
                  )}

                  {feedback.aiRationale && (
                    <div>
                      <p className="mb-1 text-xs text-text-muted">Summary</p>
                      <p className="text-sm text-text-secondary">{feedback.aiRationale}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">This feedback hasn&apos;t been analyzed yet.</p>
              )}

              {canManage && (
                <Button variant="outline" size="sm" className="mt-4" onClick={handleClassify} loading={isClassifying}>
                  {feedback.aiAnalyzed ? <RotateCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  {feedback.aiAnalyzed ? 'Reclassify' : 'Classify with AI'}
                </Button>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    options={STATUS_OPTIONS}
                    value={currentStatus}
                    onChange={(e) => setPendingStatus(e.target.value as Status)}
                  />
                </div>
                <Button variant="primary" onClick={handleSaveStatus} loading={isSaving} disabled={!hasStatusChanged}>
                  Save changes
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete feedback"
        description="This will permanently delete this feedback and its AI analysis. This cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
