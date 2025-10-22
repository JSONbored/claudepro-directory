/**
 * Root Loading State
 * Matches homepage structure with hero, search, and content sections
 */

import { ConfigCardSkeleton, Skeleton } from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function Loading() {
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
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={`stat-${i}`} size="sm" width="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="container mx-auto px-4 pb-16">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={`section-${sectionIndex}`} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <Skeleton size="lg" width="lg" />
              <Skeleton size="sm" width="sm" />
            </div>
            <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ConfigCardSkeleton key={`card-${sectionIndex}-${i}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
