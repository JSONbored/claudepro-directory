/**
 * Color Transitions
 *
 * Smooth color changes for state feedback
 *
 * @module web-runtime/design-system/microinteractions/color-transition
 */

import { DURATION } from '../animations/duration.ts';

/**
 * Color Transitions
 */
export const COLOR_TRANSITION = {
  /**
   * Default color transition
   */
  default: {
    duration: DURATION.default,
    ease: 'easeOut',
  },

  /**
   * Fast color transition (for icon state changes)
   */
  fast: {
    duration: DURATION.quick,
    ease: 'easeOut',
  },

  /**
   * Slow color transition (for subtle state changes)
   */
  slow: {
    duration: DURATION.moderate,
    ease: 'easeOut',
  },
} as const;
