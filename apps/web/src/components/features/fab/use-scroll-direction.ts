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

import { getTimeoutConfig } from '@heyclaude/web-runtime/data';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type ScrollState } from '@heyclaude/web-runtime/types/component.types';
import { useEffect, useState } from 'react';

// Load config values at module initialization (sync) with fallbacks
const timeoutConfig = getTimeoutConfig();
const DEFAULT_SCROLL_THRESHOLD = timeoutConfig?.['timeout.ui.scroll_direction_threshold_px'] ?? 300;
const DEFAULT_SCROLL_HYSTERESIS = timeoutConfig?.['timeout.ui.scroll_hysteresis_px'] ?? 10;

interface UseScrollDirectionOptions {
  /** Hysteresis to prevent jitter (px) */
  hysteresis?: number;
  /** Scroll threshold to show/hide FAB (px) */
  threshold?: number;
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
    let rafId: null | number = null;
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
            logClientError(
              '[useScrollDirection] Error in rAF callback',
              normalized,
              'useScrollDirection.handleScroll',
              {
                component: 'useScrollDirection',
                action: 'raf-callback',
              }
            );
          }
        });
      } catch (error) {
        const normalized = normalizeError(error, '[useScrollDirection] Error in scroll handler');
        logClientError(
          '[useScrollDirection] Error in scroll handler',
          normalized,
          'useScrollDirection.handleScroll',
          {
            component: 'useScrollDirection',
            action: 'scroll-handler',
          }
        );
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
      logClientError(
        '[useScrollDirection] Error in initial scroll check',
        normalized,
        'useScrollDirection.init',
        {
          component: 'useScrollDirection',
          action: 'initial-check',
        }
      );
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
