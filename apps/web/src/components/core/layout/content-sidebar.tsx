/**
 * ContentSidebar - Unified sidebar for content listing pages
 *
 * Provides a consistent sidebar experience across all content pages:
 * - JobsPromo card (always at top)
 * - RecentlyViewedSidebar (always visible, with empty state)
 * - Sticky positioning
 * - Consistent spacing and styling
 *
 * USAGE:
 * ```tsx
 * <ContentSidebar />
 * ```
 *
 * This component should be used on:
 * - Category listing pages (/[category])
 * - Search page (/search)
 * - Jobs listing page (/jobs) - replaces individual JobsPromo
 * - Submit page (/submit) - replaces individual JobsPromo
 *
 * NOT used on:
 * - Content detail pages (use detail-specific sidebar)
 * - Account pages (use account-specific sidebar)
 */

'use client';

import { Suspense } from 'react';

import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';

export function ContentSidebar() {
  return (
    <aside className="w-full space-y-6 lg:sticky lg:top-24 lg:h-fit">
      {/* JobsPromo - Always at top (now includes job alerts form) */}
      <JobsPromo />

      {/* RecentlyViewedSidebar - Always visible (with empty state) */}
      <Suspense fallback={<RecentlyViewedSidebarSkeleton />}>
        <RecentlyViewedSidebar />
      </Suspense>
    </aside>
  );
}

/**
 * Skeleton for RecentlyViewedSidebar while loading
 */
function RecentlyViewedSidebarSkeleton() {
  return (
    <div className="border-border/50 bg-card/50 hidden h-64 w-72 animate-pulse rounded-xl border p-4 xl:block" />
  );
}
