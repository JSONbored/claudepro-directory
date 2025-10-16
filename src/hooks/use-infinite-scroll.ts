'use client';

/**
 * useInfiniteScroll Hook
 * Production-grade infinite scroll using Intersection Observer API
 * Fully compatible with CSS Grid layouts (no absolute positioning required)
 *
 * Features:
 * - Automatic batch loading with configurable sizes
 * - Built-in loading state management
 * - Threshold validation (0-1 range)
 * - Proper cleanup and memory management
 * - Performance optimized with useCallback memoization
 * - Type-safe with full TypeScript support
 *
 * @module hooks/use-infinite-scroll
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/src/lib/logger';

interface UseInfiniteScrollOptions {
  /** Total number of items available */
  totalItems: number;
  /** Number of items to load per batch (default: 30) */
  batchSize?: number;
  /** Root margin for intersection observer - when to trigger load (default: '400px') */
  rootMargin?: string;
  /** Threshold for intersection observer (0-1 range, default: 0.1) */
  threshold?: number;
  /** Custom root element for intersection observer (default: viewport) */
  root?: Element | Document | null;
}

interface UseInfiniteScrollReturn {
  /** Current number of items to display */
  displayCount: number;
  /** Whether more items are being loaded */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Ref to attach to the sentinel element */
  sentinelRef: (node: HTMLDivElement | null) => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for implementing infinite scroll with Intersection Observer
 *
 * @example
 * ```tsx
 * const { displayCount, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
 *   totalItems: items.length,
 *   batchSize: 30,
 *   rootMargin: '400px',
 * });
 *
 * const displayedItems = items.slice(0, displayCount);
 * ```
 */
export function useInfiniteScroll({
  totalItems,
  batchSize = 30,
  rootMargin = '400px',
  threshold = 0.1,
  root = null,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  // Validate threshold (shadcn-inspired production safety)
  const safeThreshold = useCallback(() => {
    if (threshold < 0 || threshold > 1) {
      logger.warn(
        'Invalid threshold for infinite scroll',
        { component: 'useInfiniteScroll' },
        {
          receivedThreshold: threshold,
          usingDefault: 0.1,
        }
      );
      return 0.1;
    }
    return threshold;
  }, [threshold]);

  const [displayCount, setDisplayCount] = useState(batchSize);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const hasMore = displayCount < totalItems;

  /**
   * Load next batch of items
   * Uses setTimeout for smooth UX and to prevent race conditions
   */
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Small delay for smooth UX and to batch rapid scroll events
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + batchSize, totalItems));
      setIsLoading(false);
    }, 100);
  }, [isLoading, hasMore, batchSize, totalItems]);

  /**
   * Callback ref for sentinel element
   * Handles observer setup/cleanup with proper dependency tracking
   */
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Don't observe if no more items (performance optimization)
      if (!hasMore) return;

      // Don't observe if currently loading (prevent duplicate requests)
      if (isLoading) return;

      // No node to observe
      if (!node) return;

      // Create new observer with validated threshold
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore) {
            loadMore();
          }
        },
        {
          root,
          rootMargin,
          threshold: safeThreshold(),
        }
      );

      // Start observing
      observerRef.current.observe(node);
    },
    [hasMore, isLoading, loadMore, root, rootMargin, safeThreshold]
  );

  /**
   * Reset to initial state
   * Useful when filters/search changes
   */
  const reset = useCallback(() => {
    setDisplayCount(batchSize);
    setIsLoading(false);
  }, [batchSize]);

  /**
   * Cleanup observer on unmount
   * Prevents memory leaks
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    displayCount,
    isLoading,
    hasMore,
    sentinelRef,
    reset,
  };
}
