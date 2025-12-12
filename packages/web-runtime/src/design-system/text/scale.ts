/**
 * Scale Text Animation Variants
 *
 * Scale-in text animation presets.
 * Creates zoom-in text reveals.
 *
 * @module web-runtime/design-system/text/scale
 */

/**
 * Scale Text Animation Variants
 */
export const SCALE = {
  /**
   * Scale down from large
   * Creates: Text shrinks from 120% to 100%
   */
  down: {
    from: {
      opacity: 0,
      scale: 1.2,
    },
    to: {
      opacity: 1,
      scale: 1,
    },
  },

  /**
   * Scale with rotation
   * Creates: Text scales and rotates for playful effect
   */
  rotate: {
    from: {
      opacity: 0,
      rotate: -10,
      scale: 0.8,
    },
    to: {
      opacity: 1,
      rotate: 0,
      scale: 1,
    },
  },

  /**
   * Scale up from small
   * Creates: Text grows from 80% to 100%
   */
  up: {
    from: {
      opacity: 0,
      scale: 0.8,
    },
    to: {
      opacity: 1,
      scale: 1,
    },
  },
} as const;
