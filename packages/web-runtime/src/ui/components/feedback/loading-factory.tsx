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
import { grid, stack, cluster, padding, marginBottom, gap, maxWidth, minHeight, display, alignItems, justify, flexWrap, flexGrow, paddingTop, paddingBottom, marginX, height, container, colSpan } from '../../../design-system/styles/layout.ts';
import { borderBottom } from '../../../design-system/styles/borders.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { size as textSize, muted } from '../../../design-system/styles/typography.ts';
import { bgColor, borderColor, textAlign } from '../../../design-system/styles/colors.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { border, borderWidth, borderTop } from '../../../design-system/styles/borders.ts';
import { animate } from '../../../design-system/styles/animation.ts';
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
    gridClass: `${grid.responsiveForm} ${gap.relaxed}`,
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
    <div className={`${container.default} ${paddingTop.loose} ${paddingBottom.loose}`}>
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Search bar (optional) */}
      {showSearch && (
        <div className={marginBottom.relaxed}>
          <Skeleton size="lg" width="3xl" className={height.search} />
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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Header */}
      <div className={`${borderColor['border/50']} ${borderBottom.default} ${bgColor['card/30']}`}>
        <div className={`${container.default} ${padding.yRelaxed}`}>
          {/* Back button */}
          <Skeleton size="sm" width="sm" className={marginBottom.comfortable} />

          {/* Title section */}
          <div
            className={`${marginBottom.comfortable} ${display.flex} ${alignItems.start} ${cluster.default}`}
          >
            <Skeleton size="xl" width="xs" className={flexGrow.shrink0} />
            <div className={`${flexGrow['1']} ${stack.comfortable}`}>
              <Skeleton size="xl" width="3/4" />
              <Skeleton size="md" width="3xl" />
            </div>
          </div>

          {/* Metadata badges */}
          <div className={`${display.flex} ${flexWrap.wrap} ${cluster.compact}`}>
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div
        className={`${container.default} ${padding.ySection}`}
      >
        <div className={grid.responsive13Gap8}>
          {/* Main content */}
          <div className={`${stack.loose} ${colSpan.lg2}`}>
            {/* Content card */}
            <div
              className={`${stack.comfortable} ${radius.lg} ${border.default} ${padding.comfortable}`}
            >
              <Skeleton size="md" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2/3" />
            </div>

            {/* Code block skeleton */}
            <div
              className={`${stack.comfortable} ${radius.lg} ${border.default} ${padding.comfortable}`}
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
              className={`${stack.comfortable} ${radius.lg} ${border.default} ${padding.comfortable}`}
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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      <div className={`${borderColor['border/50']} ${borderBottom.default} ${bgColor['card/30']}`}>
        <div className={`${container.default} ${padding.yRelaxed}`}>
          <Skeleton size="sm" width="sm" className={marginBottom.comfortable} />
          <div className={maxWidth['4xl']}>
            <div
              className={`${marginBottom.comfortable} ${display.flex} ${alignItems.start} ${cluster.default}`}
            >
              <Skeleton size="xl" width="xs" />
              <div className={`${flexGrow['1']} ${stack.comfortable}`}>
                <Skeleton size="xl" width="3/4" />
                <Skeleton size="md" width="3xl" />
              </div>
            </div>
            <div className={`${display.flex} ${flexWrap.wrap} ${cluster.compact}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={KEYS_5[i]} size="sm" width="xs" rounded="full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${container.default} ${padding.ySection}`}
      >
        <div className={grid.responsive13Gap8}>
          <div className={`${stack.loose} ${colSpan.lg2}`}>
            <div
              className={`${stack.comfortable} ${radius.lg} ${border.default} ${padding.comfortable}`}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={KEYS_12[i]} size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
              ))}
            </div>
          </div>
          <div className={stack.loose}>
            <div
              className={`${stack.comfortable} ${radius.lg} ${border.default} ${padding.comfortable}`}
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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero */}
      <section className={`${borderColor['border/50']} ${borderBottom.default}`}>
        <div className={`${container.default} ${padding.yHero} ${textAlign.center}`}>
          <Skeleton
            size="xl"
            width="3/4"
            className={`${marginX.auto} ${marginBottom.comfortable} ${height.hero}`}
          />
          <Skeleton size="md" width="2/3" className={marginX.auto} />
        </div>
      </section>

      {/* Search */}
      <div className={`${container.default} ${paddingTop.loose} ${paddingBottom.loose}`}>
        <div className={`${marginX.auto} ${maxWidth['4xl']}`}>
          <Skeleton size="lg" width="3xl" className={`${marginBottom.comfortable} ${height.inputLg}`} />
          {/* Stats */}
          <div className={`${display.flex} ${flexWrap.wrap} ${justify.center} ${cluster.default}`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={KEYS_7[i]} size="sm" width="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className={`${container.default} ${paddingBottom.hero}`}>
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={KEYS_3[sectionIndex]} className={marginBottom.section}>
            <div className={`${marginBottom.comfortable} ${display.flex} ${alignItems.center} ${justify.between}`}>
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
    <div className={`${container.default} ${paddingTop.loose} ${paddingBottom.loose}`}>
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
    sm: iconSize.sm,
    md: iconSize.lg,
    lg: iconSize.xl,
  };

  const borderClasses = {
    sm: borderWidth['2'],
    md: borderWidth['2'],
    lg: borderWidth['3'],
  };

  return (
    <div className={`${display.flex} ${alignItems.center} ${gap.compact} ${className}`}>
      <output
        className={`${sizeClasses[size]} ${borderClasses[size]} ${animate.spin} ${radius.full} ${borderColor.primary} ${borderTop.transparent}`}
        aria-label={message || 'Loading'}
        aria-live="polite"
      />
      {message && <span className={`${muted.default} ${textSize.sm}`}>{message}</span>}
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
      <div className={`${container.default} ${paddingTop.loose} ${paddingBottom.loose}`}>
        {/* Header */}
        <PageHeaderSkeleton />

        {/* Search bar (optional) */}
        {showSearch && (
          <div className={marginBottom.relaxed}>
            <Skeleton size="lg" width="3xl" className={height.search} />
          </div>
        )}

        {/* Filter bar (optional) */}
        {showFilters && (
          <div className={`${marginBottom.comfortable} ${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
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
