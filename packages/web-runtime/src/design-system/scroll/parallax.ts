/**
 * Parallax Effects
 *
 * Parallax animation configurations for scroll-linked movement.
 * Creates depth and visual interest through layered scrolling speeds.
 *
 * @module web-runtime/design-system/scroll/parallax
 */

/**
 * Parallax Effects
 * Speed multipliers: 1 = normal scroll, < 1 = slower, > 1 = faster
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
