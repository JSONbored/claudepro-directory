/**
 * Hero Section Microinteractions
 *
 * Animations for hero section when search is focused/unfocused
 *
 * @module web-runtime/design-system/microinteractions/hero
 */

/**
 * Hero Section Microinteractions
 */
export const HERO = {
  /**
   * Hero content when search is focused (blurred/background state)
   */
  focused: {
    opacity: 0.7,
    scale: 0.98,
    transition: {
      damping: 20,
      mass: 0.5,
      stiffness: 200,
      type: 'spring' as const,
    },
  },

  /**
   * Default transition for hero animations
   */
  transition: {
    damping: 20,
    mass: 0.5,
    stiffness: 200,
    type: 'spring' as const,
  },

  /**
   * Hero content when search is unfocused (normal state)
   */
  unfocused: {
    opacity: 1,
    scale: 1,
    transition: {
      damping: 20,
      mass: 0.5,
      stiffness: 200,
      type: 'spring' as const,
    },
  },
} as const;
