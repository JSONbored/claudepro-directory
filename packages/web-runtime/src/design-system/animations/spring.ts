/**
 * Spring Physics Configurations
 *
 * Motion.dev spring animations with different characteristics:
 * - smooth: Gentle, natural motion (default)
 * - default: Balanced spring (snappy but smooth)
 * - snappy: Quick, responsive spring
 * - bouncy: Playful, bouncy spring
 * - loading: Balanced with higher damping for loading states
 * - shimmer: Gentle, liquid motion for shimmer effects
 * - gentle: Very smooth with higher damping
 * - scroll: Optimized for scroll progress indicators
 * - slide: Quick sliding animations
 * - hero: Ultra-smooth for hero sections
 * - modal: Premium 3D modal animations
 * - icon: Very bouncy for icon animations
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
   * Characteristics: Medium-high stiffness, medium damping = quick, controlled response
   */
  snappy: {
    damping: 17,
    stiffness: 400,
    type: 'spring' as const,
  },

  /**
   * Loading spring - Balanced with higher damping for loading states
   * Best for: Loading skeletons, staggered mount animations
   * Characteristics: Medium stiffness, higher damping = smooth, controlled loading feel
   */
  loading: {
    damping: 25,
    stiffness: 400,
    type: 'spring' as const,
  },

  /**
   * Shimmer spring - Gentle, liquid motion for shimmer effects
   * Best for: Shimmer animations, liquid-like effects
   * Characteristics: Low stiffness, high damping = organic, liquid feel
   */
  shimmer: {
    damping: 30,
    stiffness: 200,
    type: 'spring' as const,
  },

  /**
   * Gentle spring - Very smooth with higher damping
   * Best for: Jobs banner animations, accordion expansions
   * Characteristics: Medium stiffness, very high damping = gentle, controlled motion
   */
  gentle: {
    damping: 30,
    stiffness: 300,
    type: 'spring' as const,
  },

  /**
   * Scroll spring - Optimized for scroll progress indicators
   * Best for: Read progress bars, scroll-based animations
   * Characteristics: Low stiffness, very high damping = smooth scroll tracking
   */
  scroll: {
    damping: 40,
    stiffness: 200,
    type: 'spring' as const,
  },

  /**
   * Slide spring - Quick sliding animations
   * Best for: Sliding number components, quick transitions
   * Characteristics: Low stiffness, medium damping = snappy sliding motion
   */
  slide: {
    damping: 20,
    stiffness: 200,
    type: 'spring' as const,
  },

  /**
   * Hero spring - Ultra-smooth for hero sections
   * Best for: Hero parallax effects, large-scale animations
   * Characteristics: Very low stiffness, high damping = fluid, cinematic motion
   */
  hero: {
    damping: 30,
    stiffness: 100,
    type: 'spring' as const,
  },

  /**
   * Modal spring - Premium 3D modal animations
   * Best for: Modal entrances, 3D perspective effects
   * Characteristics: Medium-low stiffness, low damping = premium, natural feel
   */
  modal: {
    damping: 15,
    stiffness: 260,
    type: 'spring' as const,
  },

  /**
   * Icon spring - Very bouncy for icon animations
   * Best for: Icon scale animations, submit page hero
   * Characteristics: Very high stiffness, very low damping = bouncy, energetic
   */
  icon: {
    damping: 15,
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
