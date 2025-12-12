/**
 * Hero Section Microinteractions
 *
 * Animations for hero section when search is focused/unfocused
 *
 * @module web-runtime/design-system/microinteractions/hero
 */

import { SPRING } from '../animations/spring.ts';

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
      ...SPRING.smooth,
      mass: 0.5,
    },
  },

  /**
   * Default transition for hero animations
   */
  transition: {
    ...SPRING.smooth,
    mass: 0.5,
  },

  /**
   * Hero content when search is unfocused (normal state)
   */
  unfocused: {
    opacity: 1,
    scale: 1,
    transition: {
      ...SPRING.smooth,
      mass: 0.5,
    },
  },
} as const;
