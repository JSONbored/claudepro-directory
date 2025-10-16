'use client';

/**
 * Virtualized Grid Component
 * Simple grid virtualization using TanStack Virtual
 *
 * Note: CSS Grid + Virtualization Trade-off
 * - CSS Grid requires items in normal flow (not absolute positioned)
 * - TanStack Virtual works best with absolute positioning
 * - Solution: Simple approach with generous overscan for smooth scrolling
 *
 * @module components/shared/virtualized-grid
 */

import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { memo, type ReactNode, useRef } from 'react';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';

interface VirtualizedGridProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  gap?: number;
  className?: string;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string | number;
  useWindowScroll?: boolean;
}

function WindowVirtualizedGrid<T>({
  items,
  renderItem,
  estimateSize = 400,
  overscan = 10,
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
  });

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={className}>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{
          gap: `${gap}px`,
          minHeight: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          const key = keyExtractor ? keyExtractor(item, virtualItem.index) : virtualItem.index;

          return (
            <ErrorBoundary key={key}>
              <div>{renderItem(item, virtualItem.index)}</div>
            </ErrorBoundary>
          );
        })}
      </div>
    </div>
  );
}

function ElementVirtualizedGrid<T>({
  items,
  renderItem,
  estimateSize = 400,
  overscan = 10,
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
  });

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
        height: '80vh',
        overflow: 'auto',
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{
          gap: `${gap}px`,
          minHeight: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          const key = keyExtractor ? keyExtractor(item, virtualItem.index) : virtualItem.index;

          return (
            <ErrorBoundary key={key}>
              <div>{renderItem(item, virtualItem.index)}</div>
            </ErrorBoundary>
          );
        })}
      </div>
    </div>
  );
}

function VirtualizedGridComponent<T>(props: VirtualizedGridProps<T>) {
  const { useWindowScroll = true, ...restProps } = props;

  if (useWindowScroll) {
    return <WindowVirtualizedGrid {...restProps} />;
  }

  return <ElementVirtualizedGrid {...restProps} />;
}

export const VirtualizedGrid = memo(VirtualizedGridComponent) as typeof VirtualizedGridComponent;
