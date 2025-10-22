/**
 * Guides Category Loading State
 * Matches 2-column grid layout for guides
 */

import {
  ConfigCardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/loading-skeleton';

const cardIds = Array.from({ length: 6 }, () => crypto.randomUUID());

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      <div className="mb-8">
        <Skeleton size="lg" width="3xl" className="h-12" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cardIds.map((id) => (
          <ConfigCardSkeleton key={id} />
        ))}
      </div>
    </div>
  );
}
