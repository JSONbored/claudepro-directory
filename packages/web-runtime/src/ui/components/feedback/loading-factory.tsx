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

// Design System imports
import { grid, stack, cluster, padding, marginBottom } from '../../../design-system/styles/layout.ts';
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
    gridClass: grid.contentTight,
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
    gridClass: stack.comfortable,
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
    <div className={`container mx-auto ${padding.xDefault} py-8`}>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Search bar (optional) */}
      {showSearch && (
        <div className={marginBottom.relaxed}>
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
        <div className={`container mx-auto ${padding.xDefault} py-8`}>
          {/* Back button */}
          <Skeleton size="sm" width="sm" className={marginBottom.comfortable} />

          {/* Title section */}
          <div
            className={`${marginBottom.comfortable} flex items-start ${cluster.default}`}
          >
            <Skeleton size="xl" width="xs" className="shrink-0" />
            <div className={`flex-1 ${stack.comfortable}`}>
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
            </div>
          </div>

          {/* Metadata badges */}
          <div className={`flex flex-wrap ${cluster.compact}`}>
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div
        className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}
      >
        <div className={`grid grid-cols-1 ${cluster.loose} lg:grid-cols-3`}>
          {/* Main content */}
          <div className={`${stack.loose} lg:col-span-2`}>
            {/* Content card */}
            <div
              className={`${stack.comfortable} rounded-lg border ${padding.comfortable}`}
            >
              <Skeleton size="md" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2/3" />
            </div>

            {/* Code block skeleton */}
            <div
              className={`${stack.comfortable} rounded-lg border ${padding.comfortable}`}
            >
              <Skeleton size="sm" width="sm" />
              <div className={stack.tight}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={KEYS_8[i]} size="sm" width={i % 3 === 0 ? '2/3' : '3xl'} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={stack.loose}>
            <div
              className={`${stack.comfortable} rounded-lg border ${padding.comfortable}`}
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
        <div className={`container mx-auto ${padding.xDefault} py-8`}>
          <Skeleton size="sm" width="sm" className={marginBottom.comfortable} />
          <div className="max-w-4xl">
            <div
              className={`${marginBottom.comfortable} flex items-start ${cluster.default}`}
            >
              <Skeleton size="xl" width="xs" />
              <div className={`flex-1 ${stack.comfortable}`}>
                <Skeleton size="xl" width="3/4" />
                <Skeleton size="md" width="3xl" />
              </div>
            </div>
            <div className={`flex flex-wrap ${cluster.compact}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={KEYS_5[i]} size="sm" width="xs" rounded="full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}
      >
        <div className={`grid grid-cols-1 ${cluster.loose} lg:grid-cols-3`}>
          <div className={`${stack.loose} lg:col-span-2`}>
            <div
              className={`${stack.comfortable} rounded-lg border ${padding.comfortable}`}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={KEYS_12[i]} size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
              ))}
            </div>
          </div>
          <div className={stack.loose}>
            <div
              className={`${stack.comfortable} rounded-lg border ${padding.comfortable}`}
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
    <div className={stack.loose}>
      {/* Results count */}
      <Skeleton size="sm" width="sm" />

      {/* Results grid */}
      <div className={grid.contentTight}>
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
        <div className={`container mx-auto ${padding.xDefault} py-16 text-center`}>
          <Skeleton
            size="xl"
            width="3/4"
            className={`mx-auto ${marginBottom.comfortable} h-16`}
          />
          <Skeleton size="md" width="2/3" className="mx-auto" />
        </div>
      </section>

      {/* Search */}
      <div className={`container mx-auto ${padding.xDefault} py-8`}>
        <div className="mx-auto max-w-4xl">
          <Skeleton size="lg" width="3xl" className={`${marginBottom.comfortable} h-14`} />
          {/* Stats */}
          <div className={`flex flex-wrap justify-center ${cluster.default}`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={KEYS_7[i]} size="sm" width="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className={`container mx-auto ${padding.xDefault} pb-16`}>
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={KEYS_3[sectionIndex]} className={marginBottom.section}>
            <div className={`${marginBottom.comfortable} flex items-center justify-between`}>
              <Skeleton size="lg" width="lg" />
              <Skeleton size="sm" width="sm" />
            </div>
            <div className={grid.responsive3}>
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
    <div className={`container mx-auto ${padding.xDefault} py-8`}>
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

// =============================================================================
// Loading Factory - Create customized loading components
// =============================================================================

/**
 * Configuration options for createCategoryLoading factory
 */
export interface CategoryLoadingConfig {
  /** Category name for display name (used in React DevTools) */
  category?: string;
  /** Grid variant: 'grid3' (3-col), 'grid2' (2-col), 'list' */
  variant?: keyof typeof SKELETON_CONFIGS;
  /** Whether to show search bar skeleton */
  showSearch?: boolean;
  /** Whether to show filter bar skeleton */
  showFilters?: boolean;
  /** Total number of skeleton cards to display */
  totalCards?: number;
}

/**
 * Factory function to create customized CategoryLoading components.
 *
 * Use this when you need a pre-configured loading component for specific categories
 * with consistent settings that can be used as a default export in loading.tsx files.
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component with filters for jobs
 * export default createCategoryLoading({
 *   category: 'jobs',
 *   variant: 'grid2',
 *   showFilters: true,
 *   totalCards: 6,
 * });
 *
 * // Simple re-export for standard category pages
 * export { CategoryLoading as default } from '@heyclaude/web-runtime/ui';
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createCategoryLoading(config: CategoryLoadingConfig = {}) {
  const {
    category = 'category',
    variant = 'grid3',
    showSearch = true,
    showFilters = false,
    totalCards,
  } = config;

  const selectedConfig = SKELETON_CONFIGS[variant] as SkeletonConfig;
  const cardCount = totalCards ?? selectedConfig.totalCards;
  const keys = getSkeletonKeys(cardCount);

  function CustomCategoryLoading() {
    return (
      <div className={`container mx-auto ${padding.xDefault} py-8`}>
        {/* Header */}
        <PageHeaderSkeleton />

        {/* Search bar (optional) */}
        {showSearch && (
          <div className={marginBottom.relaxed}>
            <Skeleton size="lg" width="3xl" className="h-12" />
          </div>
        )}

        {/* Filter bar (optional) */}
        {showFilters && (
          <div className={`${marginBottom.comfortable} flex flex-wrap gap-2`}>
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="sm" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="sm" rounded="full" />
          </div>
        )}

        {/* Content grid */}
        <div className={selectedConfig.gridClass}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <ConfigCardSkeleton key={keys[i]} />
          ))}
        </div>
      </div>
    );
  }

  // Set display name for React DevTools
  CustomCategoryLoading.displayName = `${category.charAt(0).toUpperCase() + category.slice(1)}Loading`;

  return CustomCategoryLoading;
}
