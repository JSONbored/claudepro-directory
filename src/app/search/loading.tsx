/**
 * Search Results Loading State
 * Matches search page with filters
 */

import { ConfigCardSkeleton, Skeleton } from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Results count */}
      <Skeleton size="sm" width="sm" />

      {/* Results grid */}
      <div className={UI_CLASSES.GRID_RESPONSIVE_3_TIGHT}>
        {Array.from({ length: 9 }).map((_, i) => (
          <ConfigCardSkeleton key={`search-result-${i}`} />
        ))}
      </div>
    </div>
  );
}
