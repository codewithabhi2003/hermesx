import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-hover', className)} aria-hidden="true" />;
}

/** A row of skeletons shaped like a typical list card — used while feedback/reports/themes load. */
export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}
