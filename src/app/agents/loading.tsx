import {
  ConfigCardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getSkeletonKeys } from '@/src/lib/utils/skeleton-keys';

const CARD_KEYS = getSkeletonKeys(9);

export default function Loading() {
  const config = {
    cardsPerRow: 3,
    totalCards: 9,
    gridClass: UI_CLASSES.GRID_RESPONSIVE_3_TIGHT,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Search bar */}
      <div className="mb-8">
        <Skeleton size="lg" width="3xl" className="h-12" />
      </div>

      {/* Content grid */}
      <div className={config.gridClass}>
        {Array.from({ length: config.totalCards }, (_, i) => (
          <ConfigCardSkeleton key={CARD_KEYS[i]} />
        ))}
      </div>
    </div>
  );
}
