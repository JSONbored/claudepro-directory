/**
 * Loading Component Factory - Database-First Configuration
 * Configuration-driven skeleton system from category_configs table.
 * Matches actual content structure for zero CLS.
 * - Progressive enhancement (static first, shimmer second)
 * - Tree-shakeable exports
 * - Reusable patterns
 *
 * @module lib/components/loading-factory
 */

import {
  ConfigCardSkeleton,
  ContentListSkeleton,
  LoadingSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from '@/src/components/primitives/loading-skeleton';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getSkeletonKeys } from '@/src/lib/utils/skeleton-keys';

// Pre-generate skeleton keys for common counts
const KEYS_9 = getSkeletonKeys(9);
const KEYS_8 = getSkeletonKeys(8);
const KEYS_7 = getSkeletonKeys(7);
const KEYS_6 = getSkeletonKeys(6);
const KEYS_5 = getSkeletonKeys(5);
const KEYS_12 = getSkeletonKeys(12);
const KEYS_3 = getSkeletonKeys(3);

/**
 * Skeleton configuration for different content types
 */
interface SkeletonConfig {
  /** Number of cards to show per row (desktop) */
  cardsPerRow: number;
  /** Total cards in initial skeleton */
  totalCards: number;
  /** Grid layout class */
  gridClass: string;
  /** Show stats in header */
  showStats?: boolean;
  /** Show filters */
  showFilters?: boolean;
}

const SKELETON_CONFIGS: Record<string, SkeletonConfig> = {
  // Standard 3-column grid (most categories)
  grid3: {
    cardsPerRow: 3,
    totalCards: 9,
    gridClass: UI_CLASSES.GRID_RESPONSIVE_3_TIGHT,
  },
  // Wide 2-column grid (guides, jobs)
  grid2: {
    cardsPerRow: 2,
    totalCards: 6,
    gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  },
  // List view (changelog, activity)
  list: {
    cardsPerRow: 1,
    totalCards: 8,
    gridClass: 'space-y-4',
  },
} as const;

/**
 * Category list page loading
 * Matches structure of /[category] pages
 */
export function CategoryLoading({
  variant = 'grid3',
  showSearch = true,
}: {
  variant?: keyof typeof SKELETON_CONFIGS;
  showSearch?: boolean;
} = {}) {
  const selectedVariant = variant || 'grid3';
  const config = SKELETON_CONFIGS[selectedVariant] as SkeletonConfig;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Search bar (optional) */}
      {showSearch && (
        <div className="mb-8">
          <Skeleton size="lg" width="3xl" className="h-12" />
        </div>
      )}

      {/* Content grid */}
      <div className={config.gridClass}>
        {Array.from({ length: config.totalCards }).map((_, i) => (
          <ConfigCardSkeleton key={KEYS_9[i]} />
        ))}
      </div>
    </div>
  );
}

/**
 * Detail page loading
 * Matches structure of /[category]/[slug] pages
 */
export function DetailPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Skeleton size="sm" width="sm" className="mb-6" />

          {/* Title section */}
          <div className="flex items-start gap-4 mb-6">
            <Skeleton size="xl" width="xs" className="shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2">
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content card */}
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton size="md" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2/3" />
            </div>

            {/* Code block skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton size="sm" width="sm" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={KEYS_8[i]} size="sm" width={i % 3 === 0 ? '2/3' : '3xl'} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton size="md" width="sm" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Guide detail page loading
 * Matches structure of guide pages (more text-heavy)
 */
export function GuideDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <Skeleton size="sm" width="sm" className="mb-6" />
          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <Skeleton size="xl" width="xs" />
              <div className="flex-1 space-y-4">
                <Skeleton size="xl" width="3/4" />
                <Skeleton size="md" width="3xl" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={KEYS_5[i]} size="sm" width="xs" rounded="full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={KEYS_12[i]} size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton size="md" width="sm" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={KEYS_3[i]} size="sm" width="3xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Search results loading
 * Matches structure of search page with filters
 */
export function SearchResultsLoading() {
  return (
    <div className="space-y-6">
      {/* Results count */}
      <Skeleton size="sm" width="sm" />

      {/* Results grid */}
      <div className={UI_CLASSES.GRID_RESPONSIVE_3_TIGHT}>
        {Array.from({ length: 9 }).map((_, i) => (
          <ConfigCardSkeleton key={KEYS_9[i]} />
        ))}
      </div>
    </div>
  );
}

/**
 * Homepage loading (complex with multiple sections)
 */
export function HomePageLoading() {
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
              <Skeleton key={KEYS_7[i]} size="sm" width="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="container mx-auto px-4 pb-16">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={KEYS_3[sectionIndex]} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <Skeleton size="lg" width="lg" />
              <Skeleton size="sm" width="sm" />
            </div>
            <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ConfigCardSkeleton key={KEYS_6[i]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Changelog list loading
 */
export function ChangelogListLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaderSkeleton />
      <ContentListSkeleton count={8} />
    </div>
  );
}

/**
 * Default fallback loading
 */
export function DefaultLoading() {
  return <LoadingSkeleton />;
}

/**
 * Export preset variants for common use cases
 */
export const LoadingPresets = {
  category: CategoryLoading,
  detail: DetailPageLoading,
  guide: GuideDetailLoading,
  search: SearchResultsLoading,
  home: HomePageLoading,
  changelog: ChangelogListLoading,
  default: DefaultLoading,
} as const;
