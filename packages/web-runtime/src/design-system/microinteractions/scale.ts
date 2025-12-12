/**
 * Scale Animations
 *
 * Reusable scale values for consistent sizing
 *
 * @module web-runtime/design-system/microinteractions/scale
 */

/**
 * Scale Animations
 */
export const SCALE = {
  /**
   * Default scale (for button hover)
   */
  default: 1.05,

  /**
   * Pressed scale (for tap/active states)
   */
  pressed: 0.95,

  /**
   * Strong pressed scale (for icon buttons)
   */
  pressedStrong: 0.9,

  /**
   * Pronounced scale (for icon button hover)
   */
  pronounced: 1.1,

  /**
   * Subtle scale (for hover effects)
   */
  subtle: 1.02,
} as const;
