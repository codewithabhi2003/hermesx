import Link from 'next/link';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { ThemeChip } from '@/components/ui/ThemeChip';
import { Badge } from '@/components/ui/Badge';
import { truncate, formatRelativeTime, channelLabel } from '@/lib/utils';
import type { FeedbackDto } from '@/types';

export interface FeedbackCardProps {
  feedback: FeedbackDto;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Link
      href={`/inbox/${feedback.id}`}
      className="block rounded-card border border-border bg-card p-4 transition-shadow duration-150 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text-primary">{truncate(feedback.content, 160)}</p>
        <SentimentBadge sentiment={feedback.sentiment} className="flex-shrink-0" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {feedback.themes.slice(0, 3).map((theme) => (
          <ThemeChip key={theme.id} name={theme.name} color={theme.color} />
        ))}
        {feedback.themes.length > 3 && (
          <span className="text-xs text-text-muted">+{feedback.themes.length - 3} more</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <Badge tone="default">{channelLabel(feedback.channel)}</Badge>
        {feedback.customerLabel && <span>{feedback.customerLabel}</span>}
        <span>·</span>
        <span>{formatRelativeTime(feedback.createdAt)}</span>
      </div>
    </Link>
  );
}
