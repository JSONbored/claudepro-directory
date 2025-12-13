'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Box model types for ResizeObserver
 */
export type BoxModel = 'content-box' | 'border-box' | 'device-pixel-content-box';

/**
 * Element size object
 */
export interface Size {
  width: number | undefined;
  height: number | undefined;
}

/**
 * Options for useResizeObserver hook
 */
export interface UseResizeObserverOptions<T extends HTMLElement> {
  /**
   * React ref of the element to observe
   */
  ref: RefObject<T>;
  /**
   * Callback for handling resize events (prevents re-renders)
   */
  onResize?: (size: Size) => void;
  /**
   * Box model to use for measurements
   * @default 'content-box'
   */
  box?: BoxModel;
}

/**
 * React hook for element resize detection using ResizeObserver API.
 *
 * Efficiently tracks element size changes using the native browser API. Much better
 * performance than window resize listeners or manual getBoundingClientRect() polling.
 *
 * **When to use:**
 * - ✅ Responsive charts - Resize data visualizations when container dimensions change
 * - ✅ Adaptive grids - Adjust column counts and layouts based on available space
 * - ✅ Modal positioning - Reposition dialogs and popovers when content size changes
 * - ✅ Canvas scaling - Maintain aspect ratios and pixel density for graphics rendering
 * - ✅ Dynamic typography - Adjust font sizes based on container width constraints
 * - ✅ Masonry layouts - Recalculate item positions when container or item sizes change
 * - ❌ For basic responsive design - CSS media queries are usually better
 *
 * **Features:**
 * - Uses native ResizeObserver API (browser-optimized)
 * - Multiple box models: 'content-box', 'border-box', 'device-pixel-content-box'
 * - Optional callback to prevent re-renders (for performance)
 * - Automatic cleanup on unmount
 * - SSR compatible with proper fallbacks
 *
 * **Performance:**
 * - ResizeObserver is optimized by browsers
 * - Only fires when size actually changes (not on every scroll/resize)
 * - Much better than window resize listeners or manual DOM measurements
 *
 * @typeParam T - Type of the HTML element
 * @param options - Configuration options
 * @returns Object with `width` and `height` properties
 *
 * @example
 * ```tsx
 * // Basic usage
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { width, height } = useResizeObserver({
 *   ref: containerRef,
 * });
 *
 * <div ref={containerRef}>
 *   Size: {width} x {height}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // With callback (prevents re-renders)
 * const containerRef = useRef<HTMLDivElement>(null);
 * useResizeObserver({
 *   ref: containerRef,
 *   onResize: ({ width, height }) => {
 *     // Update canvas or chart without re-rendering component
 *     chart.resize(width, height);
 *   },
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Different box models
 * const { width, height } = useResizeObserver({
 *   ref: elementRef,
 *   box: 'border-box', // Includes padding and border
 * });
 * ```
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: UseResizeObserverOptions<T>
): Size {
  const { ref, onResize, box = 'content-box' } = options;
  const [size, setSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Check if ResizeObserver is available
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (!entry) return;
      
      let width: number | undefined;
      let height: number | undefined;

      if (box === 'border-box') {
        width = entry.borderBoxSize?.[0]?.inlineSize;
        height = entry.borderBoxSize?.[0]?.blockSize;
      } else if (box === 'device-pixel-content-box') {
        width = entry.devicePixelContentBoxSize?.[0]?.inlineSize;
        height = entry.devicePixelContentBoxSize?.[0]?.blockSize;
      } else {
        width = entry.contentBoxSize?.[0]?.inlineSize;
        height = entry.contentBoxSize?.[0]?.blockSize;
      }

      // Fallback to contentRect for older browsers
      if (width === undefined || height === undefined) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      }

      const newSize = { width, height };

      if (onResize) {
        onResize(newSize);
      } else {
        setSize(newSize);
      }
    });

    observer.observe(element, { box });

    return () => {
      observer.disconnect();
    };
  }, [ref, box, onResize]);

  return size;
}
