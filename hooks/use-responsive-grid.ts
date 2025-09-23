import { useCallback, useEffect, useState } from 'react';

interface UseResponsiveGridOptions {
  containerWidth?: number;
  minItemWidth?: number;
  maxItemWidth?: number;
  itemHeight?: number;
  gap?: number;
}

interface ResponsiveGridData {
  itemsPerRow: number;
  actualItemWidth: number;
  containerHeight: number;
  isLoading: boolean;
}

export function useResponsiveGrid(
  itemCount: number,
  options: UseResponsiveGridOptions = {}
): ResponsiveGridData {
  const {
    containerWidth = 1200,
    minItemWidth = 300,
    maxItemWidth = 400,
    itemHeight = 280,
    gap = 24,
  } = options;

  const [gridData, setGridData] = useState<ResponsiveGridData>({
    itemsPerRow: 3,
    actualItemWidth: 350,
    containerHeight: 600,
    isLoading: true,
  });

  const calculateGrid = useCallback(() => {
    // Calculate how many items can fit per row
    const availableWidth = containerWidth - gap;

    // Start with minimum items per row and find optimal fit
    let bestItemsPerRow = 1;
    let bestItemWidth = minItemWidth;

    for (let itemsPerRow = 1; itemsPerRow <= 6; itemsPerRow++) {
      const totalGaps = (itemsPerRow - 1) * gap;
      const itemWidth = (availableWidth - totalGaps) / itemsPerRow;

      if (itemWidth >= minItemWidth && itemWidth <= maxItemWidth) {
        bestItemsPerRow = itemsPerRow;
        bestItemWidth = itemWidth;
      }
    }

    // If no perfect fit, use max items that fit minimum width
    if (bestItemWidth < minItemWidth) {
      bestItemsPerRow = Math.max(1, Math.floor((availableWidth + gap) / (minItemWidth + gap)));
      const totalGaps = (bestItemsPerRow - 1) * gap;
      bestItemWidth = (availableWidth - totalGaps) / bestItemsPerRow;
    }

    // Calculate total height needed
    const rowCount = Math.ceil(itemCount / bestItemsPerRow);
    const totalHeight = rowCount * itemHeight + (rowCount - 1) * gap;

    setGridData({
      itemsPerRow: bestItemsPerRow,
      actualItemWidth: bestItemWidth,
      containerHeight: Math.max(totalHeight, 300),
      isLoading: false,
    });
  }, [containerWidth, minItemWidth, maxItemWidth, itemHeight, gap, itemCount]);

  useEffect(() => {
    calculateGrid();
  }, [calculateGrid]);

  return gridData;
}

// Hook for measuring container width - optimized to prevent forced reflows
export function useContainerWidth(containerRef: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        // Use requestAnimationFrame to batch DOM measurements and prevent forced reflows
        requestAnimationFrame(() => {
          if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
          }
        });
      }
    };

    // Initial measurement with RAF
    updateWidth();

    // Set up resize observer with debounced updates
    let rafId: number;
    const debouncedUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          setWidth(containerRef.current.offsetWidth);
        }
      });
    };

    const resizeObserver = new ResizeObserver(debouncedUpdate);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return width;
}
