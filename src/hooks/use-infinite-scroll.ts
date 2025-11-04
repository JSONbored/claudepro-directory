'use client';

/**
 * useInfiniteScroll Hook - Database-First Configuration
 * Production-grade infinite scroll using Intersection Observer API
 * Loads default batch_size and threshold from app_settings
 *
 * @module hooks/use-infinite-scroll
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';

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
 * Database-First: Loads batchSize and threshold from app_settings with fallbacks
 *
 * @example
 * ```tsx
 * const { displayCount, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
 *   totalItems: items.length,
 *   batchSize: 30, // Optional - falls back to app_settings value
 *   rootMargin: '400px',
 * });
 *
 * const displayedItems = items.slice(0, displayCount);
 * ```
 */
export function useInfiniteScroll({
  totalItems,
  batchSize,
  rootMargin = '400px',
  threshold,
  root = null,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  // Hardcoded fallbacks (loaded from app_settings at mount)
  const [dbDefaults, setDbDefaults] = useState({
    batchSize: 30,
    threshold: 0.1,
  });

  // Load app_settings on mount (background, non-blocking)
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc('get_app_settings', {
          p_category: 'hooks',
        });

        if (data) {
          const settings = data as Record<string, { value: unknown }>;

          setDbDefaults({
            batchSize: (settings['hooks.infinite_scroll.batch_size']?.value as number) ?? 30,
            threshold:
              (settings['hooks.infinite_scroll.load_more_threshold']?.value as number) ?? 0.1,
          });
        }
      } catch {
        // Silent fail - uses hardcoded fallbacks
      }
    };

    loadDefaults().catch(() => {
      // Silent fail - uses hardcoded fallbacks
    });
  }, []);

  // Merge user options with database defaults (user options take precedence)
  const finalBatchSize = batchSize ?? dbDefaults.batchSize;
  const finalThreshold = threshold ?? dbDefaults.threshold;

  // Validate threshold (shadcn-inspired production safety)
  const safeThreshold = useCallback(() => {
    if (finalThreshold < 0 || finalThreshold > 1) {
      logger.warn(
        'Invalid threshold for infinite scroll',
        { component: 'useInfiniteScroll' },
        {
          receivedThreshold: finalThreshold,
          usingDefault: 0.1,
        }
      );
      return 0.1;
    }
    return finalThreshold;
  }, [finalThreshold]);

  const [displayCount, setDisplayCount] = useState(finalBatchSize);
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
      setDisplayCount((prev) => Math.min(prev + finalBatchSize, totalItems));
      setIsLoading(false);
    }, 100);
  }, [isLoading, hasMore, finalBatchSize, totalItems]);

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
    setDisplayCount(finalBatchSize);
    setIsLoading(false);
  }, [finalBatchSize]);

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
