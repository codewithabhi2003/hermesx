import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { Badge } from './Badge';
import type { Sentiment } from '@/types';

export interface SentimentBadgeProps {
  sentiment: Sentiment | null;
  className?: string;
}

const CONFIG = {
  POSITIVE: { label: 'Positive', tone: 'positive' as const, icon: TrendingUp },
  NEGATIVE: { label: 'Negative', tone: 'negative' as const, icon: TrendingDown },
  NEUTRAL: { label: 'Neutral', tone: 'neutral' as const, icon: Minus },
};

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  if (!sentiment) {
    return (
      <Badge tone="default" className={className}>
        <HelpCircle className="mr-1 h-3 w-3" aria-hidden="true" />
        Unanalyzed
      </Badge>
    );
  }

  const config = CONFIG[sentiment];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={className}>
      <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
