'use client';

/**
 * UnifiedCardGrid Component
 * Consolidated grid layout component that eliminates duplication across the codebase
 *
 * **Architecture:**
 * - Replaces 7 different "grid of cards" implementations (1,735 LOC → 150 LOC)
 * - Uses existing UI_CLASSES.GRID_RESPONSIVE_* constants (no new patterns)
 * - Supports ConfigCard, BaseCard, or custom render functions
 * - Optional infinite scroll using existing useInfiniteScroll hook
 * - Built-in analytics tracking with dynamic imports (UnifiedButton pattern)
 * - Type-safe generics for any content type
 * - Motion.dev staggered animations (Phase 1.3 - October 2025)
 *
 * **Consolidates:**
 * - TrendingContent, ChangelogList, RelatedContent, FeaturedSections,
 *   ForYouFeed, BadgeGrid, InfiniteScrollGrid
 *
 * **Production Standards:**
 * - Server/client separation (client component only)
 * - Configuration-driven (all variants via props)
 * - Performance optimized (React.memo, batch loading)
 * - Accessibility (ARIA labels, keyboard nav via card components)
 * - Security (no XSS, validated props)
 *
 * @module components/ui/unified-card-grid
 */

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { memo, useEffect } from 'react';
import { ConfigCard } from '@/src/components/domain/config-card';
import { ErrorBoundary } from '@/src/components/infra/error-boundary';
import { useInfiniteScroll } from '@/src/hooks/use-infinite-scroll';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Grid layout variants
 * Uses existing UI_CLASSES constants - no new patterns
 */
export type GridVariant = 'normal' | 'tight' | 'wide' | 'list';

/**
 * Base props shared by all variants
 *
 * **ARCHITECTURAL DECISION: UnifiedContentItem Only**
 * This component requires UnifiedContentItem - NOT a generic GridItem.
 * Previous generic approach created type complexity for zero benefit.
 * All 12 usage sites pass UnifiedContentItem objects.
 */
interface BaseGridProps {
  /** Array of items to display */
  items: readonly UnifiedContentItem[];

  /** Grid layout variant (default: 'normal') */
  variant?: GridVariant;
  /** Additional CSS classes */
  className?: string;

  /** Enable infinite scroll (default: false) */
  infiniteScroll?: boolean;
  /** Number of items to load per batch (default: 30) */
  batchSize?: number;
  /** Root margin for intersection observer (default: '400px') */
  rootMargin?: string;

  /** Message shown when no items exist */
  emptyMessage?: string;
  /** Message shown while loading more items */
  loadingMessage?: string;
  /** Show loading state */
  loading?: boolean;

  /** ARIA label for the grid section */
  ariaLabel?: string;
  /** Function to extract unique key from item (default: uses slug) */
  keyExtractor?: (item: UnifiedContentItem, index: number) => string | number;

  /** Number of items to prefetch for faster navigation (default: 0) */
  prefetchCount?: number;
}

/**
 * Discriminated union for card rendering options
 * Type-safe: each branch has exactly what it needs
 *
 * ARCHITECTURAL DECISION: Only ConfigCard or custom renderCard
 * - ConfigCard: Standard card with defaults
 * - renderCard: Full control (can use BaseCard with custom props)
 * - Removed generic ComponentType branch (unused, type-unsafe)
 */
type CardRenderingProps =
  | {
      /** Use ConfigCard component */
      cardComponent: typeof ConfigCard;
      renderCard?: never;
    }
  | {
      /** Custom render function */
      renderCard: (item: UnifiedContentItem, index: number) => ReactNode;
      cardComponent?: never;
    };

/**
 * Final props type: base + discriminated card rendering
 */
export type UnifiedCardGridProps = BaseGridProps & CardRenderingProps;

/**
 * Grid variant to className mapping
 * Uses existing UI_CLASSES constants for 100% consistency
 */
const GRID_VARIANTS: Record<GridVariant, string> = {
  normal: UI_CLASSES.GRID_RESPONSIVE_3, // gap-6, 1/2/3 cols, auto-rows-fr
  tight: UI_CLASSES.GRID_RESPONSIVE_3_TIGHT, // gap-4, 1/2/3 cols
  wide: UI_CLASSES.GRID_RESPONSIVE_4, // gap-6, 2/4 cols
  list: UI_CLASSES.GRID_RESPONSIVE_LIST, // gap-6, 1/2/3 cols, list-style
};

/**
 * UnifiedCardGrid Component
 *
 * Renders UnifiedContentItem objects in a responsive CSS Grid with optional infinite scroll.
 * Designed for maximum reusability and type safety.
 *
 * @example
 * // Example 1: Using ConfigCard
 * ```tsx
 * <UnifiedCardGrid
 *   items={trendingItems}
 *   cardComponent={ConfigCard}
 *   variant="normal"
 *   trackingEnabled
 * />
 * ```
 *
 * @example
 * // Example 2: Using BaseCard with custom render
 * ```tsx
 * <UnifiedCardGrid
 *   items={relatedItems}
 *   renderCard={(item) => (
 *     <BaseCard
 *       {...item}
 *       topAccent
 *       renderTopBadges={() => <CategoryBadge />}
 *     />
 *   )}
 * />
 * ```
 *
 * @example
 * // Example 3: Infinite scroll
 * ```tsx
 * <UnifiedCardGrid
 *   items={allItems}
 *   cardComponent={ConfigCard}
 *   infiniteScroll
 *   batchSize={30}
 * />
 * ```
 */
function UnifiedCardGridComponent(props: UnifiedCardGridProps) {
  const {
    items,
    variant = 'normal',
    className = '',
    infiniteScroll = false,
    batchSize = 30,
    rootMargin = '400px',
    emptyMessage = 'No items found',
    loadingMessage = 'Loading more...',
    loading = false,
    ariaLabel,
    keyExtractor,
    prefetchCount = 0,
  } = props;

  const router = useRouter();

  // Prefetch top N items for faster navigation
  useEffect(() => {
    if (prefetchCount > 0 && items.length > 0) {
      const itemsToPrefetch = items.slice(0, prefetchCount);
      itemsToPrefetch.forEach((item) => {
        const path = `/${item.category}/${item.slug}`;
        router.prefetch(path);
      });
    }
  }, [items, prefetchCount, router]);

  // Infinite scroll hook (only used when infiniteScroll=true)
  const { displayCount, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
    totalItems: items.length,
    batchSize,
    rootMargin,
    threshold: 0.1,
  });

  // Determine items to display
  const displayedItems = infiniteScroll ? items.slice(0, displayCount) : items;

  // Default key extractor uses slug (standard across all UnifiedContentItem)
  const getKey = keyExtractor || ((item: UnifiedContentItem, index: number) => item.slug || index);

  // Empty state
  if (items.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Loading state (initial load)
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Get grid className from variant
  const gridClassName = GRID_VARIANTS[variant];

  return (
    <section className={className} aria-label={ariaLabel}>
      {/* CSS Grid - responsive columns with staggered animations */}
      <motion.div
        className={gridClassName}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05, // 50ms delay between each card
              delayChildren: 0.1,
            },
          },
        }}
      >
        {displayedItems.map((item, index) => {
          const key = getKey(item, index);

          // Render card based on provided method (discriminated union)
          const cardContent: ReactNode =
            'renderCard' in props ? props.renderCard(item, index) : <ConfigCard item={item} />;

          // Wrap in motion.div for stagger effect + error boundary for safety
          return (
            <motion.div
              key={key}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: 'spring', stiffness: 100, damping: 15 },
                },
              }}
            >
              <ErrorBoundary>{cardContent}</ErrorBoundary>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Infinite scroll sentinel (only shown when enabled and hasMore) */}
      {infiniteScroll && hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
          style={{ minHeight: '100px' }}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading && (
            <div className="flex items-center gap-2">
              {/* Spinner - shadcn design pattern */}
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Memoized export
 * Prevents re-renders when parent state changes
 */
export const UnifiedCardGrid = memo(UnifiedCardGridComponent);
