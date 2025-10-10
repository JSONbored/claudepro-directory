'use client';

import { memo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { Button } from '@/src/components/ui/button';
import { useInfiniteScroll } from '@/src/hooks/use-infinite-scroll';
import { Loader2 } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

export interface InfiniteScrollContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loadMore: () => Promise<T[]>;
  hasMore: boolean;
  className?: string;
  loadingClassName?: string;
  showLoadMoreButton?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
}

/**
 * Debounce utility for resize operations
 * Prevents excessive recalculations during window resize
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Infinite Scroll Container Component
 *
 * Performance Optimizations:
 * - Memoized to prevent re-renders when parent state changes
 * - Debounced resize calculations (150ms) to reduce layout thrashing
 * - useCallback on event handlers to prevent re-creation
 * - Masonry layout with dynamic row spanning
 */
function InfiniteScrollContainerComponent<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  className,
  loadingClassName,
  showLoadMoreButton = true,
  emptyMessage = 'No items found',
  keyExtractor,
}: InfiniteScrollContainerProps<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loadMore();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more items';
      setError(errorMessage);

      logger.error(
        'Infinite scroll failed to load more items',
        err instanceof Error ? err : new Error(String(err)),
        {
          currentItemCount: items.length,
          hasMore,
          component: 'InfiniteScrollContainer',
        }
      );
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, loadMore, items.length]);

  // Use infinite scroll hook
  const observerTarget = useInfiniteScroll(handleLoadMore, {
    hasMore,
    loading,
    threshold: 0.1,
    rootMargin: '200px',
  });

  // Manual load more
  const handleManualLoadMore = useCallback(() => {
    handleLoadMore().catch(() => {
      // Error already handled in handleLoadMore
    });
  }, [handleLoadMore]);

  // Masonry layout effect - calculates row spans based on content height
  // MUST be before early return to satisfy Rules of Hooks
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const resizeGridItems = () => {
      const rowGap = 24; // gap-6 = 24px
      const rowHeight = 1; // auto-rows-[1px] - Fine-grained control for consistent spacing
      const items = grid.querySelectorAll('[data-grid-item]');

      items.forEach((item) => {
        const content = item.querySelector('[data-grid-content]');
        if (content) {
          const contentHeight = content.getBoundingClientRect().height;
          const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
          (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
        }
      });
    };

    // Initial calculation (immediate, no debounce)
    resizeGridItems();

    // Debounced version for resize events (150ms delay)
    // Prevents excessive recalculations during continuous resize
    const debouncedResize = debounce(resizeGridItems, 150);

    // Recalculate on window resize (debounced)
    window.addEventListener('resize', debouncedResize);

    // Recalculate when items change (immediate, via ResizeObserver)
    const observer = new ResizeObserver(resizeGridItems);
    observer.observe(grid);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      observer.disconnect();
    };
  }, []);

  // Early return AFTER all hooks
  if (items.length === 0 && !loading) {
    return (
      <div className={UI_CLASSES.CONTAINER_CENTER}>
        <p className={`text-muted-foreground ${UI_CLASSES.TEXT_LG}`}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Items Grid - Masonry with dynamic row spanning */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[1px]"
      >
        {items.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : `item-${index}`;
          return (
            <div key={key} data-grid-item>
              <div data-grid-content>
                <ErrorBoundary>{renderItem(item, index)}</ErrorBoundary>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`${UI_CLASSES.FLEX_COL_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} py-8 mt-8`}>
          <p className="text-destructive text-sm mb-4">{error}</p>
          <Button onClick={handleManualLoadMore} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div
          className={cn(
            `flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} py-8 mt-8`,
            loadingClassName
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading more...</span>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {!loading && hasMore && (
        <div
          ref={observerTarget}
          className={`h-4 ${UI_CLASSES.W_FULL} mt-8`}
          aria-hidden="true"
          data-testid="infinite-scroll-target"
        />
      )}

      {/* Manual Load More Button (Optional) */}
      {!loading && hasMore && showLoadMoreButton && (
        <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} pt-4 pb-8 mt-8`}>
          <Button
            onClick={handleManualLoadMore}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            Load More
          </Button>
        </div>
      )}

      {/* End of List Message */}
      {!hasMore && items.length > 0 && (
        <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} py-8 mt-8`}>
          <p className="text-muted-foreground text-sm">
            You've reached the end • {items.length} total items
          </p>
        </div>
      )}
    </div>
  );
}

// Export memoized component - generic type preserved
export const InfiniteScrollContainer = memo(
  InfiniteScrollContainerComponent
) as typeof InfiniteScrollContainerComponent;
