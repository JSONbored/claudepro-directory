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

import { UI_CLASSES } from '../../constants.ts';
import { getSkeletonKeys } from '../../../skeleton-keys.ts';
import {
  ConfigCardSkeleton,
  ContentListSkeleton,
  LoadingSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from './loading-skeleton.tsx';

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
    gridClass: UI_CLASSES.SPACE_Y_4,
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
    <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Search bar (optional) */}
      {showSearch && (
        <div className={UI_CLASSES.MARGIN_RELAXED}>
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
      <div className="border-border/50 border-b bg-card/30">
        <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}>
          {/* Back button */}
          <Skeleton size="sm" width="sm" className={UI_CLASSES.MARGIN_COMFORTABLE} />

          {/* Title section */}
          <div
            className={`${UI_CLASSES.MARGIN_COMFORTABLE} flex items-start ${UI_CLASSES.SPACE_COMFORTABLE}`}
          >
            <Skeleton size="xl" width="xs" className="shrink-0" />
            <div className={`flex-1 ${UI_CLASSES.SPACE_Y_4}`}>
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
            </div>
          </div>

          {/* Metadata badges */}
          <div className={`flex flex-wrap ${UI_CLASSES.SPACE_COMPACT}`}>
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div
        className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} ${UI_CLASSES.PADDING_Y_SECTION}`}
      >
        <div className={`grid grid-cols-1 ${UI_CLASSES.SPACE_LOOSE} lg:grid-cols-3`}>
          {/* Main content */}
          <div className={`${UI_CLASSES.SPACE_Y_6} lg:col-span-2`}>
            {/* Content card */}
            <div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
            >
              <Skeleton size="md" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2/3" />
            </div>

            {/* Code block skeleton */}
            <div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
            >
              <Skeleton size="sm" width="sm" />
              <div className={UI_CLASSES.SPACE_Y_2}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={KEYS_8[i]} size="sm" width={i % 3 === 0 ? '2/3' : '3xl'} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={UI_CLASSES.SPACE_Y_6}>
            <div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
            >
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
      <div className="border-border/50 border-b bg-card/30">
        <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}>
          <Skeleton size="sm" width="sm" className={UI_CLASSES.MARGIN_COMFORTABLE} />
          <div className="max-w-4xl">
            <div
              className={`${UI_CLASSES.MARGIN_COMFORTABLE} flex items-start ${UI_CLASSES.SPACE_COMFORTABLE}`}
            >
              <Skeleton size="xl" width="xs" />
              <div className={`flex-1 ${UI_CLASSES.SPACE_Y_4}`}>
                <Skeleton size="xl" width="3/4" />
                <Skeleton size="md" width="3xl" />
              </div>
            </div>
            <div className={`flex flex-wrap ${UI_CLASSES.SPACE_COMPACT}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={KEYS_5[i]} size="sm" width="xs" rounded="full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} ${UI_CLASSES.PADDING_Y_SECTION}`}
      >
        <div className={`grid grid-cols-1 ${UI_CLASSES.SPACE_LOOSE} lg:grid-cols-3`}>
          <div className={`${UI_CLASSES.SPACE_Y_6} lg:col-span-2`}>
            <div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={KEYS_12[i]} size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
              ))}
            </div>
          </div>
          <div className={UI_CLASSES.SPACE_Y_6}>
            <div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
            >
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
    <div className={UI_CLASSES.SPACE_Y_6}>
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
      <section className="border-border/50 border-b">
        <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-16 text-center`}>
          <Skeleton
            size="xl"
            width="3/4"
            className={`mx-auto ${UI_CLASSES.MARGIN_COMFORTABLE} h-16`}
          />
          <Skeleton size="md" width="2/3" className="mx-auto" />
        </div>
      </section>

      {/* Search */}
      <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}>
        <div className="mx-auto max-w-4xl">
          <Skeleton size="lg" width="3xl" className={`${UI_CLASSES.MARGIN_COMFORTABLE} h-14`} />
          {/* Stats */}
          <div className={`flex flex-wrap justify-center ${UI_CLASSES.SPACE_COMFORTABLE}`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={KEYS_7[i]} size="sm" width="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} pb-16`}>
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={KEYS_3[sectionIndex]} className={UI_CLASSES.MARGIN_SECTION}>
            <div className={`${UI_CLASSES.MARGIN_COMFORTABLE} flex items-center justify-between`}>
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
    <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}>
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
 * Inline spinner for loading states within components
 * Replaces custom animate-spin implementations
 *
 * @example
 * ```tsx
 * <InlineSpinner size="sm" message="Loading..." />
 * <InlineSpinner size="md" /> // No message
 * ```
 */
export function InlineSpinner({
  size = 'md',
  message,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <output
        className={`${sizeClasses[size]} ${borderClasses[size]} animate-spin rounded-full border-primary border-t-transparent`}
        aria-label={message || 'Loading'}
        aria-live="polite"
      />
      {message && <span className="text-muted-foreground text-sm">{message}</span>}
    </div>
  );
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
