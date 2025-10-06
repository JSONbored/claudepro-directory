"use client";

import { type ReactNode, useCallback, useState } from "react";
import { ErrorBoundary } from "@/src/components/shared/error-boundary";
import { Button } from "@/src/components/ui/button";
import { useInfiniteScroll } from "@/src/hooks/use-infinite-scroll";
import { Loader2 } from "@/src/lib/icons";
import { logger } from "@/src/lib/logger";
import { UI_CLASSES } from "@/src/lib/ui-constants";
import { cn } from "@/src/lib/utils";

export interface InfiniteScrollContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loadMore: () => Promise<T[]>;
  hasMore: boolean;
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
  className,
  gridClassName = UI_CLASSES.GRID_RESPONSIVE_3_TIGHT,
  loadingClassName,
  showLoadMoreButton = true,
  emptyMessage = "No items found",
  keyExtractor,
}: InfiniteScrollContainerProps<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      await loadMore();
      // Trust parent's hasMore prop for pagination state
      // No need to manage local state
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load more items";
      setError(errorMessage);

      logger.error(
        "Infinite scroll failed to load more items",
        err instanceof Error ? err : new Error(String(err)),
        {
          currentItemCount: items.length,
          hasMore,
          component: "InfiniteScrollContainer",
        },
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
    rootMargin: "200px",
  });

  // Manual load more
  const handleManualLoadMore = useCallback(() => {
    handleLoadMore().catch(() => {
      // Error already handled in handleLoadMore
    });
  }, [handleLoadMore]);

  if (items.length === 0 && !loading) {
    return (
      <div className={UI_CLASSES.CONTAINER_CENTER}>
        <p className={`text-muted-foreground ${UI_CLASSES.TEXT_LG}`}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Items Grid */}
      <div className={gridClassName}>
        {items.map((item, index) => {
          const key = keyExtractor
            ? keyExtractor(item, index)
            : `item-${index}`;
          return (
            <div key={key}>
              <ErrorBoundary>{renderItem(item, index)}</ErrorBoundary>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`${UI_CLASSES.FLEX_COL_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} py-8`}
        >
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
            loadingClassName,
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
          className={`h-4 ${UI_CLASSES.W_FULL}`}
          aria-hidden="true"
        />
      )}

      {/* Manual Load More Button (Optional) */}
      {!loading && hasMore && showLoadMoreButton && (
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
      {!hasMore && items.length > 0 && (
        <div className={`flex ${UI_CLASSES.JUSTIFY_CENTER} py-8`}>
          <p className="text-muted-foreground text-sm">
            You've reached the end • {items.length} total items
          </p>
        </div>
      )}
    </div>
  );
}
