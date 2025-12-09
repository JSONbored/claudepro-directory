/**
 * Slide Text Animation Variants
 *
 * Slide-in text animation presets.
 * Creates directional text reveals.
 *
 * @module web-runtime/design-system/text/slide
 */

/**
 * Slide Text Animation Variants
 */
export const SLIDE = {
  /**
   * Slide from bottom
   * Creates: Text slides up from bottom
   */
  bottom: {
    from: {
      opacity: 0,
      y: 50,
    },
    to: {
      opacity: 1,
      y: 0,
    },
  },

  /**
   * Slide from left
   * Creates: Text slides in from left side
   */
  left: {
    from: {
      opacity: 0,
      x: -50,
    },
    to: {
      opacity: 1,
      x: 0,
    },
  },

  /**
   * Slide from right
   * Creates: Text slides in from right side
   */
  right: {
    from: {
      opacity: 0,
      x: 50,
    },
    to: {
      opacity: 1,
      x: 0,
    },
  },

  /**
   * Slide from top
   * Creates: Text slides down from top
   */
  top: {
    from: {
      opacity: 0,
      y: -50,
    },
    to: {
      opacity: 1,
      y: 0,
    },
  },
} as const;
