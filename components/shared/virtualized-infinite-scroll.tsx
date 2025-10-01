'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { Button } from '@/components/ui/button';
import { Loader2 } from '@/lib/icons';
import { logger } from '@/lib/logger';
import { UI_CLASSES } from '@/lib/ui-constants';
import { cn } from '@/lib/utils';

export interface VirtualizedInfiniteScrollProps<T> {
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
  virtualizeThreshold?: number; // Number of items before virtualization kicks in
  overscan?: number; // Number of items to render outside viewport
  itemHeight?: number; // Estimated height for virtualization
}

export function VirtualizedInfiniteScroll<T>({
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
  virtualizeThreshold = 100,
  overscan = 5,
  itemHeight = 200,
}: VirtualizedInfiniteScrollProps<T>) {
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState<T[]>(items);
  const [localHasMore, setLocalHasMore] = useState(hasMore);
  const [error, setError] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize });

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Cleanup function for refs
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    itemsRef.current.clear();
  }, []);

  // Calculate visible items based on scroll position
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current || allItems.length <= virtualizeThreshold) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      allItems.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [allItems.length, virtualizeThreshold, itemHeight, overscan]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !localHasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await loadMore();

      if (newItems.length === 0) {
        setLocalHasMore(false);
      } else {
        setAllItems((prev) => {
          // Implement memory limit - keep max 500 items in memory
          const combined = [...prev, ...newItems];
          if (combined.length > 500) {
            // Remove oldest items if we exceed limit
            return combined.slice(combined.length - 500);
          }
          return combined;
        });

        if (newItems.length < pageSize) {
          setLocalHasMore(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more items';
      setError(errorMessage);

      logger.error(
        'Virtualized infinite scroll failed',
        err instanceof Error ? err : new Error(String(err)),
        {
          currentItemCount: allItems.length,
          pageSize,
          hasMore: localHasMore,
        }
      );
    } finally {
      setLoading(false);
    }
  }, [loading, localHasMore, loadMore, pageSize, allItems.length]);

  // Setup intersection observer
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!(element && localHasMore) || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [localHasMore, loading, handleLoadMore]);

  // Update items when props change
  useEffect(() => {
    setAllItems(items);
  }, [items]);

  // Update hasMore when prop changes
  useEffect(() => {
    setLocalHasMore(hasMore);
  }, [hasMore]);

  // Setup scroll listener for virtualization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || allItems.length <= virtualizeThreshold) return;

    const handleScroll = () => {
      requestAnimationFrame(updateVisibleRange);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    updateVisibleRange(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [allItems.length, virtualizeThreshold, updateVisibleRange]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Determine items to render
  const itemsToRender = useMemo(() => {
    if (allItems.length <= virtualizeThreshold) {
      return allItems;
    }
    return allItems.slice(visibleRange.start, visibleRange.end);
  }, [allItems, virtualizeThreshold, visibleRange]);

  // Calculate container styles for virtualization
  const virtualStyles = useMemo(() => {
    if (allItems.length <= virtualizeThreshold) {
      return {};
    }

    return {
      paddingTop: `${visibleRange.start * itemHeight}px`,
      paddingBottom: `${Math.max(0, (allItems.length - visibleRange.end) * itemHeight)}px`,
    };
  }, [allItems.length, virtualizeThreshold, visibleRange, itemHeight]);

  if (allItems.length === 0 && !loading) {
    return (
      <div className={UI_CLASSES.CONTAINER_CENTER}>
        <p className={`text-muted-foreground ${UI_CLASSES.TEXT_LG}`}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('space-y-8 overflow-auto', className)}
      style={{ maxHeight: '80vh' }} // Ensure scrollable container
    >
      {/* Items Grid with virtualization */}
      <div className={gridClassName} style={virtualStyles}>
        {itemsToRender.map((item, localIndex) => {
          const actualIndex =
            allItems.length <= virtualizeThreshold ? localIndex : visibleRange.start + localIndex;
          const key = keyExtractor ? keyExtractor(item, actualIndex) : `item-${actualIndex}`;

          return (
            <div
              key={key}
              ref={(el) => {
                if (el) {
                  itemsRef.current.set(actualIndex, el);
                } else {
                  itemsRef.current.delete(actualIndex);
                }
              }}
            >
              <ErrorBoundary
                fallback={() => (
                  <div className="p-4 text-center text-muted-foreground">Error loading item</div>
                )}
              >
                {renderItem(item, actualIndex)}
              </ErrorBoundary>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`${UI_CLASSES.FLEX_COL_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} py-8`}>
          <p className="text-destructive text-sm mb-4">{error}</p>
          <Button onClick={handleLoadMore} variant="outline" size="sm">
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
        <div ref={loadMoreRef} className={`h-4 ${UI_CLASSES.W_FULL}`} aria-hidden="true" />
      )}

      {/* Manual Load More Button (Optional) */}
      {!loading && localHasMore && showLoadMoreButton && (
        <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.PT_4} ${UI_CLASSES.PB_8}`}>
          <Button onClick={handleLoadMore} variant="outline" size="lg" className="min-w-[200px]">
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
