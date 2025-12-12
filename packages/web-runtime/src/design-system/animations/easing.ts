/**
 * Easing Presets
 *
 * Cubic bezier easing functions for smooth animations.
 * All values are optimized for natural, premium motion.
 *
 * @module web-runtime/design-system/animations/easing
 */

/**
 * Easing Presets
 */
export const EASING = {
  /**
   * Default easing - Natural ease-out
   * Best for: Most animations
   */
  default: [0.4, 0, 0.2, 1] as const, // ease-out

  /**
   * Emphasized easing - Strong ease-out
   * Best for: Important state changes
   */
  emphasized: [0.2, 0, 0, 1] as const,

  /**
   * Linear easing - No acceleration
   * Best for: Progress bars, loading indicators
   */
  linear: [0, 0, 1, 1] as const,
} as const;
