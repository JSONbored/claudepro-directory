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

  // Masonry layout effect - calculates row spans based on content height
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const resizeGridItems = () => {
      const rowGap = gap;
      const rowHeight = 1; // auto-rows-[1px] - Fine-grained control for consistent spacing
      const gridItems = grid.querySelectorAll('[data-grid-item]');

      gridItems.forEach((item) => {
        const content = item.querySelector('[data-grid-content]');
        if (content) {
          const contentHeight = content.getBoundingClientRect().height;
          const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
          (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
        }
      });
    };

    // Initial calculation
    resizeGridItems();

    // Recalculate on window resize
    window.addEventListener('resize', resizeGridItems);

    // Recalculate when items change (using ResizeObserver)
    const observer = new ResizeObserver(resizeGridItems);
    observer.observe(grid);

    return () => {
      window.removeEventListener('resize', resizeGridItems);
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
