import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { formatNumber } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: 'default' | 'positive' | 'negative' | 'neutral' | 'primary';
  suffix?: string;
}

const TONE_CLASSES = {
  default: 'bg-hover text-text-secondary',
  positive: 'bg-positive/10 text-positive',
  negative: 'bg-negative/10 text-negative',
  neutral: 'bg-neutral/10 text-neutral',
  primary: 'bg-primary-soft text-primary',
};

export function StatCard({ label, value, icon: Icon, tone = 'default', suffix }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-text-primary">
        {formatNumber(value)}
        {suffix && <span className="text-base font-normal text-text-muted">{suffix}</span>}
      </p>
    </Card>
  );
}
