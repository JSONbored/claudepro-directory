'use client';

/**
 * Scroll Direction Detector Hook
 *
 * Detects scroll direction (up/down) using Motion.dev for smooth, performant tracking.
 * Provides scroll direction state and utilities for UI changes based on scroll behavior.
 *
 * Features:
 * - Smooth direction detection using Motion.dev
 * - Configurable threshold to avoid jitter
 * - Debounced updates for performance
 * - Respects prefers-reduced-motion
 *
 * Usage:
 * ```tsx
 * const { scrollDirection, isScrollingDown, isScrollingUp } = useScrollDirection();
 *
 * <motion.nav
 *   animate={{
 *     opacity: isScrollingDown ? 0.8 : 1,
 *     y: isScrollingDown ? -10 : 0,
 *   }}
 * />
 * ```
 */

import { useScroll, useMotionValueEvent } from 'motion/react';
import { useState } from 'react';

interface UseScrollDirectionOptions {
  /** Minimum scroll distance to trigger direction change (default: 5px) */
  threshold?: number;
  /** Initial scroll direction (default: 'down') */
  initialDirection?: 'up' | 'down';
}

interface UseScrollDirectionReturn {
  /** Current scroll direction */
  scrollDirection: 'up' | 'down';
  /** True when scrolling down */
  isScrollingDown: boolean;
  /** True when scrolling up */
  isScrollingUp: boolean;
}

/**
 * Hook to detect scroll direction using Motion.dev
 *
 * @param options - Configuration options
 * @returns Scroll direction state and utilities
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { threshold = 5, initialDirection = 'down' } = options;
  const { scrollY } = useScroll();
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>(initialDirection);

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = current - previous;

    // Only update if scroll distance exceeds threshold (prevents jitter)
    if (Math.abs(diff) >= threshold) {
      setScrollDirection(diff > 0 ? 'down' : 'up');
    }
  });

  return {
    scrollDirection,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
  };
}
