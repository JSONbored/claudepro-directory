/**
 * Reduced Motion Tokens
 *
 * Tokens for respecting user's motion preferences.
 * Ensures animations respect `prefers-reduced-motion` setting.
 *
 * @module web-runtime/design-tokens/accessibility/motion
 */

/**
 * Reduced Motion Tokens
 * For respecting prefers-reduced-motion preference
 */
export const REDUCED_MOTION = {
  /**
   * Reduced motion duration
   * Animations should be instant or very fast
   */
  duration: {
    fast: 0,
    default: 0,
    slow: 0,
  },

  /**
   * Reduced motion transition
   * No transitions when reduced motion is preferred
   */
  transition: 'none',

  /**
   * Reduced motion animation
   * No animations when reduced motion is preferred
   */
  animation: 'none',

  /**
   * Media query
   * Use this to check for reduced motion preference
   */
  mediaQuery: '(prefers-reduced-motion: reduce)',
} as const;
