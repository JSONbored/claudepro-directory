/**
 * Changelog Detail Loading State
 *
 * Loading skeleton for individual changelog entry page.
 * Shows placeholder content matching the layout of the detail page.
 */

import { Skeleton, UI_CLASSES, Separator } from '@heyclaude/web-runtime/ui';

/**
 * Render a skeleton UI for the changelog entry detail page.
 *
 * Displays placeholder skeletons that mirror the final changelog detail layout:
 * back navigation, header (date, title, canonical URL), a TL;DR box, category badges,
 * content paragraphs, and repeated section headers to indicate loading state.
 *
 * @returns A React element containing the skeleton layout for the changelog entry detail.
 *
 * @see Skeleton
 * @see Separator
 * @see UI_CLASSES
 */
export default function ChangelogEntryLoading() {
  return (
    <article className="container max-w-4xl space-y-8 py-8">
      {/* Back Navigation Skeleton */}
      <Skeleton size="sm" width="xs" />

      {/* Header Skeleton */}
      <header className="space-y-4 pb-6">
        {/* Date */}
        <div className="flex items-center gap-3">
          <Skeleton size="sm" width="xs" />
          <Skeleton size="sm" width="sm" />
        </div>

        {/* Title */}
        <Skeleton size="xl" width="3/4" />

        {/* Canonical URL */}
        <div className="flex items-center gap-2">
          <Skeleton size="sm" width="xs" />
          <Skeleton size="sm" width="2xl" />
        </div>
      </header>

      <Separator className="my-6" />

      {/* Content Skeleton */}
      <div className="space-y-6">
        {/* TL;DR Box */}
        <div className="rounded-lg border p-4">
          <Skeleton size="sm" width="xs" className="mb-2" />
          <Skeleton size="sm" width="3xl" />
        </div>

        {/* Category Badges */}
        <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`category-${index + 1}`} size="sm" width="xs" rounded="full" />
          ))}
        </div>

        {/* Content Paragraphs */}
        <div className="space-y-4">
          <Skeleton size="md" width="3xl" />
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="5/6" />
          <Skeleton size="sm" width="3xl" />
          <Skeleton size="sm" width="2/3" />
        </div>

        {/* Section Headers */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`section-${index + 1}`} className="space-y-3">
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