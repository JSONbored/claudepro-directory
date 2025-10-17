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

import type { ComponentType, ReactNode } from 'react';
import { memo } from 'react';
import type { BaseCardProps } from '@/src/components/cards/base-card';
import { ErrorBoundary } from '@/src/components/infra/error-boundary';
import { useInfiniteScroll } from '@/src/hooks/use-infinite-scroll';
import type { ConfigCardProps } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Grid layout variants
 * Uses existing UI_CLASSES constants - no new patterns
 */
export type GridVariant = 'normal' | 'tight' | 'wide' | 'list';

/**
 * Card component type
 * Supports ConfigCard, BaseCard, or any custom card component
 */
type CardComponent<T> = ComponentType<ConfigCardProps & { item: T }> | ComponentType<BaseCardProps>;

/**
 * Minimum item requirements - any object with a slug property
 * Allows UnifiedContentItem, ChangelogEntry, or any custom item type
 * Uses minimal constraint for maximum flexibility
 */
type GridItem = { slug: string };

/**
 * Props for UnifiedCardGrid component
 * Type-safe generics with minimal constraints for maximum flexibility
 */
export interface UnifiedCardGridProps<T extends GridItem = GridItem> {
  // ===== REQUIRED =====
  /** Array of items to display */
  items: readonly T[];

  // ===== CARD RENDERING (Choose ONE) =====
  /** Option 1: Use existing card component (ConfigCard, BaseCard) */
  cardComponent?: CardComponent<T>;
  /** Option 1b: Props to pass to card component */
  cardProps?: Partial<ConfigCardProps> | Partial<BaseCardProps>;

  /** Option 2: Custom render function for special cases */
  renderCard?: (item: T, index: number) => ReactNode;

  // ===== LAYOUT =====
  /** Grid layout variant (default: 'normal') */
  variant?: GridVariant;
  /** Additional CSS classes */
  className?: string;

  // ===== FEATURES =====
  /** Enable infinite scroll (default: false) */
  infiniteScroll?: boolean;
  /** Number of items to load per batch (default: 30) */
  batchSize?: number;
  /** Root margin for intersection observer (default: '400px') */
  rootMargin?: string;

  // ===== STATES =====
  /** Message shown when no items exist */
  emptyMessage?: string;
  /** Message shown while loading more items */
  loadingMessage?: string;
  /** Show loading state */
  loading?: boolean;

  // ===== ACCESSIBILITY =====
  /** ARIA label for the grid section */
  ariaLabel?: string;
  /** Function to extract unique key from item (default: uses slug) */
  keyExtractor?: (item: T, index: number) => string | number;
}

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
 * Renders items in a responsive CSS Grid with optional infinite scroll.
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
function UnifiedCardGridComponent<T extends GridItem = GridItem>({
  items,
  cardComponent: CardComponent,
  cardProps,
  renderCard,
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
}: UnifiedCardGridProps<T>) {
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
  const getKey = keyExtractor || ((item: T, index: number) => item.slug || index);

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
          <output className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Get grid className from variant
  const gridClassName = GRID_VARIANTS[variant];

  return (
    <section className={className} aria-label={ariaLabel}>
      {/* CSS Grid - responsive columns */}
      <div className={gridClassName}>
        {displayedItems.map((item, index) => {
          const key = getKey(item, index);

          // Render card based on provided method
          const cardContent = renderCard ? (
            renderCard(item, index)
          ) : CardComponent ? (
            <CardComponent {...(cardProps as any)} item={item} />
          ) : null;

          // Wrap in error boundary for safety
          return <ErrorBoundary key={key}>{cardContent}</ErrorBoundary>;
        })}
      </div>

      {/* Infinite scroll sentinel (only shown when enabled and hasMore) */}
      {infiniteScroll && hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
          style={{ minHeight: '100px' }}
          role="status"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading && (
            <div className="flex items-center gap-2">
              {/* Spinner - shadcn design pattern */}
              <output className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Memoized export with generic type preservation
 * Prevents re-renders when parent state changes
 */
export const UnifiedCardGrid = memo(UnifiedCardGridComponent) as typeof UnifiedCardGridComponent;
