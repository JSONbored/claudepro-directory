/**
 * Fade Text Animation Variants
 *
 * Fade-in text animation presets.
 * Simple, elegant text reveals.
 *
 * @module web-runtime/design-system/text/fade
 */

/**
 * Fade Text Animation Variants
 */
export const FADE = {
  /**
   * Fade with slight downward movement
   * Creates: Fade + subtle drop
   */
  down: {
    from: {
      opacity: 0,
      y: -20,
    },
    to: {
      opacity: 1,
      y: 0,
    },
  },

  /**
   * Default fade animation
   * Creates: Simple fade-in from transparent to opaque
   */
  from: {
    opacity: 0,
  },

  /**
   * Default fade animation - Target
   */
  to: {
    opacity: 1,
  },

  /**
   * Fade with slight upward movement
   * Creates: Fade + subtle lift for premium feel
   */
  up: {
    from: {
      opacity: 0,
      y: 20,
    },
    to: {
      opacity: 1,
      y: 0,
    },
  },
} as const;
