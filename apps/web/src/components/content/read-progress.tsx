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
 * - Configurable position, color, height, zIndex
 * - Zero performance overhead
 *
 * Usage:
 * ```tsx
 * <ReadProgress /> // Default: below navigation, accent color, 5px height
 * <ReadProgress position="bottom" color="primary" height={4} />
 * ```
 *
 * @module components/content/read-progress
 */

import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion, useScroll } from 'motion/react';
import { useSpring } from '@heyclaude/web-runtime/hooks/motion';
import { useEffect, useState } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

export interface ReadProgressProps {
  /**
   * Color variant (maps to CSS variables)
   * @default 'accent'
   */
  color?: 'accent' | 'foreground' | 'primary';

  /**
   * Height of the progress bar in pixels
   * @default 5
   */
  height?: number;

  /**
   * Position of the progress bar
   * @default 'below-nav' (positions below sticky navigation)
   */
  position?: 'below-nav' | 'bottom' | 'top';

  /**
   * Spring physics configuration
   * @default { ...SPRING.scroll, restDelta: 0.0001 }
   */
  springConfig?: {
    damping?: number;
    restDelta?: number;
    stiffness?: number;
  };

  /**
   * Z-index for stacking context
   * @default 51 (above navigation at z-50)
   */
  zIndex?: number;
}

/**
 * Render a smooth, configurable reading progress bar fixed to the top, bottom, or immediately below the site navigation.
 *
 * The bar animates its horizontal scale using a spring tied to the page scroll position and respects reduced-motion preferences via the provided spring configuration.
 *
 * @param position - Where to place the bar. 'below-nav' positions it directly under the site's <header> > <nav>, 'top' pins to the page top, 'bottom' pins to the page bottom. @default 'below-nav'
 * @param height - Height of the progress bar in pixels. @default 5
 * @param color - Visual color token to apply: 'accent', 'foreground', or 'primary'. Maps to corresponding background utility classes. @default 'accent'
 * @param zIndex - CSS z-index value applied to the bar. @default 51
 * @param springConfig - Spring physics controlling the smoothness of the scale animation. Provide `stiffness`, `damping`, and `restDelta` to tune responsiveness. Defaults to `{ ...SPRING.scroll, restDelta: 0.0001 }`
 * @returns The progress bar React element that visually represents reading progress as a percentage (0–100) via its horizontal scale.
 *
 * @see ReadProgressPresets
 */
export function ReadProgress({
  position = 'below-nav',
  height = 5,
  color = 'accent',
  zIndex = 51,
  springConfig = {
    ...SPRING.scroll,
    restDelta: 0.0001,
  },
}: ReadProgressProps) {
  // ALL hooks must be called unconditionally before any early returns (Rules of Hooks)
  const { value: isMounted, setTrue: setIsMountedTrue } = useBoolean();
  const [navHeight, setNavHeight] = useState(0);
  const [navWidth, setNavWidth] = useState(0);
  const [navLeft, setNavLeft] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Motion hooks must be called unconditionally (React rules)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, springConfig);

  // ALL useEffect hooks must be called unconditionally before any early returns (Rules of Hooks)
  // Dynamically measure navigation height
  useEffect(() => {
    setIsMountedTrue();

    if (position !== 'below-nav') {
      return;
    }

    // Query the navigation element (inner nav, not outer header with padding)
    // Batch DOM reads to avoid forced reflows
    const updateNavDimensions = () => {
      // Use requestAnimationFrame to batch with browser's layout cycle
      requestAnimationFrame(() => {
        const header = document.querySelector('header');
        const nav = header?.querySelector('nav');
        if (header && nav) {
          // Batch all DOM reads together
          const navRect = nav.getBoundingClientRect();
          // Position at bottom of navbar
          setNavHeight(navRect.bottom);
          // Match navbar width and left position
          setNavWidth(navRect.width);
          setNavLeft(navRect.left);
        }
      });
    };

    // Initial measurement (defer to next frame to avoid blocking)
    requestAnimationFrame(updateNavDimensions);

    // Update on resize (nav might change height at different breakpoints)
    // ResizeObserver already batches, but we wrap in requestAnimationFrame for consistency
    const resizeObserver = new ResizeObserver(() => {
      updateNavDimensions();
    });
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

  // Update progress value in effect to avoid hydration mismatch
  // This effect must be called unconditionally (before any early returns)
  useEffect(() => {
    if (!isMounted) return;
    
    const updateProgress = () => {
      setCurrentProgress(Math.round(scrollYProgress.get() * 100));
    };
    updateProgress();
    // Subscribe to scroll progress changes
    const unsubscribe = scrollYProgress.on('change', updateProgress);
    return () => unsubscribe();
  }, [scrollYProgress, isMounted, setIsMountedTrue]);

  // Don't render on server or before mount
  // This prevents hydration mismatches by ensuring server and client both render null initially
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

  // Compute color class from color prop
  const colorClass =
    color === 'primary' ? 'bg-primary' : color === 'foreground' ? 'bg-foreground' : 'bg-accent';

  return (
    <motion.div
      className={`${colorClass} pointer-events-none fixed origin-left rounded-[2.5px]`}
      style={{
        ...getPositionStyle(),
        height: `${height}px`,
        scaleX: shouldReduceMotion ? 1 : scaleX,
        zIndex,
        // GPU acceleration hint for smooth progress bar animation
        willChange: shouldReduceMotion ? 'auto' : 'transform',
      }}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={currentProgress}
      suppressHydrationWarning
    />
  );
}

/**
 * Preset variants for common use cases
 */
export const ReadProgressPresets = {
  /**
   * Default: Below navigation, accent color, 5px height
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
        ...SPRING.scroll,
        restDelta: 0.001,
      }}
    />
  ),
} as const;

// Explicit default export for better module resolution
// This helps Turbopack properly resolve the client component reference
export default ReadProgress;