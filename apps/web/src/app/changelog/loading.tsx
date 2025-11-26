/**
 * Changelog List Loading State
 *
 * Loading skeleton for changelog page while data is being fetched.
 * Shows placeholder cards matching the layout of ChangelogCard components.
 */

import { UI_CLASSES } from '@heyclaude/web-runtime/ui';

import {
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/feedback/loading-skeleton';

export default function ChangelogLoading() {
  return (
    <div className="container max-w-6xl space-y-8 py-8">
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
      <div className="grid w-full gap-1 lg:w-auto lg:grid-flow-col">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`tab-${index + 1}`} size="lg" width="lg" rounded="md" />
        ))}
      </div>

      {/* Changelog Cards Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`changelog-skeleton-${index + 1}`} className="rounded-lg border bg-card p-6">
            <div className={'mb-3 flex items-center gap-2'}>
              <Skeleton size="sm" width="xs" />
              <Skeleton size="sm" width="sm" />
            </div>
            <Skeleton size="lg" width="2/3" className="mb-2" />
            <Skeleton size="sm" width="3xl" className="mb-4" />
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
