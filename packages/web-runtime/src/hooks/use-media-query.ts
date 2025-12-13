'use client';

import { useEffect, useState } from 'react';

/**
 * Options for useMediaQuery hook
 */
export interface UseMediaQueryOptions {
  /**
   * Default value returned on server or before initialization
   * @default false
   */
  defaultValue?: boolean;
  /**
   * Whether to initialize with actual media query state
   * Set to `false` for SSR to prevent hydration mismatches
   * @default true
   */
  initializeWithValue?: boolean;
}

/**
 * React hook for responsive design with real-time media query tracking.
 *
 * Uses the native `matchMedia` API for efficient breakpoint detection and automatically
 * updates when media query state changes. Handles SSR gracefully to prevent hydration
 * mismatches.
 *
 * **When to use:**
 * - ✅ Responsive components - Show/hide components based on screen size
 * - ✅ User preferences - Detect dark mode, reduced motion, or high contrast settings
 * - ✅ Navigation patterns - Mobile hamburger menus vs desktop navigation bars
 * - ✅ Conditional rendering - Different layouts for mobile vs desktop experiences
 * - ✅ Accessibility features - Adapt behavior based on user motion preferences
 * - ✅ Device detection - Portrait/landscape orientation and touch capability
 * - ❌ For basic responsive styling - CSS media queries are usually better
 *
 * **Performance:**
 * - Uses native `matchMedia` API optimized by browsers
 * - Only fires when media query state actually changes (not on every resize)
 * - Much better performance than manual `window.innerWidth` checks with resize listeners
 *
 * **SSR Safety:**
 * - Set `initializeWithValue: false` for SSR to prevent hydration mismatches
 * - Returns `defaultValue` during SSR, updates after client hydration
 *
 * @param query - Media query string (e.g., `'(min-width: 768px)'`)
 * @param options - Configuration options
 * @returns Boolean indicating whether the media query currently matches
 *
 * @example
 * ```tsx
 * // Responsive component visibility
 * const isMobile = useMediaQuery('(max-width: 768px)');
 *
 * {isMobile ? <MobileNav /> : <DesktopNav />}
 * ```
 *
 * @example
 * ```tsx
 * // Dark mode detection
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * {prefersDark && <DarkModeIndicator />}
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe usage
 * const isDesktop = useMediaQuery('(min-width: 1024px)', {
 *   defaultValue: false,
 *   initializeWithValue: false,
 * });
 *
 * if (isDesktop === undefined) return <Loading />;
 * ```
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const { defaultValue = false, initializeWithValue = true } = options;

  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    if (!initializeWithValue) {
      return defaultValue;
    }

    try {
      return window.matchMedia(query).matches;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const mediaQuery = window.matchMedia(query);
      const handler = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Set initial value
      setMatches(mediaQuery.matches);

      // Listen for changes
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
      }
    } catch {
      // Invalid query or unsupported browser
      setMatches(defaultValue);
      return;
    }
  }, [query, defaultValue]);

  return matches;
}
