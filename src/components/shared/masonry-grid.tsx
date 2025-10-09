'use client';

/**
 * MasonryGrid Component
 *
 * Reusable masonry grid layout for consistent card spacing across the site.
 * Extracted from InfiniteScrollContainer to eliminate spacing/display issues.
 *
 * PROBLEM SOLVED:
 * - Featured sections had uneven card spacing (simple grid)
 * - Search/tabs sections had perfect spacing (masonry grid)
 * - This component provides consistent masonry layout sitewide
 *
 * TECHNICAL APPROACH:
 * - Uses auto-rows-[1px] for fine-grained row control
 * - Calculates grid-row-end dynamically based on content height
 * - ResizeObserver tracks size changes and recalculates
 * - Responsive: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Image load detection: Waits for all images to load before calculating
 * - Debounced ResizeObserver: Batches callbacks to prevent cascade
 * - IntersectionObserver: Only calculates visible cards initially
 * - Cached measurements: Prevents unnecessary recalculations
 * - RAF scheduling: Aligns with browser render cycle
 *
 * @module components/shared/masonry-grid
 */

import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { cn } from '@/src/lib/utils';

export interface MasonryGridProps<T> {
  /**
   * Array of items to render
   */
  items: T[];

  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => ReactNode;

  /**
   * Key extractor function
   * @default (item, index) => `item-${index}`
   */
  keyExtractor?: (item: T, index: number) => string;

  /**
   * Additional CSS classes for the grid container
   */
  className?: string;

  /**
   * Gap size between items (in px)
   * @default 24 (gap-6)
   */
  gap?: number;

  /**
   * Whether to use error boundaries around items
   * @default true
   */
  useErrorBoundary?: boolean;
}

/**
 * MasonryGrid component
 *
 * Provides consistent masonry layout with automatic height calculation.
 * Eliminates spacing issues by dynamically spanning rows based on content height.
 *
 * @param props - Component props
 * @returns Masonry grid with properly spaced cards
 *
 * @example
 * ```tsx
 * <MasonryGrid
 *   items={configs}
 *   renderItem={(config) => <ConfigCard item={config} />}
 *   keyExtractor={(config) => config.slug}
 * />
 * ```
 */
export function MasonryGrid<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  gap = 24,
  useErrorBoundary = true,
}: MasonryGridProps<T>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemHeightsRef = useRef<Map<Element, number>>(new Map());
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Memoized resize function with caching to prevent unnecessary recalculations
  const resizeGridItem = useCallback(
    (item: Element) => {
      const content = item.querySelector('[data-grid-content]') as HTMLElement;
      if (!content) return;

      const rowHeight = 1;
      const rowGap = gap;

      // Reset first to get accurate measurement
      (item as HTMLElement).style.gridRowEnd = 'auto';

      // Force reflow to ensure accurate height
      content.offsetHeight;

      const contentHeight = content.getBoundingClientRect().height;

      // Check cache to avoid unnecessary DOM writes
      const cachedHeight = itemHeightsRef.current.get(item);
      if (cachedHeight === contentHeight) {
        // Height hasn't changed, restore previous span
        const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
        (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
        return;
      }

      // Update cache
      itemHeightsRef.current.set(item, contentHeight);

      const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
      (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
    },
    [gap]
  );

  // Debounced resize handler to batch multiple ResizeObserver callbacks
  const debouncedResizeAllItems = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const grid = gridRef.current;
      if (!grid) return;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const gridItems = grid.querySelectorAll('[data-grid-item]');
        gridItems.forEach(resizeGridItem);
      });
    }, 100); // 100ms debounce to batch rapid changes
  }, [resizeGridItem]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Clear cache when items change
    itemHeightsRef.current.clear();

    const resizeAllGridItems = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const gridItems = grid.querySelectorAll('[data-grid-item]');
        gridItems.forEach(resizeGridItem);
      });
    };

    // Wait for all images to load before initial calculation
    const waitForImages = async () => {
      const images = grid.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', () => resolve(null));
          img.addEventListener('error', () => resolve(null)); // Resolve even on error
        });
      });

      await Promise.all(imagePromises);
      resizeAllGridItems();
    };

    // Initial calculation after images load
    waitForImages().catch(() => {
      // Silently handle image load errors - layout will still work
    });

    // Handle window resize with debouncing
    window.addEventListener('resize', debouncedResizeAllItems);

    // Use ResizeObserver for each grid item with debouncing
    const observer = new ResizeObserver((entries) => {
      // Batch all resize events together
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
          entries.forEach((entry) => {
            resizeGridItem(entry.target);
          });
        });
      }, 50); // 50ms debounce for ResizeObserver to prevent cascades
    });

    // Use IntersectionObserver to only calculate visible items initially
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start observing this item for resizes
            observer.observe(entry.target);
            // Calculate initial layout
            resizeGridItem(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // Start calculating 50px before item enters viewport
        threshold: 0,
      }
    );

    // Observe all grid items for visibility
    const gridItems = grid.querySelectorAll('[data-grid-item]');
    for (const item of gridItems) {
      intersectionObserver.observe(item);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('resize', debouncedResizeAllItems);
      observer.disconnect();
      intersectionObserver.disconnect();
      itemHeightsRef.current.clear();
    };
  }, [resizeGridItem, debouncedResizeAllItems]);

  return (
    <div
      ref={gridRef}
      className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[1px]', className)}
      style={{ gap: `${gap}px` }}
    >
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : `item-${index}`;
        const content = renderItem(item, index);

        return (
          <div key={key} data-grid-item>
            <div data-grid-content>
              {useErrorBoundary ? <ErrorBoundary>{content}</ErrorBoundary> : content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
