/**
 * Opacity Animations
 *
 * Reusable opacity values for fade effects
 *
 * @module web-runtime/design-system/microinteractions/opacity
 */

/**
 * Opacity Animations
 */
export const OPACITY = {
  /**
   * Default (for hover overlays)
   */
  default: 0.8,

  /**
   * Fully opaque
   */
  opaque: 1,

  /**
   * Subtle (for disabled states)
   */
  subtle: 0.5,

  /**
   * Fully transparent
   */
  transparent: 0,
} as const;
