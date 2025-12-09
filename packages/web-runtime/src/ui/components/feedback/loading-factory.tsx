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
  LoadingSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from './loading-skeleton.tsx';
import { motion } from 'motion/react';

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
 * Matches the changelog page structure with header and timeline view
 * Uses the same structure as ChangelogContentSkeleton component
 */
export function ChangelogListLoading() {
  return (
    <div className="bg-background relative min-h-screen">
      {/* Header - EXACTLY matches changelog page */}
      <div className="border-border/50 border-b">
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center justify-between p-3">
            <Skeleton size="xl" width="lg" />
            {/* ThemeToggle placeholder */}
          </div>
        </div>
      </div>

      {/* Timeline skeleton - matches ChangelogContentSkeleton structure */}
      <div className="border-border bg-card/50 overflow-hidden rounded-lg border p-4 shadow-sm backdrop-blur-sm sm:p-6 mx-auto max-w-5xl my-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] md:gap-8 lg:gap-12">
          {/* Timeline Column (Left) - Hidden on mobile */}
          <div className="relative hidden md:block">
            <div className="bg-border/40 absolute top-0 bottom-0 left-3 w-px" aria-hidden="true" />
            <div className="relative pl-8 space-y-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`timeline-marker-${index}`} className="space-y-2">
                  <Skeleton size="sm" width="xs" />
                  <Skeleton size="sm" width="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Content Column (Right) */}
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`changelog-entry-${index}`}
                className="border-border/20 border-b pt-6 pb-12 last:border-b-0 last:pb-0 md:pt-8 md:pb-20"
              >
                <div className="space-y-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Skeleton size="sm" width="xs" />
                    <Skeleton size="sm" width="sm" />
                  </div>
                  <Skeleton size="lg" width="2/3" className="mb-2" />
                  <Skeleton size="sm" width="3xl" className="mb-4" />
                  <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mb-4`}>
                    <Skeleton size="sm" width="xs" rounded="full" />
                    <Skeleton size="sm" width="xs" rounded="full" />
                    <Skeleton size="sm" width="xs" rounded="full" />
                  </div>
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
    </div>
  );
}

/**
 * Submit page loading
 * Matches the submit page structure: hero, form (left), sidebar (right)
 */
export function SubmitPageLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Hero Header Skeleton */}
      <motion.div
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={
          !prefersReducedMotion
            ? {
                type: 'spring',
                stiffness: 400,
                damping: 25,
                mass: 0.5,
              }
            : {}
        }
        className="border-border/50 bg-card relative overflow-hidden rounded-2xl border p-8 mb-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <Skeleton size="sm" width="md" rounded="full" />
            <Skeleton size="xl" width="3xl" />
            <Skeleton size="sm" width="2xl" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton size="sm" width="sm" />
              <Skeleton size="sm" width="xs" />
              <Skeleton size="sm" width="md" />
            </div>
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <Skeleton size="xl" width="xl" rounded="lg" />
          </div>
        </div>
      </motion.div>

      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
        {/* Form Section (Left) */}
        <div className="w-full min-w-0">
          <div className="bg-muted/20 rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton size="lg" width="md" />
              <Skeleton size="sm" width="3xl" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`field-${i}`}
                  initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                  transition={
                    !prefersReducedMotion
                      ? {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          mass: 0.5,
                          delay: i * 0.05,
                        }
                      : {}
                  }
                  className="space-y-2"
                >
                  <Skeleton size="sm" width="xs" />
                  <Skeleton size="lg" width="3xl" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <motion.div
            initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
            transition={
              !prefersReducedMotion
                ? {
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    mass: 0.5,
                    delay: 0.2,
                  }
                : {}
            }
            className="rounded-lg border p-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-2">
              <Skeleton size="lg" width="3xl" rounded="md" />
              <Skeleton size="lg" width="3xl" rounded="md" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`sidebar-item-${i}`} className="space-y-2">
                  <Skeleton size="sm" width="3xl" />
                  <Skeleton size="xs" width="2xl" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Company profile page loading
 * Matches the company page structure: header, jobs list (left), stats sidebar (right)
 */
export function CompanyProfileLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="bg-background min-h-screen">
      {/* Header Skeleton */}
      <section className="border-border relative border-b">
        <motion.div
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={
            !prefersReducedMotion
              ? {
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  mass: 0.5,
                }
              : {}
          }
          className="container mx-auto px-4 py-12"
        >
          <div className="flex items-start gap-6">
            <Skeleton size="xl" width="xl" rounded="lg" />
            <div className="flex-1 space-y-3">
              <Skeleton size="xl" width="md" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2xl" />
              <div className="mt-4 flex gap-4">
                <Skeleton size="sm" width="xs" />
                <Skeleton size="sm" width="sm" />
                <Skeleton size="sm" width="xs" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Jobs List (Left) */}
          <div className="space-y-6">
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
              transition={
                !prefersReducedMotion
                  ? {
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      mass: 0.5,
                      delay: 0.1,
                    }
                  : {}
              }
              className="space-y-6"
            >
              <Skeleton size="lg" width="md" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={`job-${i}`}
                    initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                    transition={
                      !prefersReducedMotion
                        ? {
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                            mass: 0.5,
                            delay: 0.2 + i * 0.05,
                          }
                        : {}
                    }
                    className="rounded-lg border p-6 space-y-4"
                  >
                    <Skeleton size="md" width="md" />
                    <Skeleton size="sm" width="3xl" />
                    <Skeleton size="sm" width="2xl" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats Sidebar (Right) */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
              transition={
                !prefersReducedMotion
                  ? {
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      mass: 0.5,
                      delay: 0.3,
                    }
                  : {}
              }
              className="rounded-lg border p-6 space-y-4"
            >
              <div className="space-y-2">
                <Skeleton size="md" width="sm" />
                <Skeleton size="sm" width="md" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`stat-${i}`} className="flex items-center justify-between">
                    <Skeleton size="sm" width="xs" />
                    <Skeleton size="sm" width="xs" />
                  </div>
                ))}
              </div>
            </motion.div>
          </aside>
        </div>
      </section>
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
      <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}>
        {/* Header */}
        <PageHeaderSkeleton />

        {/* Search bar (optional) */}
        {showSearch && (
          <div className={UI_CLASSES.MARGIN_RELAXED}>
            <Skeleton size="lg" width="3xl" className="h-12" />
          </div>
        )}

        {/* Filter bar (optional) */}
        {showFilters && (
          <div className={`${UI_CLASSES.MARGIN_COMFORTABLE} flex flex-wrap gap-2`}>
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

// =============================================================================
// Form Page Loading Factory
// =============================================================================

/**
 * Configuration options for createFormPageLoading factory
 */
export interface FormPageLoadingConfig {
  /** Page title for skeleton header */
  title?: string;
  /** Number of form cards (1-3) */
  cardCount?: 1 | 2 | 3;
  /** Fields per card (array length should match cardCount) */
  fieldsPerCard?: number[];
  /** Show action buttons at bottom */
  showActions?: boolean;
  /** Custom card titles (array length should match cardCount) */
  cardTitles?: string[];
  /** Show back button in header */
  showBackButton?: boolean;
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized form page loading components.
 *
 * Use this for account form pages (edit/new company, edit/new job, edit/new collection).
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for a two-card form
 * export default createFormPageLoading({
 *   title: 'Edit Company',
 *   cardCount: 2,
 *   fieldsPerCard: [4, 3],
 *   showActions: true,
 *   cardTitles: ['Company Information', 'Company Details'],
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createFormPageLoading(config: FormPageLoadingConfig = {}) {
  const {
    title,
    cardCount = 1,
    fieldsPerCard = [8],
    showActions = true,
    cardTitles,
    showBackButton = false,
    maxWidth = '4xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  function FormPageLoading() {
    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}>
        {/* Header */}
        <div className="space-y-4">
          {showBackButton && <Skeleton size="sm" width="xs" rounded="md" />}
          {title ? (
            <div>
              <Skeleton size="xl" width="lg" />
              <Skeleton size="sm" width="2xl" className="mt-2" />
            </div>
          ) : (
            <>
              <Skeleton size="xl" width="lg" />
              <Skeleton size="sm" width="2xl" />
            </>
          )}
        </div>

        {/* Form Cards */}
        <form className="space-y-6">
          {Array.from({ length: cardCount }).map((_, cardIndex) => {
            const fieldCount = fieldsPerCard[cardIndex] ?? fieldsPerCard[0] ?? 4;
            const cardTitle = cardTitles?.[cardIndex];

            return (
              <div key={`card-${cardIndex}`} className="rounded-lg border">
                <div className="border-b p-6 space-y-2">
                  {cardTitle ? (
                    <>
                      <Skeleton size="md" width="md" />
                      <Skeleton size="sm" width="2xl" />
                    </>
                  ) : (
                    <>
                      <Skeleton size="md" width="md" />
                      <Skeleton size="sm" width="2xl" />
                    </>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {Array.from({ length: fieldCount }).map((_, fieldIndex) => (
                    <div key={`field-${fieldIndex}`} className="space-y-2">
                      <Skeleton size="sm" width="xs" />
                      <Skeleton size="lg" width="3xl" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-4">
              <Skeleton size="lg" width="lg" rounded="md" />
              <Skeleton size="lg" width="lg" rounded="md" />
            </div>
          )}
        </form>
      </div>
    );
  }

  FormPageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'FormPageLoading';

  return FormPageLoading;
}

// =============================================================================
// List Page Loading Factory
// =============================================================================

/**
 * Configuration options for createListPageLoading factory
 */
export interface ListPageLoadingConfig {
  /** Page title */
  title?: string;
  /** Grid variant: 'grid' | 'list' | 'cards' */
  variant?: 'grid' | 'list' | 'cards';
  /** Number of items to show */
  itemCount?: number;
  /** Show search bar */
  showSearch?: boolean;
  /** Show action button in header */
  showActionButton?: boolean;
  /** Columns for grid (1-4) */
  columns?: 1 | 2 | 3 | 4;
  /** Show tabs (for library page) */
  showTabs?: boolean;
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized list page loading components.
 *
 * Use this for account list pages (companies, jobs, library, sponsorships, submissions).
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for a single-column card list
 * export default createListPageLoading({
 *   title: 'My Companies',
 *   variant: 'cards',
 *   itemCount: 6,
 *   showActionButton: true,
 *   columns: 1,
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createListPageLoading(config: ListPageLoadingConfig = {}) {
  const {
    title,
    variant = 'cards',
    itemCount = 6,
    showSearch = false,
    showActionButton = false,
    columns = 1,
    showTabs = false,
    maxWidth = '6xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  const gridClasses = {
    1: 'grid grid-cols-1 gap-4',
    2: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    3: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
  };

  function ListPageLoading() {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}>
        {/* Header */}
        <motion.div
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={
            !prefersReducedMotion
              ? {
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  mass: 0.5,
                }
              : {}
          }
          className="flex items-center justify-between"
        >
          {title ? (
            <div>
              <Skeleton size="xl" width="lg" />
              <Skeleton size="sm" width="md" className="mt-2" />
            </div>
          ) : (
            <Skeleton size="xl" width="lg" />
          )}
          {showActionButton && <Skeleton size="lg" width="lg" rounded="md" />}
        </motion.div>

        {/* Tabs (optional) */}
        {showTabs && (
          <div className="border-b">
            <div className="flex gap-4">
              <Skeleton size="md" width="md" />
              <Skeleton size="md" width="md" />
            </div>
          </div>
        )}

        {/* Search Bar (optional) */}
        {showSearch && (
          <div>
            <Skeleton size="lg" width="3xl" className="h-12" />
          </div>
        )}

        {/* Content Grid/List */}
        <div className={columns === 1 ? 'grid gap-4' : gridClasses[columns]}>
          {Array.from({ length: itemCount }).map((_, i) => {
            const prefersReducedMotion =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (variant === 'list') {
              return (
                <motion.div
                  key={`item-${i}`}
                  initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                  transition={
                    !prefersReducedMotion
                      ? {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          mass: 0.5,
                          delay: i * 0.05,
                        }
                      : {}
                  }
                  className="rounded-lg border p-4 space-y-3"
                >
                  <Skeleton size="md" width="md" />
                  <Skeleton size="sm" width="3xl" />
                  <Skeleton size="sm" width="2xl" />
                  <div className="flex items-center gap-2">
                    <Skeleton size="xs" width="xs" rounded="full" />
                    <Skeleton size="xs" width="xs" rounded="full" />
                  </div>
                </motion.div>
              );
            }

            if (variant === 'cards') {
              return (
                <motion.div
                  key={`item-${i}`}
                  initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                  transition={
                    !prefersReducedMotion
                      ? {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          mass: 0.5,
                          delay: i * 0.05,
                        }
                      : {}
                  }
                  className="rounded-lg border"
                >
                  <div className="border-b p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start gap-4">
                        {/* Logo/Icon skeleton - matches 64x64 logo */}
                        <Skeleton size="lg" width="lg" rounded="lg" className="h-16 w-16 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton size="md" width="md" />
                          <Skeleton size="sm" width="sm" />
                        </div>
                      </div>
                      {/* Action buttons skeleton */}
                      <div className="flex gap-2 shrink-0">
                        <Skeleton size="sm" width="xs" rounded="md" />
                        <Skeleton size="sm" width="xs" rounded="md" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton size="sm" width="xs" />
                      <Skeleton size="sm" width="xs" />
                      <Skeleton size="sm" width="xs" />
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Default: grid variant (content cards)
            return (
              <motion.div
                key={`item-${i}`}
                initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={
                  !prefersReducedMotion
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                        delay: i * 0.05,
                      }
                    : {}
                }
                className="rounded-lg border p-4 space-y-3"
              >
                <Skeleton size="md" width="md" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2xl" />
                <div className="flex items-center gap-2">
                  <Skeleton size="xs" width="xs" rounded="full" />
                  <Skeleton size="xs" width="xs" rounded="full" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  ListPageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'ListPageLoading';

  return ListPageLoading;
}

// =============================================================================
// Detail Page Loading Factory
// =============================================================================

/**
 * Configuration options for createDetailPageLoading factory
 */
export interface DetailPageLoadingConfig {
  /** Show back button */
  showBackButton?: boolean;
  /** Show header badges */
  showBadges?: boolean;
  /** Number of content cards */
  cardCount?: 1 | 2 | 3;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Show stats section */
  showStats?: boolean;
  /** Stats count */
  statsCount?: number;
  /** Show chart area */
  showChart?: boolean;
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized detail page loading components.
 *
 * Use this for account detail/analytics pages (job analytics, sponsorship analytics, collection detail).
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for an analytics page
 * export default createDetailPageLoading({
 *   showBackButton: true,
 *   showBadges: true,
 *   cardCount: 1,
 *   showSidebar: false,
 *   showStats: true,
 *   statsCount: 4,
 *   showChart: true,
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createDetailPageLoading(config: DetailPageLoadingConfig = {}) {
  const {
    showBackButton = false,
    showBadges = false,
    cardCount = 1,
    showStats = false,
    statsCount = 4,
    showChart = false,
    maxWidth = '6xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  function DetailPageLoading() {
    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}>
        {/* Header */}
        <div className="space-y-2">
          {showBackButton && <Skeleton size="sm" width="xs" rounded="md" />}
          <div className="flex items-center gap-2">
            {showBadges && <Skeleton size="sm" width="xs" rounded="full" />}
            <Skeleton size="xl" width="lg" />
          </div>
          <Skeleton size="sm" width="2xl" />
        </div>

        {/* Stats Section (optional) */}
        {showStats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {Array.from({ length: statsCount }).map((_, i) => (
              <div key={`stat-${i}`} className="rounded-lg border p-6 space-y-2">
                <Skeleton size="sm" width="xs" />
                <Skeleton size="lg" width="sm" />
              </div>
            ))}
          </div>
        )}

        {/* Content Cards */}
        {Array.from({ length: cardCount }).map((_, cardIndex) => (
          <div key={`card-${cardIndex}`} className="rounded-lg border">
            <div className="border-b p-6 space-y-2">
              <Skeleton size="md" width="md" />
              <Skeleton size="sm" width="2xl" />
            </div>
            <div className="p-6">
              {cardIndex === 0 && showStats ? (
                // First card might have stats grid
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`detail-${i}`} className="space-y-1">
                      <Skeleton size="sm" width="xs" />
                      <Skeleton size="sm" width="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                // Regular card content
                <div className="space-y-4">
                  <Skeleton size="sm" width="3xl" />
                  <Skeleton size="sm" width="3xl" />
                  <Skeleton size="sm" width="2xl" />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Chart Area (optional) */}
        {showChart && (
          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton size="md" width="md" />
            <Skeleton size="xl" width="3xl" className="h-64" />
          </div>
        )}
      </div>
    );
  }

  DetailPageLoading.displayName = 'DetailPageLoading';

  return DetailPageLoading;
}

// =============================================================================
// Static Page Loading Factory
// =============================================================================

/**
 * Configuration options for createStaticPageLoading factory
 */
export interface StaticPageLoadingConfig {
  /** Page title */
  title?: string;
  /** Show centered header */
  centered?: boolean;
  /** Number of content sections */
  sections?: number;
  /** Show cards grid */
  showCards?: boolean;
  /** Cards per row */
  cardsPerRow?: 2 | 3 | 4;
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized static page loading components.
 *
 * Use this for static content pages (privacy, cookies, terms, accessibility, help).
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for a privacy policy page
 * export default createStaticPageLoading({
 *   title: 'Privacy Policy',
 *   centered: true,
 *   sections: 8,
 *   showCards: false,
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createStaticPageLoading(config: StaticPageLoadingConfig = {}) {
  const {
    title,
    centered = true,
    sections = 6,
    showCards = false,
    cardsPerRow = 3,
    maxWidth = '4xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  const gridClasses = {
    2: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    3: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
  };

  function StaticPageLoading() {
    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 sm:py-12`}>
        {/* Header */}
        <div className={centered ? 'text-center mb-8' : 'mb-8'}>
          {title ? (
            <>
              <Skeleton size="xl" width="lg" className={centered ? 'mx-auto' : ''} />
              <Skeleton size="sm" width="md" className={`mt-2 ${centered ? 'mx-auto' : ''}`} />
            </>
          ) : (
            <>
              <Skeleton size="xl" width="lg" className={centered ? 'mx-auto' : ''} />
              <Skeleton size="sm" width="md" className={`mt-2 ${centered ? 'mx-auto' : ''}`} />
            </>
          )}
        </div>

        {/* Cards Grid (optional) */}
        {showCards && (
          <div className={`${gridClasses[cardsPerRow]} mb-8`}>
            {Array.from({ length: cardsPerRow * 2 }).map((_, i) => (
              <div key={`card-${i}`} className="rounded-lg border p-6 space-y-3">
                <Skeleton size="md" width="md" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2xl" />
              </div>
            ))}
          </div>
        )}

        {/* Content Sections */}
        <div className="prose prose-invert max-w-none space-y-8">
          {Array.from({ length: sections }).map((_, i) => (
            <div key={`section-${i}`} className="space-y-4">
              <Skeleton size="lg" width="md" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  StaticPageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'StaticPageLoading';

  return StaticPageLoading;
}

// =============================================================================
// Preset Exports
// =============================================================================

/**
 * Preset form page loading components
 */
export const FormPageLoadingPresets = {
  twoCardForm: createFormPageLoading({
    cardCount: 2,
    fieldsPerCard: [4, 3],
    showActions: true,
    cardTitles: ['Information', 'Details'],
  }),
  singleCardForm: createFormPageLoading({
    cardCount: 1,
    fieldsPerCard: [8],
    showActions: true,
  }),
  singleCardFormWithBack: createFormPageLoading({
    cardCount: 1,
    fieldsPerCard: [4],
    showActions: true,
    showBackButton: true,
  }),
} as const;

/**
 * Preset list page loading components
 */
export const ListPageLoadingPresets = {
  singleColumnCards: createListPageLoading({
    variant: 'cards',
    itemCount: 6,
    showActionButton: true,
    columns: 1,
  }),
  threeColumnGrid: createListPageLoading({
    variant: 'grid',
    itemCount: 6,
    showActionButton: false,
    columns: 3,
  }),
  withTabs: createListPageLoading({
    variant: 'grid',
    itemCount: 6,
    showActionButton: true,
    columns: 3,
    showTabs: true,
  }),
} as const;

/**
 * Preset detail page loading components
 */
export const DetailPageLoadingPresets = {
  analytics: createDetailPageLoading({
    showBackButton: true,
    showBadges: true,
    cardCount: 1,
    showSidebar: false,
    showStats: true,
    statsCount: 4,
    showChart: true,
  }),
  simple: createDetailPageLoading({
    showBackButton: true,
    showBadges: false,
    cardCount: 1,
    showSidebar: false,
  }),
} as const;

/**
 * Preset static page loading components
 */
export const StaticPageLoadingPresets = {
  privacy: createStaticPageLoading({
    title: 'Privacy Policy',
    centered: true,
    sections: 8,
    showCards: false,
  }),
  terms: createStaticPageLoading({
    title: 'Terms of Service',
    centered: true,
    sections: 6,
    showCards: false,
  }),
  cookies: createStaticPageLoading({
    title: 'Cookie Policy',
    centered: true,
    sections: 6,
    showCards: false,
  }),
} as const;

// =============================================================================
// Dashboard Page Loading Factory
// =============================================================================

/**
 * Configuration options for createDashboardPageLoading factory
 */
export interface DashboardPageLoadingConfig {
  /** Page title */
  title?: string;
  /** Number of stats cards */
  statsCount?: number;
  /** Stats grid columns (2-4) */
  statsColumns?: 2 | 3 | 4;
  /** Show quick actions section */
  showQuickActions?: boolean;
  /** Number of quick action buttons */
  quickActionsCount?: number;
  /** Show content cards section */
  showContentCards?: boolean;
  /** Number of content cards */
  contentCardCount?: number;
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized dashboard page loading components.
 *
 * Use this for account dashboard and activity pages with stats.
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for a dashboard
 * export default createDashboardPageLoading({
 *   title: 'Dashboard',
 *   statsCount: 3,
 *   statsColumns: 3,
 *   showQuickActions: true,
 *   quickActionsCount: 3,
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createDashboardPageLoading(config: DashboardPageLoadingConfig = {}) {
  const {
    title,
    statsCount = 3,
    statsColumns = 3,
    showQuickActions = false,
    quickActionsCount = 3,
    showContentCards = false,
    contentCardCount = 1,
    maxWidth = '6xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  const statsGridClasses = {
    2: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    3: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
  };

  function DashboardPageLoading() {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}>
        {/* Header */}
        {title && (
          <div className="space-y-2">
            <Skeleton size="xl" width="lg" />
            <Skeleton size="sm" width="2xl" />
          </div>
        )}

        {/* Stats Grid */}
        {statsCount > 0 && (
          <div className={statsGridClasses[statsColumns]}>
            {Array.from({ length: statsCount }).map((_, i) => (
              <motion.div
                key={`stat-${i}`}
                initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={
                  !prefersReducedMotion
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                        delay: i * 0.05,
                      }
                    : {}
                }
              >
                <div className="rounded-lg border">
                  <div className="border-b p-6">
                    <Skeleton size="sm" width="xs" />
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton size="md" width="md" rounded="full" />
                      <Skeleton size="xl" width="sm" />
                    </div>
                    <Skeleton size="xs" width="xs" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions Card */}
        {showQuickActions && (
          <motion.div
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={
              !prefersReducedMotion
                ? {
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    mass: 0.5,
                    delay: 0.2,
                  }
                : {}
            }
            className="rounded-lg border"
          >
            <div className="border-b p-6 space-y-2">
              <Skeleton size="md" width="md" />
              <Skeleton size="sm" width="2xl" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: quickActionsCount }).map((_, i) => (
                <motion.div
                  key={`action-${i}`}
                  initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                  transition={
                    !prefersReducedMotion
                      ? {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          mass: 0.5,
                          delay: 0.3 + i * 0.05,
                        }
                      : {}
                  }
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-2">
                    <Skeleton size="md" width="md" />
                    <Skeleton size="sm" width="2xl" />
                  </div>
                  <Skeleton size="sm" width="xs" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content Cards */}
        {showContentCards && (
          <div className="space-y-4">
            {Array.from({ length: contentCardCount }).map((_, i) => (
              <motion.div
                key={`card-${i}`}
                initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={
                  !prefersReducedMotion
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                        delay: 0.3 + i * 0.1,
                      }
                    : {}
                }
              >
                <div className="rounded-lg border">
                  <div className="border-b p-6 space-y-2">
                    <Skeleton size="md" width="md" />
                    <Skeleton size="sm" width="2xl" />
                  </div>
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={`item-${j}`} className="flex items-start gap-3">
                        <Skeleton size="sm" width="xs" rounded="full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton size="sm" width="md" />
                          <Skeleton size="sm" width="3xl" />
                          <Skeleton size="sm" width="2xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  DashboardPageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'DashboardPageLoading';

  return DashboardPageLoading;
}

// =============================================================================
// Profile Page Loading Factory
// =============================================================================

/**
 * Configuration options for createProfilePageLoading factory
 */
export interface ProfilePageLoadingConfig {
  /** Page title */
  title?: string;
  /** Show avatar skeleton */
  showAvatar?: boolean;
  /** Number of form fields */
  formFieldsCount?: number;
  /** Show cards section */
  showCards?: boolean;
  /** Number of cards (1-3) */
  cardCount?: 1 | 2 | 3;
  /** Custom card titles (array length should match cardCount) */
  cardTitles?: string[];
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized profile/settings page loading components.
 *
 * Use this for account settings, profile pages, MFA settings, connected accounts.
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for settings
 * export default createProfilePageLoading({
 *   title: 'Settings',
 *   showAvatar: true,
 *   formFieldsCount: 4,
 *   showCards: true,
 *   cardCount: 1,
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createProfilePageLoading(config: ProfilePageLoadingConfig = {}) {
  const {
    title,
    showAvatar = false,
    formFieldsCount = 4,
    showCards = false,
    cardCount = 1,
    cardTitles,
    maxWidth = '6xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  function ProfilePageLoading() {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}>
        {/* Header */}
        <div className="space-y-4">
          {title && (
            <>
              <Skeleton size="xl" width="lg" />
              <Skeleton size="sm" width="2xl" />
            </>
          )}

          {/* Avatar (optional) */}
          {showAvatar && (
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, scale: 0.9 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
              transition={
                !prefersReducedMotion
                  ? {
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      mass: 0.5,
                    }
                  : {}
              }
              className="flex items-center gap-4"
            >
              <Skeleton size="xl" width="xl" rounded="full" />
              <div className="space-y-2">
                <Skeleton size="md" width="md" />
                <Skeleton size="sm" width="sm" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Form Fields (optional) */}
        {formFieldsCount > 0 && (
          <div className="space-y-4">
            {Array.from({ length: formFieldsCount }).map((_, i) => (
              <motion.div
                key={`field-${i}`}
                initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                transition={
                  !prefersReducedMotion
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                        delay: i * 0.05,
                      }
                    : {}
                }
                className="space-y-2"
              >
                <Skeleton size="sm" width="xs" />
                <Skeleton size="lg" width="3xl" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Cards Section */}
        {showCards && (
          <div className="space-y-6">
            {Array.from({ length: cardCount }).map((_, cardIndex) => {
              const cardTitle = cardTitles?.[cardIndex];

              return (
                <motion.div
                  key={`card-${cardIndex}`}
                  initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                  transition={
                    !prefersReducedMotion
                      ? {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          mass: 0.5,
                          delay: 0.2 + cardIndex * 0.1,
                        }
                      : {}
                  }
                  className="rounded-lg border"
                >
                  <div className="border-b p-6 space-y-2">
                    {cardTitle ? (
                      <>
                        <Skeleton size="md" width="md" />
                        <Skeleton size="sm" width="2xl" />
                      </>
                    ) : (
                      <>
                        <Skeleton size="md" width="md" />
                        <Skeleton size="sm" width="2xl" />
                      </>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`item-${i}`} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <Skeleton size="lg" width="lg" rounded="full" />
                          <div className="space-y-2">
                            <Skeleton size="md" width="md" />
                            <Skeleton size="sm" width="sm" />
                          </div>
                        </div>
                        <Skeleton size="sm" width="xs" rounded="md" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  ProfilePageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'ProfilePageLoading';

  return ProfilePageLoading;
}

// =============================================================================
// Contact Page Loading Factory
// =============================================================================

/**
 * Configuration options for createContactPageLoading factory
 */
export interface ContactPageLoadingConfig {
  /** Page title */
  title?: string;
  /** Show centered header */
  centered?: boolean;
  /** Number of cards */
  cardsCount?: number;
  /** Cards per row (2-4) */
  cardsPerRow?: 2 | 3 | 4;
  /** Show prose sections */
  showProseSections?: boolean;
  /** Number of prose sections */
  proseSectionsCount?: number;
  /** Container max width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
}

/**
 * Factory function to create customized contact page loading components.
 *
 * Use this for contact pages with cards grid and prose sections.
 *
 * @example
 * ```tsx
 * // In loading.tsx - Creates a loading component for contact page
 * export default createContactPageLoading({
 *   title: 'Contact Us',
 *   centered: true,
 *   cardsCount: 4,
 *   cardsPerRow: 2,
 *   showProseSections: true,
 *   proseSectionsCount: 3,
 * });
 * ```
 *
 * @param config - Configuration for the loading component
 * @returns A React component for loading state
 */
export function createContactPageLoading(config: ContactPageLoadingConfig = {}) {
  const {
    title,
    centered = true,
    cardsCount = 4,
    cardsPerRow = 2,
    showProseSections = false,
    proseSectionsCount = 3,
    maxWidth = '4xl',
  } = config;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  const gridClasses = {
    2: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    3: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
  };

  function ContactPageLoading() {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <div className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-8`}>
        {/* Header */}
        <div className={centered ? 'text-center space-y-4' : 'space-y-4'}>
          {title && (
            <>
              <Skeleton size="xl" width="lg" className={centered ? 'mx-auto' : ''} />
              <Skeleton size="sm" width="2xl" className={centered ? 'mx-auto' : ''} />
            </>
          )}
        </div>

        {/* Cards Grid */}
        {cardsCount > 0 && (
          <div className={gridClasses[cardsPerRow]}>
            {Array.from({ length: cardsCount }).map((_, i) => (
              <motion.div
                key={`card-${i}`}
                initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={
                  !prefersReducedMotion
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                        delay: i * 0.05,
                      }
                    : {}
                }
                className="rounded-lg border p-6 space-y-3"
              >
                <Skeleton size="md" width="md" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2xl" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Prose Sections */}
        {showProseSections && (
          <div className="prose prose-invert max-w-none space-y-8">
            {Array.from({ length: proseSectionsCount }).map((_, i) => (
              <motion.div
                key={`section-${i}`}
                initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={
                  !prefersReducedMotion
                    ? {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.5,
                        delay: 0.3 + i * 0.1,
                      }
                    : {}
                }
                className="space-y-4"
              >
                <Skeleton size="lg" width="md" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2xl" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  ContactPageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'ContactPageLoading';

  return ContactPageLoading;
}
