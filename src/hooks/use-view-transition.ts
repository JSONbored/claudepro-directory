/**
 * View Transitions API Hook
 *
 * Provides a type-safe, reusable interface for the View Transitions API
 * with automatic feature detection and progressive enhancement.
 *
 * Features:
 * - Browser support detection
 * - Progressive enhancement (graceful fallback)
 * - Type-safe API
 * - Reusable across components
 *
 * @example
 * ```typescript
 * const { startTransition, isSupported } = useViewTransition();
 *
 * const handleThemeChange = () => {
 *   startTransition(() => {
 *     setTheme(newTheme);
 *     document.documentElement.setAttribute('data-theme', newTheme);
 *   });
 * };
 * ```
 *
 * Browser Support:
 * - Chrome/Edge 111+: Full animation support
 * - Firefox/Safari: Instant fallback (no animation)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */

'use client';

import { useCallback, useMemo } from 'react';

interface UseViewTransitionReturn {
  /**
   * Whether the View Transitions API is supported in the current browser
   */
  isSupported: boolean;

  /**
   * Starts a view transition with the given update callback.
   * Falls back to immediate execution if API is not supported.
   *
   * @param updateCallback Function that updates the DOM
   * @returns ViewTransition object (if supported) or undefined
   */
  startTransition: (updateCallback: () => void | Promise<void>) => ViewTransition | undefined;
}

export function useViewTransition(): UseViewTransitionReturn {
  /**
   * Feature detection for View Transitions API
   * Memoized to avoid repeated checks
   */
  const isSupported = useMemo(() => {
    // Server-side rendering check
    if (typeof document === 'undefined') {
      return false;
    }

    // Check for View Transitions API support
    return 'startViewTransition' in document;
  }, []);

  /**
   * Start a view transition with progressive enhancement
   * If API is not supported, immediately executes the callback
   */
  const startTransition = useCallback(
    (updateCallback: () => void | Promise<void>): ViewTransition | undefined => {
      // Fallback: Execute immediately without animation
      if (!isSupported) {
        Promise.resolve(updateCallback()).catch(() => {
          // Silently handle errors in fallback mode
        });
        return undefined;
      }

      // Use View Transitions API
      try {
        return document.startViewTransition(updateCallback);
      } catch (error) {
        // Fallback on error (suppress console warning in production)
        if (process.env.NODE_ENV === 'development') {
          // biome-ignore lint/suspicious/noConsole: Development-only warning for debugging view transitions
          console.warn('View Transition failed, falling back to instant update:', error);
        }
        Promise.resolve(updateCallback()).catch(() => {
          // Silently handle errors in fallback mode
        });
        return undefined;
      }
    },
    [isSupported]
  );

  return {
    isSupported,
    startTransition,
  };
}
