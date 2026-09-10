import Link from 'next/link';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { ThemeChip } from '@/components/ui/ThemeChip';
import { Badge } from '@/components/ui/Badge';
import {
  truncate,
  formatRelativeTime,
  channelLabel,
} from '@/lib/utils';
import type { FeedbackDto } from '@/types';

export interface FeedbackCardProps {
  feedback: FeedbackDto;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Link
      href={`/inbox/${feedback.id}`}
      className="block min-w-0 overflow-hidden rounded-card border border-border bg-card p-4 transition-shadow duration-150 hover:shadow-elevated"
    >
      {/* Feedback + Sentiment */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 flex-1 break-words text-sm text-text-primary">
          {truncate(feedback.content, 160)}
        </p>

        <SentimentBadge
          sentiment={feedback.sentiment}
          className="shrink-0"
        />
      </div>

      {/* Themes */}
      {feedback.themes.length > 0 && (
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          {feedback.themes.slice(0, 3).map((theme) => (
            <ThemeChip
              key={theme.id}
              name={theme.name}
              color={theme.color}
            />
          ))}

          {feedback.themes.length > 3 && (
            <span className="shrink-0 text-xs text-text-muted">
              +{feedback.themes.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-text-muted">
        {/* Channel */}
        <Badge tone="default" className="shrink-0">
          {channelLabel(feedback.channel)}
        </Badge>

        {/* Customer */}
        {feedback.customerLabel && (
          <>
            <span className="shrink-0 text-text-muted">·</span>

            <span
              className="min-w-0 flex-1 truncate"
              title={feedback.customerLabel}
            >
              {feedback.customerLabel}
            </span>
          </>
        )}

        {/* Time */}
        <span className="shrink-0 text-text-muted">·</span>

        <span className="shrink-0 whitespace-nowrap">
          {formatRelativeTime(feedback.createdAt)}
        </span>
      </div>
    </Link>
  );
}