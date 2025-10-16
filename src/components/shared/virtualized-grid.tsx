'use client';

/**
 * Virtualized Grid Component
 * Production-ready virtualization using TanStack Virtual
 *
 * Features:
 * - Renders only visible items (~15 items) regardless of total count
 * - Constant memory usage and 60fps scroll performance
 * - Responsive grid layout with proper sizing
 * - Dynamic height measurement for variable-sized items
 * - Optimized for large datasets (1000+ items)
 *
 * Architecture:
 * - Headless virtualization (TanStack Virtual)
 * - Type-safe with generics
 * - Stable refs for performance
 * - Production-grade error boundaries
 * - Split components for window vs element scrolling (React hooks rules)
 *
 * @module components/shared/virtualized-grid
 */

import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { memo, type ReactNode, useRef } from 'react';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';

interface VirtualizedGridProps<T> {
  /**
   * Full dataset to virtualize
   * Only visible items will be rendered in DOM
   */
  items: readonly T[];

  /**
   * Render function for each item
   * Called only for visible items
   */
  renderItem: (item: T, index: number) => ReactNode;

  /**
   * Estimated height per item in pixels
   * Used for initial layout calculation
   * Will auto-adjust based on actual measurements
   *
   * @default 400
   */
  estimateSize?: number;

  /**
   * Number of items to render outside viewport
   * Higher = smoother scroll, more memory
   * Lower = less memory, potential flicker
   *
   * @default 5
   */
  overscan?: number;

  /**
   * Gap between grid items in pixels
   *
   * @default 24
   */
  gap?: number;

  /**
   * CSS class for the container
   */
  className?: string;

  /**
   * Message when no items exist
   */
  emptyMessage?: string;

  /**
   * Unique key extractor for items
   * Used for React reconciliation
   */
  keyExtractor?: (item: T, index: number) => string | number;

  /**
   * Use window scrolling instead of container scrolling
   * When true, virtualizes against the main window scroll
   * When false, creates its own scrollable container
   *
   * @default true
   */
  useWindowScroll?: boolean;
}

/**
 * Window-Scrolling Virtualized Grid
 * Uses window scroll (no nested scrollbar)
 */
function WindowVirtualizedGrid<T>({
  items,
  renderItem,
  estimateSize = 400,
  overscan = 5,
  gap = 24,
  className = '',
  emptyMessage = 'No items found',
  keyExtractor,
}: Omit<VirtualizedGridProps<T>, 'useWindowScroll'>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    // Enable dynamic height measurement for variable-sized items
    ...(typeof window !== 'undefined' && 'ResizeObserver' in window
      ? {
          measureElement: (element: Element) =>
            element?.getBoundingClientRect().height ?? estimateSize,
        }
      : {}),
  });

  // Early return for empty state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={className} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            gap: `${gap}px`,
            transform: `translateY(${(virtualItems[0]?.start ?? 0) - (virtualizer.options.scrollMargin ?? 0)}px)`,
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) return null;

            const key = keyExtractor ? keyExtractor(item, virtualRow.index) : virtualRow.key;

            return (
              <ErrorBoundary key={key}>
                <div data-index={virtualRow.index} ref={virtualizer.measureElement}>
                  {renderItem(item, virtualRow.index)}
                </div>
              </ErrorBoundary>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Element-Scrolling Virtualized Grid
 * Creates own scrollable container
 */
function ElementVirtualizedGrid<T>({
  items,
  renderItem,
  estimateSize = 400,
  overscan = 5,
  gap = 24,
  className = '',
  emptyMessage = 'No items found',
  keyExtractor,
}: Omit<VirtualizedGridProps<T>, 'useWindowScroll'>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    // Enable dynamic height measurement for variable-sized items
    ...(typeof window !== 'undefined' && 'ResizeObserver' in window
      ? {
          measureElement: (element: Element) =>
            element?.getBoundingClientRect().height ?? estimateSize,
        }
      : {}),
  });

  // Early return for empty state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: `${Math.min(virtualizer.getTotalSize(), 2000)}px`,
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            gap: `${gap}px`,
            transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) return null;

            const key = keyExtractor ? keyExtractor(item, virtualRow.index) : virtualRow.key;

            return (
              <ErrorBoundary key={key}>
                <div data-index={virtualRow.index} ref={virtualizer.measureElement}>
                  {renderItem(item, virtualRow.index)}
                </div>
              </ErrorBoundary>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component that selects the appropriate virtualizer
 * Follows React hooks rules by using separate components
 */
function VirtualizedGridComponent<T>(props: VirtualizedGridProps<T>) {
  const { useWindowScroll = true, ...restProps } = props;

  if (useWindowScroll) {
    return <WindowVirtualizedGrid {...restProps} />;
  }

  return <ElementVirtualizedGrid {...restProps} />;
}

/**
 * Memoized export to prevent unnecessary re-renders
 * Component only re-renders when items reference changes
 */
export const VirtualizedGrid = memo(VirtualizedGridComponent) as typeof VirtualizedGridComponent;
