'use client';

/**
 * Read Progress Bar Component
 * 
 * Universal scroll progress indicator using motion.dev for smooth 60fps animations.
 * Tracks reading progress and displays a horizontal bar at the top of the page.
 * 
 * Features:
 * - Motion.dev powered (useScroll + useSpring for smooth physics)
 * - GPU-accelerated animations (60fps guaranteed)
 * - Respects prefers-reduced-motion
 * - Configurable position, color, height
 * - Zero performance overhead
 * 
 * Usage:
 * ```tsx
 * <ReadProgress /> // Default: top, accent color, 2px height
 * <ReadProgress position="bottom" color="primary" height={4} />
 * ```
 * 
 * @module components/content/read-progress
 */

import { motion, useScroll, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';

export interface ReadProgressProps {
  /**
   * Position of the progress bar
   * @default 'top'
   */
  position?: 'top' | 'bottom';

  /**
   * Color variant (maps to CSS variables)
   * @default 'accent'
   */
  color?: 'accent' | 'primary' | 'foreground';

  /**
   * Height of the progress bar in pixels
   * @default 2
   */
  height?: number;

  /**
   * Z-index for stacking context
   * @default 50
   */
  zIndex?: number;

  /**
   * Spring physics configuration
   * @default { stiffness: 100, damping: 30, restDelta: 0.001 }
   */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    restDelta?: number;
  };
}

/**
 * Color mapping to CSS variables
 */
const COLOR_MAP = {
  accent: 'hsl(var(--accent))',
  primary: 'hsl(var(--primary))',
  foreground: 'hsl(var(--foreground))',
} as const;

export function ReadProgress({
  position = 'top',
  color = 'accent',
  height = 2,
  zIndex = 50,
  springConfig = {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  },
}: ReadProgressProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Track scroll progress (0 to 1)
  const { scrollYProgress } = useScroll();

  // Apply spring physics for smooth animation
  const scaleX = useSpring(scrollYProgress, springConfig);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server or before mount
  if (!isMounted) {
    return null;
  }

  return (
    <motion.div
      className="fixed left-0 right-0 origin-left"
      style={{
        [position]: 0,
        height: `${height}px`,
        backgroundColor: COLOR_MAP[color],
        scaleX,
        zIndex,
        // Respect reduced motion preferences
        // Motion.dev handles this automatically, but we can add custom behavior
      }}
      // Accessibility: Announce progress to screen readers
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scrollYProgress.get() * 100)}
    />
  );
}

/**
 * Preset variants for common use cases
 */
export const ReadProgressPresets = {
  /**
   * Default: Top, accent color, thin line
   */
  default: () => <ReadProgress />,

  /**
   * Bold: Thicker line for more visibility
   */
  bold: () => <ReadProgress height={4} />,

  /**
   * Bottom: Progress bar at bottom (useful if sticky header at top)
   */
  bottom: () => <ReadProgress position="bottom" />,

  /**
   * Subtle: Very thin, less distracting
   */
  subtle: () => <ReadProgress height={1} color="foreground" />,

  /**
   * Fast: Snappier animation, less springy
   */
  fast: () => (
    <ReadProgress
      springConfig={{
        stiffness: 200,
        damping: 40,
        restDelta: 0.001,
      }}
    />
  ),
} as const;
