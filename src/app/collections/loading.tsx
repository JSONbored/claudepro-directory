/**
 * Collections Category Loading State
 * Matches 3-column grid layout
 */

import {
  ConfigCardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      <div className="mb-8">
        <Skeleton size="lg" width="3xl" className="h-12" />
      </div>
      <div className={UI_CLASSES.GRID_RESPONSIVE_3_TIGHT}>
        {Array.from({ length: 9 }).map((_, i) => (
          <ConfigCardSkeleton key={`skeleton-card-${i}`} />
        ))}
      </div>
    </div>
  );
}
