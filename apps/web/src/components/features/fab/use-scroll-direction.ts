/**
 * Scroll Direction Hook
 *
 * Performance-optimized scroll tracking with rAF throttling.
 * Tracks scroll direction, position, and visibility threshold.
 *
 * Features:
 * - requestAnimationFrame throttling (prevents excessive re-renders)
 * - Passive event listeners (better scroll performance)
 * - Hysteresis for direction changes (prevents jittery behavior)
 * - Error boundary for scroll handlers
 *
 * @module components/features/fab/use-scroll-direction
 */

'use client';

import { getTimeoutConfig, logClientWarning, logger, normalizeError } from '@heyclaude/web-runtime';
import { useEffect, useState } from 'react';
import type { ScrollState } from '@/src/lib/types/component.types';

// Default values (will be overridden by Dynamic Config)
let DEFAULT_SCROLL_THRESHOLD = 100;
let DEFAULT_SCROLL_HYSTERESIS = 50;

// Load config from Statsig on module initialization
getTimeoutConfig({})
  .then((result) => {
    if (result?.data) {
      const config = result.data;
      DEFAULT_SCROLL_THRESHOLD = config['timeout.ui.scroll_direction_threshold_px'];
      DEFAULT_SCROLL_HYSTERESIS = config['timeout.ui.scroll_hysteresis_px'];
    }
  })
  .catch((error) => {
    logClientWarning('useScrollDirection: failed to load timeout config', error);
  });

interface UseScrollDirectionOptions {
  /** Scroll threshold to show/hide FAB (px) */
  threshold?: number;
  /** Hysteresis to prevent jitter (px) */
  hysteresis?: number;
}

/**
 * Hook to track scroll direction and visibility state
 * Reuses optimization patterns from BackToTopButton
 */
export function useScrollDirection({
  threshold = DEFAULT_SCROLL_THRESHOLD,
  hysteresis = DEFAULT_SCROLL_HYSTERESIS,
}: UseScrollDirectionOptions = {}): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    isScrollingDown: false,
    isPastThreshold: false,
    isVisible: true, // Start visible
  });

  useEffect(() => {
    let rafId: number | null = null;
    let prevScrollY = window.scrollY;

    const handleScroll = () => {
      try {
        // Cancel pending frame to debounce
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        // Schedule update for next animation frame
        rafId = requestAnimationFrame(() => {
          try {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - prevScrollY;

            // Only update if scroll delta exceeds hysteresis (prevents jitter)
            if (Math.abs(scrollDelta) < hysteresis) {
              return;
            }

            const isScrollingDown = scrollDelta > 0;
            const isPastThreshold = currentScrollY > threshold;

            // FAB visible when:
            // 1. Scrolling up
            // 2. OR at top of page (< threshold)
            const isVisible = !(isScrollingDown && isPastThreshold);

            setScrollState((prev) => {
              // Only update if state actually changed (prevents unnecessary re-renders)
              if (
                prev.scrollY === currentScrollY &&
                prev.isScrollingDown === isScrollingDown &&
                prev.isPastThreshold === isPastThreshold &&
                prev.isVisible === isVisible
              ) {
                return prev;
              }

              return {
                scrollY: currentScrollY,
                isScrollingDown,
                isPastThreshold,
                isVisible,
              };
            });

            prevScrollY = currentScrollY;
          } catch (error) {
            const normalized = normalizeError(error, '[useScrollDirection] Error in rAF callback');
            logger.error('[useScrollDirection] Error in rAF callback', normalized);
          }
        });
      } catch (error) {
        const normalized = normalizeError(error, '[useScrollDirection] Error in scroll handler');
        logger.error('[useScrollDirection] Error in scroll handler', normalized);
      }
    };

    // Check initial scroll position
    try {
      handleScroll();
    } catch (error) {
      const normalized = normalizeError(
        error,
        '[useScrollDirection] Error in initial scroll check'
      );
      logger.error('[useScrollDirection] Error in initial scroll check', normalized);
    }

    // Passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [threshold, hysteresis]);

  return scrollState;
}
