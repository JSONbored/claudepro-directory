/**
 * Color Transitions
 *
 * Smooth color changes for state feedback
 *
 * @module web-runtime/design-system/microinteractions/color-transition
 */

/**
 * Color Transitions
 */
export const COLOR_TRANSITION = {
  /**
   * Default color transition
   */
  default: {
    duration: 0.3,
    ease: 'easeOut',
  },

  /**
   * Fast color transition (for icon state changes)
   */
  fast: {
    duration: 0.2,
    ease: 'easeOut',
  },

  /**
   * Slow color transition (for subtle state changes)
   */
  slow: {
    duration: 0.5,
    ease: 'easeOut',
  },
} as const;
