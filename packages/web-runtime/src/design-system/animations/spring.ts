/**
 * Spring Physics Configurations
 *
 * Motion.dev spring animations with different characteristics:
 * - smooth: Gentle, natural motion (default)
 * - default: Balanced spring (snappy but smooth)
 * - snappy: Quick, responsive spring
 * - bouncy: Playful, bouncy spring
 *
 * Architecture:
 * - Self-contained semantic values (no external dependencies)
 * - Tuned for premium, natural motion
 * - Optimized for 60fps performance
 *
 * @module web-runtime/design-system/animations/spring
 */

import { type Transition } from 'motion/react';

/**
 * Spring Physics Configurations
 * All values are semantic and self-contained (v2 design system)
 */
export const SPRING = {
  /**
   * Bouncy spring - Playful, bouncy
   * Best for: Celebratory animations, confetti
   * Characteristics: High stiffness, low damping = bouncy, energetic motion
   */
  bouncy: {
    damping: 20,
    stiffness: 500,
    type: 'spring' as const,
  },

  /**
   * Default spring - Balanced, responsive
   * Best for: Button interactions, general animations
   * Characteristics: Medium stiffness, medium damping = balanced feel
   */
  default: {
    damping: 17,
    stiffness: 400,
    type: 'spring' as const,
  },

  /**
   * Smooth spring - Gentle, natural motion
   * Best for: Card hovers, subtle state changes
   * Characteristics: Low stiffness, high damping = smooth, controlled motion
   */
  smooth: {
    damping: 25,
    stiffness: 300,
    type: 'spring' as const,
  },

  /**
   * Snappy spring - Quick, responsive
   * Best for: Icon state changes, quick feedback
   * Characteristics: High stiffness, low damping = quick, snappy response
   */
  snappy: {
    damping: 20,
    stiffness: 500,
    type: 'spring' as const,
  },
} as const;

/**
 * Helper function to get smooth spring transition
 * @returns Smooth spring transition configuration
 */
export function getSpringSmooth(): Transition {
  return SPRING.smooth;
}

/**
 * Helper function to get default spring transition
 * @returns Default spring transition configuration
 */
export function getSpringDefault(): Transition {
  return SPRING.default;
}

/**
 * Helper function to get snappy spring transition
 * @returns Snappy spring transition configuration
 */
export function getSpringSnappy(): Transition {
  return SPRING.snappy;
}
