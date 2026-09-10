'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Channel, Sentiment, Status } from '@/types';

export interface FeedbackFiltersValue {
  search: string;
  channel: Channel | '';
  sentiment: Sentiment | '';
  status: Status | '';
}

export interface FeedbackFiltersProps {
  value: FeedbackFiltersValue;
  onChange: (value: FeedbackFiltersValue) => void;
}

const CHANNEL_OPTIONS = [
  { value: '', label: 'All channels' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'APP_STORE', label: 'App Store' },
  { value: 'SURVEY', label: 'Survey' },
  { value: 'SALES', label: 'Sales' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'MANUAL', label: 'Manual' },
];

const SENTIMENT_OPTIONS = [
  { value: '', label: 'All sentiment' },
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'NEGATIVE', label: 'Negative' },
  { value: 'NEUTRAL', label: 'Neutral' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ACTIONED', label: 'Actioned' },
];

export function FeedbackFilters({ value, onChange }: FeedbackFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Search feedback..."
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="pl-9"
        />
      </div>
      <Select
        options={CHANNEL_OPTIONS}
        value={value.channel}
        onChange={(e) => onChange({ ...value, channel: e.target.value as Channel | '' })}
        className="sm:w-40"
      />
      <Select
        options={SENTIMENT_OPTIONS}
        value={value.sentiment}
        onChange={(e) => onChange({ ...value, sentiment: e.target.value as Sentiment | '' })}
        className="sm:w-40"
      />
      <Select
        options={STATUS_OPTIONS}
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as Status | '' })}
        className="sm:w-40"
      />
    </div>
  );
}
