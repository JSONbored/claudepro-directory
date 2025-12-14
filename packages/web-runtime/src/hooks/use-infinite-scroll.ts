'use client';

/**
 * useInfiniteScroll Hook
 * Production-grade infinite scroll using Intersection Observer API
 * Loads default batch_size and threshold from static config
 *
 * @module hooks/use-infinite-scroll
 */

import { getHomepageConfigBundle, getTimeoutConfig } from '../config/static-configs.ts';
// Import directly from source files to avoid indirect imports through entries/core.ts
import { logger } from '../logger.ts';
import { useCallback, useState } from 'react';
import { useBoolean } from './use-boolean.ts';
import { useIntersectionObserver } from './use-intersection-observer.ts';

interface UseInfiniteScrollOptions {
  /** Total number of items available */
  totalItems: number;
  /** Number of items to load per batch (default: 30) */
  batchSize?: number;
  /** Root margin for intersection observer - when to trigger load (default: '600px' for prefetching) */
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
 * Database-First: Loads batchSize and threshold from app_settings with fallbacks
 *
 * @example
 * ```tsx
 * const { displayCount, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
 *   totalItems: items.length,
 *   batchSize: 30, // Optional - falls back to app_settings value
 *   rootMargin: '600px',
 * });
 *
 * const displayedItems = items.slice(0, displayCount);
 * ```
 */
export function useInfiniteScroll({
  totalItems,
  batchSize,
  rootMargin = '600px',
  threshold,
  root = null,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  // Load static config defaults synchronously using lazy initialization
  // This ensures config is loaded before displayCount is initialized
  const [configDefaults] = useState(() => {
    const bundle = getHomepageConfigBundle();
    return {
      batchSize: bundle.appSettings?.['hooks.infinite_scroll.batch_size'] ?? 30,
      threshold: bundle.appSettings?.['hooks.infinite_scroll.threshold'] ?? 0.1,
    };
  });

  // Merge user options with config defaults (user options take precedence)
  const finalBatchSize = batchSize ?? configDefaults.batchSize;
  const finalThreshold = threshold ?? configDefaults.threshold;

  // Validate threshold (shadcn-inspired production safety)
  const safeThreshold = useCallback(() => {
    if (finalThreshold < 0 || finalThreshold > 1) {
      logger.warn(
        {
          component: 'useInfiniteScroll',
          receivedThreshold: finalThreshold,
          usingDefault: 0.1,
        },
        'Invalid threshold for infinite scroll'
      );
      return 0.1;
    }
    return finalThreshold;
  }, [finalThreshold]);

  const [displayCount, setDisplayCount] = useState(finalBatchSize);
  const { value: isLoading, setTrue: setIsLoadingTrue, setFalse: setIsLoadingFalse } = useBoolean();

  const hasMore = displayCount < totalItems;

  /**
   * Load next batch of items
   * Uses setTimeout for smooth UX and to prevent race conditions
   */
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoadingTrue();

    // Get timeout config from static defaults
    const config = getTimeoutConfig();
    const delay = config['timeout.ui.transition_ms'] ?? 200;
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + finalBatchSize, totalItems));
      setIsLoadingFalse();
    }, delay);
  }, [finalBatchSize, hasMore, isLoading, totalItems, setIsLoadingTrue, setIsLoadingFalse]);

  // Use useIntersectionObserver hook for uniform implementation
  const { ref: sentinelRef } = useIntersectionObserver({
    threshold: safeThreshold(),
    root,
    rootMargin,
    initialIsIntersecting: false,
    // Use onChange to conditionally load more (respects hasMore and isLoading)
    onChange: (isIntersecting) => {
      if (isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
  });

  /**
   * Reset to initial state
   * Useful when filters/search changes
   */
  const reset = useCallback(() => {
    setDisplayCount(finalBatchSize);
    setIsLoadingFalse();
  }, [finalBatchSize, setIsLoadingFalse]);

  return {
    displayCount,
    isLoading,
    hasMore,
    sentinelRef,
    reset,
  };
}
