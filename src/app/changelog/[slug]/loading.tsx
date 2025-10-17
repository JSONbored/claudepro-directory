/**
 * Changelog Detail Loading State
 *
 * Loading skeleton for individual changelog entry page.
 * Shows placeholder content matching the layout of the detail page.
 */

import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { Separator } from '@/src/components/primitives/separator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export default function ChangelogEntryLoading() {
  return (
    <article className="container max-w-4xl py-8 space-y-8">
      {/* Back Navigation Skeleton */}
      <Skeleton size="sm" width="xs" />

      {/* Header Skeleton */}
      <header className="space-y-4 pb-6 animate-pulse">
        {/* Date */}
        <div className={'flex items-center gap-3'}>
          <Skeleton size="sm" width="xs" />
          <Skeleton size="sm" width="sm" />
        </div>

        {/* Title */}
        <Skeleton size="xl" width="3/4" />

        {/* Canonical URL */}
        <div className={'flex items-center gap-2'}>
          <Skeleton size="sm" width="xs" />
          <Skeleton size="sm" width="2xl" />
        </div>
      </header>

      <Separator className="my-6" />

      {/* Content Skeleton */}
      <div className="space-y-6">
        {/* TL;DR Box */}
        <div className="rounded-lg border p-4 animate-pulse">
          <Skeleton size="sm" width="xs" className="mb-2" />
          <Skeleton size="sm" width="3xl" />
        </div>

        {/* Category Badges */}
        <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`category-${i + 1}`} size="sm" width="xs" rounded="full" />
          ))}
        </div>

        {/* Content Paragraphs */}
        <div className="space-y-4 animate-pulse">
          <Skeleton size="md" width="3xl" />
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="5/6" />
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="2/3" />
        </div>

        {/* Section Headers */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={`section-${i + 1}`} className="space-y-3 animate-pulse">
              <Skeleton size="lg" width="sm" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="5/6" />
              <Skeleton size="sm" width="3xl" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
