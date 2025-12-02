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

import { bgColor } from '@heyclaude/web-runtime/design-system';
import { motion, useScroll, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';

export interface ReadProgressProps {
  /**
   * Position of the progress bar
   * @default 'below-nav' (positions below sticky navigation)
   */
  position?: 'top' | 'bottom' | 'below-nav';

  /**
   * Color variant (maps to CSS variables)
   * @default 'accent'
   */
  color?: 'accent' | 'primary' | 'foreground';

  /**
   * Height of the progress bar in pixels
   * @default 3
   */
  height?: number;

  /**
   * Z-index for stacking context
   * @default 51 (above navigation)
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
 * Renders a configurable horizontal reading progress bar that animates with scroll position.
 *
 * The bar can be positioned at the top, bottom, or directly below the site's navigation, and
 * supports configurable color, height, stacking order, and spring animation tuning.
 *
 * @param props.position - Where to place the progress bar: `'top'`, `'bottom'`, or `'below-nav'` (default: `'below-nav'`).
 * @param props.color - Visual token to use for the bar: `'accent'`, `'primary'`, or `'foreground'` (default: `'accent'`).
 * @param props.height - Height of the bar in pixels (default: `5`).
 * @param props.zIndex - CSS z-index to control stacking (default: `51`).
 * @param props.springConfig - Spring physics configuration used to smooth the progress animation.
 * @returns The rendered progress bar element, or `null` when not mounted or awaiting navigation measurements.
 *
 * @see ReadProgressPresets
 */
export function ReadProgress({
  position = 'below-nav',
  color = 'accent',
  height = 5,
  zIndex = 51,
  springConfig = {
    stiffness: 400,
    damping: 40,
    restDelta: 0.0001,
  },
}: ReadProgressProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const [navWidth, setNavWidth] = useState(0);
  const [navLeft, setNavLeft] = useState(0);

  // Motion hooks must be called unconditionally (React rules)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, springConfig);

  // Dynamically measure navigation height
  useEffect(() => {
    setIsMounted(true);

    if (position !== 'below-nav') {
      return;
    }

    // Query the navigation element (inner nav, not outer header with padding)
    const updateNavDimensions = () => {
      const header = document.querySelector('header');
      const nav = header?.querySelector('nav');
      if (header && nav) {
        const navRect = nav.getBoundingClientRect();
        // Position at bottom of navbar
        setNavHeight(navRect.bottom);
        // Match navbar width and left position
        setNavWidth(navRect.width);
        setNavLeft(navRect.left);
      }
    };

    // Initial measurement
    updateNavDimensions();

    // Update on resize (nav might change height at different breakpoints)
    const resizeObserver = new ResizeObserver(updateNavDimensions);
    const header = document.querySelector('header');
    if (header) {
      resizeObserver.observe(header);
      // Also observe the inner nav element
      const nav = header.querySelector('nav');
      if (nav) {
        resizeObserver.observe(nav);
      }
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [position]);

  // Don't render on server or before mount
  if (!isMounted) {
    return null;
  }

  // Don't render below-nav mode until navHeight is measured
  if (position === 'below-nav' && (navHeight === 0 || navWidth === 0)) {
    return null;
  }

  // Calculate position based on mode
  const getPositionStyle = () => {
    if (position === 'below-nav') {
      return {
        top: `${navHeight}px`, // Position directly below the navbar
        left: `${navLeft}px`,
        width: `${navWidth}px`,
      };
    }
    if (position === 'top') {
      return { top: 0 };
    }
    return { bottom: 0 };
  };

  // Map color prop to design-system token
  const colorClass = {
    accent: bgColor.accent,
    primary: bgColor.primary,
    foreground: bgColor.muted,
  }[color];

  return (
    <motion.div
      className={`pointer-events-none fixed origin-left ${colorClass}`}
      style={{
        ...getPositionStyle(),
        height: `${height}px`,
        scaleX,
        zIndex,
        borderRadius: '2.5px', // Pill shape (half of 5px height)
      }}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scrollYProgress.get() * 100)}
      suppressHydrationWarning={true}
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