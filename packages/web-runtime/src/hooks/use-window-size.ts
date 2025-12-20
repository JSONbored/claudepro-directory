'use client';

import { useEffect, useState } from 'react';

/**
 * Options for useWindowSize hook
 */
export interface UseWindowSizeOptions {
  /**
   * Whether to initialize with actual window dimensions
   * Set to `false` for SSR to prevent hydration mismatches
   * @default true
   */
  initializeWithValue?: boolean;
  /**
   * Debounce delay in milliseconds for resize events
   * Improves performance during rapid window resizing
   */
  debounceDelay?: number;
}

/**
 * Window dimensions object
 */
export interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

/**
 * React hook for tracking window dimensions with automatic resize detection.
 *
 * Provides real-time viewport size tracking with optional debouncing for performance.
 * Handles SSR gracefully to prevent hydration mismatches.
 *
 * **When to use:**
 * - ✅ Dynamic layouts - Adaptive grid systems and component sizing based on viewport
 * - ✅ Canvas and visualization - Charts, maps, and graphics that need precise dimensions
 * - ✅ Mobile-first components - Viewport-aware interfaces with conditional rendering
 * - ✅ Performance optimization - Debounced resize handling for intensive layout calculations
 * - ✅ Breakpoint detection - JavaScript-based responsive behavior beyond CSS capabilities
 * - ✅ Dashboard interfaces - Adaptive admin panels and data visualization layouts
 * - ❌ For basic responsive styling - CSS media queries and viewport units are usually better
 *
 * **Performance:**
 * - Uses `window.innerWidth` and `window.innerHeight` (includes scrollbars)
 * - Optional debouncing prevents excessive re-renders during rapid resize
 * - Automatic cleanup of event listeners on unmount
 *
 * **SSR Safety:**
 * - Set `initializeWithValue: false` for SSR to prevent hydration mismatches
 * - Returns `undefined` dimensions during SSR, updates after client hydration
 *
 * @param options - Configuration options
 * @returns Object with `width` and `height` properties
 *
 * @example
 * ```tsx
 * // Dynamic grid columns
 * const { width } = useWindowSize();
 * const columns = width && width > 1024 ? 4 : width && width > 768 ? 3 : 2;
 *
 * <div className={`grid grid-cols-${columns}`}>...</div>
 * ```
 *
 * @example
 * ```tsx
 * // Canvas sizing
 * const { width, height } = useWindowSize();
 *
 * <canvas width={width ?? 800} height={height ?? 600} />
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe with debouncing
 * const { width, height } = useWindowSize({
 *   initializeWithValue: false,
 *   debounceDelay: 250,
 * });
 *
 * if (!width || !height) return <Loading />;
 * ```
 */
export function useWindowSize(options: UseWindowSizeOptions = {}): WindowSize {
  const { initializeWithValue = true, debounceDelay } = options;

  const [size, setSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return { width: undefined, height: undefined };
    }

    if (!initializeWithValue) {
      return { width: undefined, height: undefined };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    let timeoutId: NodeJS.Timeout | undefined;

    const handleResize = () => {
      if (debounceDelay) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(updateSize, debounceDelay);
      } else {
        updateSize();
      }
    };

    // Set initial size
    if (initializeWithValue) {
      updateSize();
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [initializeWithValue, debounceDelay]);

  return size;
}
