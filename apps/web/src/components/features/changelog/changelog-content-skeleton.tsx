/**
 * Changelog Content Skeleton
 *
 * Skeleton UI for changelog timeline view that matches the two-column layout
 * with timeline markers on the left and content cards on the right.
 *
 * Used as Suspense fallback for streaming changelog content.
 */

import { UI_CLASSES, Skeleton } from '@heyclaude/web-runtime/ui';

/**
 * Renders a skeleton UI that mirrors the changelog timeline layout.
 *
 * Two-column layout:
 * - Left: Timeline markers skeleton (hidden on mobile)
 * - Right: Changelog entry cards skeleton
 *
 * @returns The React element containing skeleton placeholders for the timeline view.
 *
 * @see ChangelogTimelineView
 * @see Skeleton
 * @see UI_CLASSES
 */
export function ChangelogContentSkeleton() {
  return (
    <div className="border-border bg-card/50 overflow-hidden rounded-lg border p-4 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] md:gap-8 lg:gap-12">
        {/* Timeline Column (Left) - Hidden on mobile */}
        <div className="relative hidden md:block">
          {/* Vertical timeline line skeleton */}
          <div className="bg-border/40 absolute top-0 bottom-0 left-3 w-px" aria-hidden="true" />

          {/* Timeline markers skeleton */}
          <div className="relative pl-8 space-y-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`timeline-marker-${index}`} className="space-y-2">
                <Skeleton size="sm" width="xs" />
                <Skeleton size="sm" width="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Column (Right) - Changelog entries skeleton */}
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`changelog-entry-${index}`}
              className="border-border/20 border-b pt-6 pb-12 last:border-b-0 last:pb-0 md:pt-8 md:pb-20"
            >
              <div className="space-y-4">
                {/* Entry header */}
                <div className="mb-3 flex items-center gap-2">
                  <Skeleton size="sm" width="xs" />
                  <Skeleton size="sm" width="sm" />
                </div>

                {/* Entry title */}
                <Skeleton size="lg" width="2/3" className="mb-2" />

                {/* Entry description */}
                <Skeleton size="sm" width="3xl" className="mb-4" />

                {/* Category badges */}
                <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mb-4`}>
                  <Skeleton size="sm" width="xs" rounded="full" />
                  <Skeleton size="sm" width="xs" rounded="full" />
                  <Skeleton size="sm" width="xs" rounded="full" />
                </div>

                {/* Content sections */}
                <div className="space-y-3">
                  <Skeleton size="md" width="3xl" />
                  <Skeleton size="sm" width="3xl" />
                  <Skeleton size="sm" width="2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
