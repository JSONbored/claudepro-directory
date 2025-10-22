/**
 * Jobs Category Loading State
 * Matches 2-column grid layout
 */

import {
  ConfigCardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/loading-skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      <div className="mb-8">
        <Skeleton size="lg" width="3xl" className="h-12" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ConfigCardSkeleton key={`skeleton-card-${i}`} />
        ))}
      </div>
    </div>
  );
}
