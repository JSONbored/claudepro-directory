/**
 * Changelog List Loading State
 *
 * Loading skeleton for changelog page while data is being fetched.
 * Shows placeholder cards matching the layout of ChangelogCard components.
 */

import { PageHeaderSkeleton, Skeleton } from '@/src/components/ui/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function ChangelogLoading() {
  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton size="sm" width="xs" className="mb-4" />
        <PageHeaderSkeleton />
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_6}>
          <Skeleton size="sm" width="lg" />
          <Skeleton size="sm" width="lg" />
        </div>
      </div>

      {/* Category Filter Skeleton */}
      <div className="grid w-full lg:w-auto lg:grid-flow-col gap-1 animate-pulse">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={`tab-${i + 1}`} size="lg" width="lg" rounded="md" />
        ))}
      </div>

      {/* Changelog Cards Skeleton */}
      <div className={UI_CLASSES.SPACE_Y_6}>
        {[...Array(6)].map((_, i) => (
          <div
            key={`changelog-skeleton-${i + 1}`}
            className="rounded-lg border bg-card p-6 animate-pulse"
          >
            <div className={`flex ${UI_CLASSES.ITEMS_CENTER} gap-2 mb-3`}>
              <Skeleton size="sm" width="xs" />
              <Skeleton size="sm" width="sm" />
            </div>
            <Skeleton size="lg" width="2/3" className={UI_CLASSES.MB_2} />
            <Skeleton size="sm" width="3xl" className={UI_CLASSES.MB_4} />
            <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
              <Skeleton size="sm" width="xs" rounded="full" />
              <Skeleton size="sm" width="xs" rounded="full" />
              <Skeleton size="sm" width="xs" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
