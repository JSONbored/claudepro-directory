/**
 * For You Page Loading State
 * Matches personalized content layout
 */

import {
  ConfigCardSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const cardIds = Array.from({ length: 9 }, () => crypto.randomUUID());

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      <div className="mb-8">
        <Skeleton size="lg" width="3xl" className="h-12" />
      </div>
      <div className={UI_CLASSES.GRID_RESPONSIVE_3_TIGHT}>
        {cardIds.map((id) => (
          <ConfigCardSkeleton key={id} />
        ))}
      </div>
    </div>
  );
}
