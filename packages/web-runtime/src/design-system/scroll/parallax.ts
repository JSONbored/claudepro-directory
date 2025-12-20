/**
 * Parallax Effects
 *
 * Parallax animation configurations for scroll-linked movement.
 * Creates depth and visual interest through layered scrolling speeds.
 *
 * ⚠️ ACCESSIBILITY WARNING: Parallax effects can cause motion sickness.
 * Always check `useReducedMotion()` before applying parallax transforms.
 * When reduced motion is enabled, disable parallax or use opacity-only transitions.
 *
 * @module web-runtime/design-system/scroll/parallax
 * @see useReducedMotion
 */

/**
 * Parallax Effects
 * Speed multipliers: 1 = normal scroll, < 1 = slower, > 1 = faster
 *
 * @example
 * ```tsx
 * const shouldReduceMotion = useReducedMotion();
 * const { scrollY } = useScroll();
 * const y = useTransform(scrollY, [0, 1000], [0, -200]);
 *
 * return (
 *   <motion.div style={{ y: shouldReduceMotion ? 0 : y }} />
 * );
 * ```
 */
export const PARALLAX = {
  /**
   * Fast parallax - Moves faster than scroll (foreground effect)
   * Best for: Overlay elements, floating cards
   */
  fast: {
    speed: 1.5,
  },

  /**
   * Normal parallax - Moves at scroll speed (no effect)
   */
  normal: {
    speed: 1,
  },

  /**
   * Reverse parallax - Moves opposite to scroll
   * Best for: Special effects, counter-scrolling elements
   */
  reverse: {
    speed: -0.5,
  },

  /**
   * Slow parallax - Moves slower than scroll (background effect)
   * Best for: Background images, hero sections
   */
  slow: {
    speed: 0.5,
  },
} as const;
