/**
 * Root Loading State
 * Matches homepage structure with hero, search, and content sections
 */

import { ConfigCardSkeleton, Skeleton } from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Generate stable unique IDs for skeleton items (avoids array index key warning)
const generateSkeletonIds = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, i) => `${prefix}-${crypto.randomUUID()}-${i}`);

export default function Loading() {
  // Generate IDs once per render
  const statIds = generateSkeletonIds(7, 'stat');
  const sectionIds = generateSkeletonIds(3, 'section');
  const cardIds = sectionIds.map((sId) => generateSkeletonIds(6, `card-${sId}`));
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-4 py-16 text-center">
          <Skeleton size="xl" width="3/4" className="mx-auto mb-6 h-16" />
          <Skeleton size="md" width="2/3" className="mx-auto" />
        </div>
      </section>

      {/* Search */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton size="lg" width="3xl" className="h-14 mb-6" />
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4">
            {statIds.map((id) => (
              <Skeleton key={id} size="sm" width="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="container mx-auto px-4 pb-16">
        {sectionIds.map((sectionId, sectionIndex) => (
          <div key={sectionId} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <Skeleton size="lg" width="lg" />
              <Skeleton size="sm" width="sm" />
            </div>
            <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
              {cardIds[sectionIndex]?.map((cardId) => (
                <ConfigCardSkeleton key={cardId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
