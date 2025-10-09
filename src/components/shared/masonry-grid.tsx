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
 * PERFORMANCE:
 * - Lightweight: Only calculates when content changes
 * - Efficient: Uses native ResizeObserver API
 * - No layout thrashing: Batches calculations
 *
 * @module components/shared/masonry-grid
 */

import { type ReactNode, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const resizeGridItem = (item: Element) => {
      const content = item.querySelector('[data-grid-content]') as HTMLElement;
      if (!content) return;

      const rowHeight = 1;
      const rowGap = gap;

      // Reset first to get accurate measurement
      (item as HTMLElement).style.gridRowEnd = 'auto';

      // Force reflow to ensure accurate height
      content.offsetHeight;

      const contentHeight = content.getBoundingClientRect().height;
      const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));

      (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
    };

    const resizeAllGridItems = () => {
      const items = grid.querySelectorAll('[data-grid-item]');
      items.forEach(resizeGridItem);
    };

    // Use RAF for initial calculation
    let rafId: number;
    const scheduleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(resizeAllGridItems);
    };

    // Initial resize
    scheduleResize();

    // Handle window resize
    window.addEventListener('resize', scheduleResize);

    // Use ResizeObserver for each grid item
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        resizeGridItem(entry.target);
      });
    });

    // Observe all grid items
    const gridItems = grid.querySelectorAll('[data-grid-item]');
    for (const item of gridItems) {
      observer.observe(item);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleResize);
      observer.disconnect();
    };
  }, [gap]);

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
