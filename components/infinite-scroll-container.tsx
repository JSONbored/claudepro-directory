'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Loader2 } from '@/lib/icons';
import { logger } from '@/lib/logger';
import { UI_CLASSES } from '@/lib/ui-constants';
import { cn } from '@/lib/utils';

export interface InfiniteScrollContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loadMore: () => Promise<T[]>;
  hasMore: boolean;
  pageSize?: number;
  className?: string;
  gridClassName?: string;
  loadingClassName?: string;
  showLoadMoreButton?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function InfiniteScrollContainer<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  pageSize = 20,
  className,
  gridClassName = UI_CLASSES.GRID_RESPONSIVE_3_TIGHT,
  loadingClassName,
  showLoadMoreButton = true,
  emptyMessage = 'No items found',
  keyExtractor,
}: InfiniteScrollContainerProps<T>) {
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState<T[]>(items);
  const [localHasMore, setLocalHasMore] = useState(hasMore);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (loading || !localHasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await loadMore();

      if (newItems.length === 0) {
        setLocalHasMore(false);
      } else {
        setAllItems((prev) => [...prev, ...newItems]);

        // Check if we got fewer items than expected
        if (newItems.length < pageSize) {
          setLocalHasMore(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more items';
      setError(errorMessage);

      logger.error(
        'Infinite scroll failed to load more items',
        err instanceof Error ? err : new Error(String(err)),
        {
          currentItemCount: allItems.length,
          pageSize,
          hasMore: localHasMore,
          component: 'InfiniteScrollContainer',
        }
      );
    } finally {
      setLoading(false);
    }
  }, [loading, localHasMore, loadMore, pageSize, allItems.length]);

  // Use infinite scroll hook
  const observerTarget = useInfiniteScroll(handleLoadMore, {
    hasMore: localHasMore,
    loading,
    threshold: 0.1,
    rootMargin: '200px',
  });

  // Manual load more
  const handleManualLoadMore = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  // Update items when props change
  useEffect(() => {
    setAllItems(items);
  }, [items]);

  // Update hasMore when prop changes
  useEffect(() => {
    setLocalHasMore(hasMore);
  }, [hasMore]);

  if (allItems.length === 0 && !loading) {
    return (
      <div className={UI_CLASSES.CONTAINER_CENTER}>
        <p className={`text-muted-foreground ${UI_CLASSES.TEXT_LG}`}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Items Grid */}
      <div className={gridClassName}>
        {allItems.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : `item-${index}`;
          return (
            <div key={key}>
              <ErrorBoundary>{renderItem(item, index)}</ErrorBoundary>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`${UI_CLASSES.FLEX_COL_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} py-8`}>
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
            `flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} py-8`,
            loadingClassName
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading more...</span>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {!loading && localHasMore && (
        <div ref={observerTarget} className={`h-4 ${UI_CLASSES.W_FULL}`} aria-hidden="true" />
      )}

      {/* Manual Load More Button (Optional) */}
      {!loading && localHasMore && showLoadMoreButton && (
        <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} pt-4 pb-8`}>
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
      {!localHasMore && allItems.length > 0 && (
        <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} py-8`}>
          <p className="text-muted-foreground text-sm">
            You've reached the end • {allItems.length} total items
          </p>
        </div>
      )}
    </div>
  );
}
