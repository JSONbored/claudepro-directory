'use client';

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
import { SPRING, STAGGER } from '../../../design-system/index.ts';
import { getSkeletonKeys } from '../../../skeleton-keys.ts';
import {
  ConfigCardSkeleton,
  LoadingSkeleton,
  PageHeaderSkeleton,
  Skeleton,
} from './loading-skeleton.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/card.tsx';
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
 * Perfectly matches structure of /[category] pages:
 * - CategoryHeroShell (icon, title, description, badges, submit button)
 * - CategoryPageContent (ContentSearchClient + ContentSidebar)
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
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className="bg-background min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* CategoryHeroShell - Hero section with icon, title, description, badges, submit button */}
      <motion.section
        className="border-border border-b backdrop-blur-sm"
        style={{ backgroundColor: 'color-mix(in srgb, var(--code-bg) 30%, transparent)' }}
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            {/* Icon */}
            <motion.div
              className="mb-6 flex justify-center"
              initial={!prefersReducedMotion ? { scale: 0, rotate: -180 } : false}
              animate={!prefersReducedMotion ? { scale: 1, rotate: 0 } : {}}
              transition={{ ...SPRING.bouncy, delay: 0.15 }}
            >
              <div className="bg-accent/10 rounded-full p-3" aria-hidden="true">
                <Skeleton size="xl" width="xl" rounded="full" className="h-12 w-12" />
              </div>
            </motion.div>

            {/* Title with ExploreDropdown */}
            <motion.div
              className="flex items-center justify-center gap-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.smooth, delay: 0.2 }}
            >
              <Skeleton size="xl" width="2xl" className="h-14" />
              <Skeleton size="sm" width="xs" rounded="md" className="hidden h-8 sm:block" />
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-muted-foreground mt-4 text-lg sm:text-xl"
              initial={!prefersReducedMotion ? { opacity: 0 } : false}
              animate={!prefersReducedMotion ? { opacity: 1 } : {}}
              transition={{ ...SPRING.smooth, delay: 0.25 }}
            >
              <Skeleton size="md" width="3xl" className="mx-auto h-6" />
            </motion.p>

            {/* Badges (streamed in Suspense) */}
            <motion.div
              className="mb-8 flex list-none flex-wrap justify-center gap-2"
              initial={!prefersReducedMotion ? { opacity: 0 } : false}
              animate={!prefersReducedMotion ? { opacity: 1 } : {}}
              transition={{ ...SPRING.smooth, delay: 0.3 }}
            >
              <Skeleton size="sm" width="xs" rounded="full" className="h-8 w-24" />
              <Skeleton size="sm" width="xs" rounded="full" className="h-8 w-32" />
              <Skeleton size="sm" width="xs" rounded="full" className="h-8 w-28" />
            </motion.div>

            {/* Submit button + ExploreDropdown (mobile) */}
            <motion.div
              className="flex items-center justify-center gap-2"
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.smooth, delay: 0.35 }}
            >
              <Skeleton size="sm" width="lg" rounded="md" className="h-9" />
              <Skeleton size="sm" width="xs" rounded="md" className="h-8 sm:hidden" />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CategoryPageContent - ContentSearchClient + ContentSidebar */}
      <motion.section
        className="container mx-auto px-4 py-12"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.4 }}
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          {/* Main Content - ContentSearchClient */}
          <motion.div
            className="min-w-0"
            initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.45 }}
          >
            <div className="space-y-8">
              {/* UnifiedSearch - Search bar */}
              {showSearch && (
                <Skeleton size="xl" width="3xl" className="h-14" />
              )}

              {/* Filters/Quick tags */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                    transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
                  >
                    <Skeleton size="sm" width="xs" rounded="full" className="h-8" />
                  </motion.div>
                ))}
              </div>

              {/* Results grid */}
              <div className={config.gridClass}>
                {Array.from({ length: config.totalCards }).map((_, i) => (
                  <motion.div
                    key={KEYS_9[i]}
                    initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                    transition={{ ...SPRING.loading, delay: 0.6 + i * STAGGER.micro }}
                  >
                    <ConfigCardSkeleton />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar - ContentSidebar (JobsPromo + RecentlyViewedSidebar) */}
          <motion.aside
            className="w-full space-y-6 lg:sticky lg:top-24 lg:h-fit"
            initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.5 }}
          >
            {/* JobsPromo card */}
            <motion.div
              className="rounded-lg border p-6 space-y-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.55 }}
            >
              <Skeleton size="md" width="sm" className="mb-2" />
              <Skeleton size="sm" width="3xl" />
              <Skeleton size="sm" width="2xl" />
              <Skeleton size="md" width="3xl" rounded="md" className="h-10" />
            </motion.div>

            {/* RecentlyViewedSidebar */}
            <motion.div
              className="rounded-lg border p-4 space-y-3"
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.6 }}
            >
              <Skeleton size="sm" width="sm" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton size="sm" width="sm" rounded="md" className="h-10 w-10" />
                    <div className="flex-1 space-y-1">
                      <Skeleton size="sm" width="2/3" />
                      <Skeleton size="xs" width="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.aside>
        </div>
      </motion.section>
    </motion.div>
  );
}

/**
 * Detail page loading
 * Perfectly matches structure of /[category]/[slug] pages with beautiful animations
 * Structure: Header (back + title + badges + actions) → Metadata → Quick Actions → Main (2/3) + Sidebar (1/3)
 */
export function DetailPageLoading() {
  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header - DetailHeader with back button, icon, title, badges, actions sidebar */}
      <motion.div
        className="border-border bg-code/50 border-b backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Skeleton size="sm" width="sm" className="mb-6" />

          {/* Title section with icon, title, description, badges, and actions sidebar */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:gap-10">
            {/* Left: Content info */}
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <Skeleton size="sm" width="xs" rounded="full" />
                <Skeleton size="sm" width="xs" rounded="full" />
              </div>
              {/* Title */}
              <Skeleton size="xl" width="3/4" className="h-10" />
              {/* Description */}
              <Skeleton size="md" width="2xl" className="h-6" />
            </div>

            {/* Right: Actions sidebar (sticky) */}
            <aside className="border-border/50 bg-card/50 space-y-3 rounded-lg border p-4 lg:sticky lg:top-24 lg:self-start">
              <Skeleton size="md" width="3xl" className="h-10" />
              <Skeleton size="sm" width="3xl" className="h-8" />
            </aside>
          </div>
        </div>
      </motion.div>

      {/* Metadata section - DetailMetadata */}
      <motion.div
        className="container mx-auto px-4 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
            <Skeleton size="sm" width="xs" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
            <Skeleton size="sm" width="xs" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
            <Skeleton size="sm" width="xs" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Bar - DetailQuickActionsBar (sticky) */}
      <motion.section
        className="sticky top-16 z-20 mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.25 }}
      >
        <div className="container mx-auto px-4">
          <div className="border-border/60 bg-card/80 rounded-2xl border p-3">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} size="sm" width="lg" rounded="md" className="h-8" />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Content with sidebar */}
      <motion.div
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content - TabbedDetailLayout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
              <Skeleton size="md" width="lg" rounded="md" className="h-10" />
              <Skeleton size="md" width="lg" rounded="md" className="h-10" />
              <Skeleton size="md" width="lg" rounded="md" className="h-10" />
            </div>

            {/* Content sections */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.loading, delay: 0.4 }}
            >
              {/* Prose content */}
              <div className="prose space-y-4">
                <Skeleton size="md" width="3xl" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2/3" />
              </div>

              {/* Code block */}
              <div className="rounded-lg border p-4">
                <Skeleton size="sm" width="sm" className="mb-2" />
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={KEYS_8[i]} size="sm" width={i % 3 === 0 ? '2/3' : '3xl'} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - TOC + DetailSidebar + RecentlyViewedSidebar */}
          <motion.aside
            className="space-y-6 lg:self-start"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.4 }}
          >
            {/* TOC */}
            <div className="rounded-lg border p-4">
              <Skeleton size="sm" width="sm" className="mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} size="xs" width="xs" />
                ))}
              </div>
            </div>

            {/* Related items */}
            <div className="rounded-lg border p-4">
              <Skeleton size="sm" width="sm" className="mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton size="sm" width="sm" rounded="md" className="h-10 w-10" />
                    <div className="flex-1 space-y-1">
                      <Skeleton size="sm" width="2/3" />
                      <Skeleton size="xs" width="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Guide detail page loading
 * Matches structure of guide pages (more text-heavy)
 */
export function GuideDetailLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      <motion.div
        className="border-border/50 border-b bg-card/30"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
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
                <motion.div
                  key={KEYS_5[i]}
                  initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                  transition={{ ...SPRING.loading, delay: 0.2 + i * STAGGER.micro }}
                >
                  <Skeleton size="sm" width="xs" rounded="full" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} ${UI_CLASSES.PADDING_Y_SECTION}`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <div className={`grid grid-cols-1 ${UI_CLASSES.SPACE_LOOSE} lg:grid-cols-3`}>
          <div className={`${UI_CLASSES.SPACE_Y_6} lg:col-span-2`}>
            <div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={KEYS_12[i]}
                  initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
                >
                  <Skeleton size="sm" width={i % 4 === 0 ? '2/3' : '3xl'} />
                </motion.div>
              ))}
            </div>
          </div>
          <div className={UI_CLASSES.SPACE_Y_6}>
            <motion.div
              className={`${UI_CLASSES.SPACE_Y_4} rounded-lg border ${UI_CLASSES.PADDING_COMFORTABLE}`}
              initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.4 }}
            >
              <Skeleton size="md" width="sm" />
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={KEYS_3[i]}
                  initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
                >
                  <Skeleton size="sm" width="3xl" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Search results loading
 * Matches structure of search page with filters
 * 
 * NOTE: The actual search page uses SearchPageSkeleton directly.
 * This factory function is kept for backwards compatibility with getLoadingComponent('/search').
 */
export function SearchResultsLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className={UI_CLASSES.SPACE_Y_6}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Results count */}
      <motion.div
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="sm" width="sm" />
      </motion.div>

      {/* Results grid */}
      <motion.div
        className={UI_CLASSES.GRID_RESPONSIVE_3_TIGHT}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={KEYS_9[i]}
            initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
            transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
          >
            <ConfigCardSkeleton />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/**
 * Homepage loading (complex with multiple sections)
 * 
 * NOTE: The actual homepage uses HomepageSkeleton directly.
 * This factory function is kept for backwards compatibility with getLoadingComponent('/').
 */
export function HomePageLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Hero */}
      <motion.section
        className="border-border/50 border-b"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <div className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-16 text-center`}>
          <Skeleton
            size="xl"
            width="3/4"
            className={`mx-auto ${UI_CLASSES.MARGIN_COMFORTABLE} h-16`}
          />
          <Skeleton size="md" width="2/3" className="mx-auto" />
        </div>
      </motion.section>

      {/* Search */}
      <motion.div
        className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} py-8`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <div className="mx-auto max-w-4xl">
          <Skeleton size="lg" width="3xl" className={`${UI_CLASSES.MARGIN_COMFORTABLE} h-14`} />
          {/* Stats */}
          <div className={`flex flex-wrap justify-center ${UI_CLASSES.SPACE_COMFORTABLE}`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={KEYS_7[i]}
                initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
              >
                <Skeleton size="sm" width="sm" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content sections */}
      <motion.div
        className={`container mx-auto ${UI_CLASSES.PADDING_X_DEFAULT} pb-16`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.4 }}
      >
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <motion.div
            key={KEYS_3[sectionIndex]}
            className={UI_CLASSES.MARGIN_SECTION}
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.5 + sectionIndex * STAGGER.fast }}
          >
            <div className={`${UI_CLASSES.MARGIN_COMFORTABLE} flex items-center justify-between`}>
              <Skeleton size="lg" width="lg" />
              <Skeleton size="sm" width="sm" />
            </div>
            <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={KEYS_6[i]}
                  initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                  transition={{
                    ...SPRING.loading,
                    delay: 0.6 + sectionIndex * STAGGER.fast + i * STAGGER.micro,
                  }}
                >
                  <ConfigCardSkeleton />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/**
 * Changelog list loading
 * Matches the changelog page structure with header and timeline view
 * Uses the same structure as ChangelogContentSkeleton component
 * 
 * NOTE: The actual changelog page uses ChangelogContentSkeleton directly in Suspense.
 * This factory function is kept for backwards compatibility with getLoadingComponent('/changelog').
 */
export function ChangelogListLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className="bg-background relative min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header - EXACTLY matches changelog page */}
      <motion.div
        className="border-border/50 border-b"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center justify-between p-3">
            <Skeleton size="xl" width="lg" className="h-10" />
            {/* ThemeToggle placeholder */}
          </div>
        </div>
      </motion.div>

      {/* Timeline skeleton - matches ChangelogContentSkeleton structure */}
      <motion.div
        className="mx-auto my-8 max-w-5xl"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <div className="space-y-0">
          {KEYS_6.map((key, index) => (
            <motion.div
              key={key}
              className="relative pb-10 last:pb-0"
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...SPRING.loading,
                mass: 0.5,
                delay: 0.3 + index * STAGGER.micro,
              }}
            >
              <div className="flex flex-col gap-y-6 md:flex-row">
                {/* Left: Timeline markers (sticky) */}
                <div className="flex-shrink-0 md:w-48">
                  <div className="pb-10 md:sticky md:top-8">
                    {/* Date */}
                    <Skeleton size="sm" width="xs" className="mb-3" />
                    {/* Version badge */}
                    <Skeleton size="md" width="md" rounded="lg" className="h-10 w-10" />
                  </div>
                </div>

                {/* Right: Content */}
                <div className="relative flex-1 pb-10 pl-0 md:pl-8">
                  {/* Vertical timeline line */}
                  <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                    {/* Timeline dot */}
                    <div className="hidden md:block absolute -translate-x-1/2 size-3 bg-primary rounded-full z-10" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                      <Skeleton size="lg" width="3/4" className="h-8" />
                      {/* Tags */}
                      <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2}`}>
                        <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                        <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                        <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                      </div>
                    </div>

                    {/* Content prose */}
                    <div className="space-y-3">
                      <Skeleton size="md" width="3xl" />
                      <Skeleton size="sm" width="3xl" />
                      <Skeleton size="sm" width="3xl" />
                      <Skeleton size="sm" width="2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Submit page loading
 * Perfectly matches the submit page structure: hero, form (left), sidebar (right)
 * 
 * NOTE: The actual submit page uses SubmitPageSkeleton directly.
 * This factory function is kept for backwards compatibility with getLoadingComponent('/submit').
 */
export function SubmitPageLoading() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className="container mx-auto max-w-7xl px-4 py-8 sm:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Hero Header */}
      <motion.div
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
        className="border-border/50 bg-card relative overflow-hidden rounded-2xl border p-8 mb-8"
      >
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <Skeleton size="sm" width="md" rounded="full" className="h-7" />
            <Skeleton size="xl" width="xl" className="h-12" />
            <Skeleton size="md" width="3xl" className="h-6" />
            <div className="flex flex-wrap items-center gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                  transition={{ ...SPRING.loading, delay: 0.2 + i * STAGGER.micro }}
                  className="flex items-center gap-1.5"
                >
                  <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
                  <Skeleton size="sm" width="xs" className="h-4" />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <Skeleton size="xl" width="xl" rounded="xl" className="h-32 w-32 rounded-2xl" />
          </div>
        </div>
      </motion.div>

      {/* Two-column layout: Form + Sidebar */}
      <motion.div
        className="grid items-start gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        {/* Form Section (Left) */}
        <motion.div
          className="w-full min-w-0"
          initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
        >
          <div className="bg-muted/20 rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton size="lg" width="md" className="h-8" />
              <Skeleton size="sm" width="3xl" className="h-5" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`field-${i}`}
                  initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...SPRING.loading, delay: 0.4 + i * STAGGER.micro }}
                  className="space-y-2"
                >
                  <Skeleton size="sm" width="xs" className="h-4" />
                  <Skeleton size="lg" width="3xl" className="h-10" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sidebar (Right) */}
        <motion.div
          className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit"
          initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.4 }}
        >
          {/* JobsPromo card */}
          <motion.div
            className="rounded-lg border p-6 space-y-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.5 }}
          >
            <Skeleton size="md" width="sm" className="mb-2 h-6" />
            <Skeleton size="sm" width="3xl" className="h-4" />
            <Skeleton size="sm" width="2xl" className="h-4" />
            <Skeleton size="md" width="3xl" rounded="md" className="h-10" />
          </motion.div>

          {/* RecentlyViewedSidebar */}
          <motion.div
            className="rounded-lg border p-4 space-y-3"
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.6 }}
          >
            <Skeleton size="sm" width="sm" className="h-5" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton size="sm" width="sm" rounded="md" className="h-10 w-10" />
                  <div className="flex-1 space-y-1">
                    <Skeleton size="sm" width="2/3" className="h-4" />
                    <Skeleton size="xs" width="xs" className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Submit page-specific sidebar */}
          <motion.div
            className="rounded-lg border p-4 space-y-3"
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.7 }}
          >
            <div className="grid w-full grid-cols-2 gap-2 rounded-lg border p-1">
              <Skeleton size="sm" width="3xl" rounded="md" className="h-9" />
              <Skeleton size="sm" width="3xl" rounded="md" className="h-9" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
                  <div className="flex-1 space-y-1">
                    <Skeleton size="sm" width="2/3" className="h-4" />
                    <Skeleton size="xs" width="xs" className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
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
    <motion.div
      className="bg-background min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header Skeleton */}
      <section className="border-border relative border-b">
        <motion.div
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={
            !prefersReducedMotion
              ? {
                  ...SPRING.default,
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
                      ...SPRING.default,
                      mass: 0.5,
                      delay: STAGGER.fast,
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
                            ...SPRING.default,
                            mass: 0.5,
                            delay: STAGGER.default + i * STAGGER.micro,
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
                  ...SPRING.default,
                  mass: 0.5,
                  delay: STAGGER.slow,
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
    </motion.div>
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
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <motion.div
        className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {/* Header */}
        <motion.div
          className="space-y-4"
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          {showBackButton && (
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.15 }}
            >
              <Skeleton size="sm" width="xs" rounded="md" className="h-9" />
            </motion.div>
          )}
          {title ? (
            <div>
              <Skeleton size="xl" width="lg" className="h-9" />
              <Skeleton size="sm" width="2xl" className="mt-2 h-5" />
            </div>
          ) : (
            <>
              <Skeleton size="xl" width="lg" className="h-9" />
              <Skeleton size="sm" width="2xl" className="h-5" />
            </>
          )}
        </motion.div>

        {/* Form Cards */}
        <form className="space-y-6">
          {Array.from({ length: cardCount }).map((_, cardIndex) => {
            const fieldCount = fieldsPerCard[cardIndex] ?? fieldsPerCard[0] ?? 4;
            const cardTitle = cardTitles?.[cardIndex];

            return (
              <motion.div
                key={`card-${cardIndex}`}
                className="rounded-lg border"
                initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING.loading, delay: 0.2 + cardIndex * STAGGER.micro }}
              >
                <div className="border-b p-6 space-y-2">
                  {cardTitle ? (
                    <>
                      <Skeleton size="md" width="md" className="h-6" />
                      <Skeleton size="sm" width="2xl" className="h-4" />
                    </>
                  ) : (
                    <>
                      <Skeleton size="md" width="md" className="h-6" />
                      <Skeleton size="sm" width="2xl" className="h-4" />
                    </>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {Array.from({ length: fieldCount }).map((_, fieldIndex) => (
                    <motion.div
                      key={`field-${fieldIndex}`}
                      className="space-y-2"
                      initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                      animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        ...SPRING.loading,
                        delay: 0.3 + cardIndex * STAGGER.micro + fieldIndex * STAGGER.micro,
                      }}
                    >
                      <Skeleton size="sm" width="xs" className="h-4" />
                      <Skeleton size="lg" width="3xl" className="h-10" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Action Buttons */}
          {showActions && (
            <motion.div
              className="flex gap-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...SPRING.smooth,
                delay: 0.4 + cardCount * STAGGER.micro,
              }}
            >
              <Skeleton size="lg" width="lg" rounded="md" className="h-10" />
              <Skeleton size="lg" width="lg" rounded="md" className="h-10" />
            </motion.div>
          )}
        </form>
      </motion.div>
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
                  ...SPRING.default,
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
                          ...SPRING.default,
                          mass: 0.5,
                          delay: i * STAGGER.micro,
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
                          ...SPRING.default,
                          mass: 0.5,
                          delay: i * STAGGER.micro,
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
                        ...SPRING.loading,
                        mass: 0.5,
                        delay: i * STAGGER.micro,
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
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <motion.div
        className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {/* Header */}
        <motion.div
          className="space-y-2"
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          {showBackButton && (
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.15 }}
            >
              <Skeleton size="sm" width="xs" rounded="md" className="h-9" />
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            {showBadges && (
              <motion.div
                initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                transition={{ ...SPRING.loading, delay: 0.2 }}
              >
                <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
              </motion.div>
            )}
            <Skeleton size="xl" width="lg" className="h-9" />
          </div>
          <Skeleton size="sm" width="2xl" className="h-5" />
        </motion.div>

        {/* Stats Section (optional) */}
        {showStats && (
          <motion.div
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            {Array.from({ length: statsCount }).map((_, i) => (
              <motion.div
                key={`stat-${i}`}
                className="rounded-lg border p-6 space-y-2"
                initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
              >
                <Skeleton size="sm" width="xs" className="h-4" />
                <Skeleton size="lg" width="sm" className="h-8" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Content Cards */}
        {Array.from({ length: cardCount }).map((_, cardIndex) => (
          <motion.div
            key={`card-${cardIndex}`}
            className="rounded-lg border"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.4 + cardIndex * STAGGER.micro }}
          >
            <div className="border-b p-6 space-y-2">
              <Skeleton size="md" width="md" className="h-6" />
              <Skeleton size="sm" width="2xl" className="h-4" />
            </div>
            <div className="p-6">
              {cardIndex === 0 && showStats ? (
                // First card might have stats grid
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={`detail-${i}`}
                      className="space-y-1"
                      initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
                      animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                      transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
                    >
                      <Skeleton size="sm" width="xs" className="h-4" />
                      <Skeleton size="sm" width="sm" className="h-4" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Regular card content
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={`content-${i}`}
                      initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
                      animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                      transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
                    >
                      <Skeleton size="sm" width={i === 2 ? '2xl' : '3xl'} className="h-4" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Chart Area (optional) */}
        {showChart && (
          <motion.div
            className="rounded-lg border p-6 space-y-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.6 + cardCount * STAGGER.micro }}
          >
            <Skeleton size="md" width="md" className="h-6" />
            <Skeleton size="xl" width="3xl" className="h-64" />
          </motion.div>
        )}
      </motion.div>
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
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <motion.div
        className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 sm:py-12`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {/* Header */}
        <motion.div
          className={centered ? 'text-center mb-8' : 'mb-8'}
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          {title ? (
            <>
              <Skeleton size="xl" width="lg" className={`h-10 ${centered ? 'mx-auto' : ''}`} />
              <Skeleton size="sm" width="md" className={`mt-2 h-5 ${centered ? 'mx-auto' : ''}`} />
            </>
          ) : (
            <>
              <Skeleton size="xl" width="lg" className={`h-10 ${centered ? 'mx-auto' : ''}`} />
              <Skeleton size="sm" width="md" className={`mt-2 h-5 ${centered ? 'mx-auto' : ''}`} />
            </>
          )}
        </motion.div>

        {/* Cards Grid (optional) */}
        {showCards && (
          <motion.div
            className={`${gridClasses[cardsPerRow]} mb-8`}
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            {Array.from({ length: cardsPerRow * 2 }).map((_, i) => (
              <motion.div
                key={`card-${i}`}
                className="rounded-lg border p-6 space-y-3"
                initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
              >
                <Skeleton size="md" width="md" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2xl" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Content Sections */}
        <motion.div
          className="prose prose-invert max-w-none space-y-8"
          initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.2 }}
        >
          {Array.from({ length: sections }).map((_, i) => (
            <motion.section
              key={`section-${i}`}
              className="space-y-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
            >
              <Skeleton size="lg" width="md" className="h-8" />
              <Skeleton size="sm" width="3xl" className="h-5" />
              <Skeleton size="sm" width="3xl" className="h-5" />
              <Skeleton size="sm" width="2xl" className="h-5" />
              {i % 2 === 0 && (
                <>
                  <Skeleton size="sm" width="3xl" className="h-5" />
                  <Skeleton size="sm" width="2/3" className="h-5" />
                </>
              )}
            </motion.section>
          ))}
        </motion.div>
      </motion.div>
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
      <motion.div
        className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {/* Header */}
        {title && (
          <motion.div
            className="space-y-2"
            initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.1 }}
          >
            <Skeleton size="xl" width="lg" className="h-9" />
            <Skeleton size="sm" width="2xl" className="h-5" />
          </motion.div>
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
                        ...SPRING.loading,
                        mass: 0.5,
                        delay: i * STAGGER.micro,
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
                    ...SPRING.default,
                    mass: 0.5,
                    delay: STAGGER.default,
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
                        ...SPRING.default,
                        mass: 0.5,
                        delay: STAGGER.slow + i * STAGGER.micro,
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
                        ...SPRING.default,
                        mass: 0.5,
                        delay: STAGGER.slow + i * STAGGER.fast,
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
      </motion.div>
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
      <motion.div
        className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 space-y-6`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {/* Header */}
        <motion.div
          className="space-y-4"
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          {title && (
            <>
              <Skeleton size="xl" width="lg" className="h-9" />
              <Skeleton size="sm" width="2xl" className="h-5" />
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
                      ...SPRING.loading,
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
        </motion.div>

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
                        ...SPRING.loading,
                        mass: 0.5,
                        delay: i * STAGGER.micro,
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
                        ...SPRING.default,
                        mass: 0.5,
                        delay: STAGGER.default + cardIndex * STAGGER.fast,
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
      </motion.div>
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
      <motion.div
        className={`container mx-auto ${maxWidthClasses[maxWidth]} px-4 py-8 sm:py-12`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {/* Header */}
        <motion.div
          className={centered ? 'mb-8 text-center' : 'mb-8'}
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          {title && (
            <>
              <Skeleton size="xl" width="lg" className={`mb-4 h-10 ${centered ? 'mx-auto' : ''}`} />
              <Skeleton size="md" width="2xl" className={`h-6 ${centered ? 'mx-auto' : ''}`} />
            </>
          )}
        </motion.div>

        {/* Cards Grid */}
        {cardsCount > 0 && (
          <motion.div
            className="mb-12"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            <h2 className="mb-6 text-center text-2xl font-semibold">
              <Skeleton size="lg" width="md" className="mx-auto h-8" />
            </h2>
            <div className={`${gridClasses[cardsPerRow]} gap-6`}>
              {Array.from({ length: cardsCount }).map((_, i) => (
                <motion.div
                  key={`card-${i}`}
                  initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                  transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Skeleton size="sm" width="xs" rounded="md" className="h-5 w-5" />
                        <Skeleton size="md" width="md" className="h-6" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton size="sm" width="3xl" className="mb-4 h-4" />
                      <Skeleton size="sm" width="lg" rounded="md" className="h-6" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Prose Sections */}
        {showProseSections && (
          <motion.div
            className="prose prose-invert mx-auto mt-12 max-w-none space-y-8"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: 0.4 }}
          >
            {Array.from({ length: proseSectionsCount }).map((_, i) => (
              <motion.section
                key={`section-${i}`}
                className="space-y-4"
                initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
              >
                <Skeleton size="lg" width="md" className="h-8" />
                <Skeleton size="sm" width="3xl" className="h-5" />
                <Skeleton size="sm" width="3xl" className="h-5" />
                <Skeleton size="sm" width="2xl" className="h-5" />
              </motion.section>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }

  ContactPageLoading.displayName = title
    ? `${title.replace(/\s+/g, '')}Loading`
    : 'ContactPageLoading';

  return ContactPageLoading;
}
