/**
 * Ripple Effect
 *
 * Material Design-inspired ripple effect for button clicks
 *
 * @module web-runtime/design-system/microinteractions/ripple
 */

/**
 * Ripple Effect
 */
export const RIPPLE = {
  /**
   * Animate state for ripple (expanding)
   */
  animate: {
    opacity: 0,
    scale: 10, // Expands 10x
  },

  /**
   * Initial state for ripple
   */
  initial: {
    opacity: 0.5,
    scale: 0,
  },

  /**
   * Transition for ripple effect
   */
  transition: {
    duration: 0.6,
    ease: 'easeOut',
  },
} as const;
