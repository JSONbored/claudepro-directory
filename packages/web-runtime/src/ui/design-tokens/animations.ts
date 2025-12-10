/**
 * Animation Design Tokens
 *
 * Centralized animation configurations for Motion.dev animations.
 * Includes spring physics, duration, easing, and transition presets.
 *
 * Architecture:
 * - Reuses values from unified-config for consistency
 * - Type-safe with const assertions
 * - Motion.dev compatible (Transition type)
 * - Semantic naming (e.g., `spring.smooth` not `spring-300-25`)
 *
 * Usage:
 * ```tsx
 * import { ANIMATIONS } from '@heyclaude/web-runtime/ui/design-tokens';
 *
 * <motion.div
 *   animate={{ x: 100 }}
 *   transition={ANIMATIONS.spring.smooth}
 * />
 * ```
 *
 * @module web-runtime/ui/design-tokens/animations
 */

import type { Transition } from 'motion/react';
import { UI_ANIMATION } from '../../config/unified-config.ts';

/**
 * Animation Design Tokens
 *
 * Organized by animation type (spring, duration, easing, transitions)
 */
export const ANIMATIONS = {
  /**
   * Spring Physics Configurations
   *
   * Motion.dev spring animations with different characteristics:
   * - smooth: Gentle, natural motion (default)
   * - default: Balanced spring (snappy but smooth)
   * - snappy: Quick, responsive spring
   * - bouncy: Playful, bouncy spring
   */
  spring: {
    /**
     * Smooth spring - Gentle, natural motion
     * Best for: Card hovers, subtle state changes
     */
    smooth: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.smooth.stiffness'], // 300
      damping: UI_ANIMATION['spring.smooth.damping'], // 25
    },

    /**
     * Default spring - Balanced, responsive
     * Best for: Button interactions, general animations
     */
    default: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.default.stiffness'], // 400
      damping: UI_ANIMATION['spring.default.damping'], // 17
    },

    /**
     * Snappy spring - Quick, responsive
     * Best for: Icon state changes, quick feedback
     */
    snappy: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.bouncy.stiffness'], // 500
      damping: UI_ANIMATION['spring.bouncy.damping'], // 20
    },

    /**
     * Bouncy spring - Playful, bouncy
     * Best for: Celebratory animations, confetti
     */
    bouncy: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.bouncy.stiffness'], // 500
      damping: UI_ANIMATION['spring.bouncy.damping'], // 20
    },
  },

  /**
   * Duration Presets
   *
   * Standard animation durations in seconds
   */
  duration: {
    /**
     * Fast duration - Quick feedback
     * Best for: Icon state changes, tooltip entrance
     */
    fast: UI_ANIMATION['duration'] / 1000 / 2, // 0.15s

    /**
     * Default duration - Standard animations
     * Best for: Button interactions, card hovers
     */
    default: UI_ANIMATION['duration'] / 1000, // 0.3s

    /**
     * Slow duration - Deliberate animations
     * Best for: Page transitions, modal entrances
     */
    slow: UI_ANIMATION['duration'] / 1000 * 1.33, // 0.4s
  },

  /**
   * Easing Presets
   *
   * Cubic bezier easing functions
   */
  easing: {
    /**
     * Default easing - Natural ease-out
     * Best for: Most animations
     */
    default: [0.4, 0, 0.2, 1] as const, // ease-out

    /**
     * Emphasized easing - Strong ease-out
     * Best for: Important state changes
     */
    emphasized: [0.2, 0, 0, 1] as const,

    /**
     * Linear easing - No acceleration
     * Best for: Progress bars, loading indicators
     */
    linear: [0, 0, 1, 1] as const,
  },

  /**
   * Transition Presets
   *
   * Complete transition configurations ready to use
   */
  transition: {
    /**
     * Fast transition - Quick animations
     */
    fast: {
      duration: UI_ANIMATION['duration'] / 1000 / 2, // 0.15s
      ease: [0.4, 0, 0.2, 1] as const,
    },

    /**
     * Default transition - Standard animations
     */
    default: {
      duration: UI_ANIMATION['duration'] / 1000, // 0.3s
      ease: [0.4, 0, 0.2, 1] as const,
    },

    /**
     * Slow transition - Deliberate animations
     */
    slow: {
      duration: UI_ANIMATION['duration'] / 1000 * 1.33, // 0.4s
      ease: [0.4, 0, 0.2, 1] as const,
    },

    /**
     * Spring smooth transition
     */
    springSmooth: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.smooth.stiffness'],
      damping: UI_ANIMATION['spring.smooth.damping'],
    },

    /**
     * Spring default transition
     */
    springDefault: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.default.stiffness'],
      damping: UI_ANIMATION['spring.default.damping'],
    },

    /**
     * Spring snappy transition
     */
    springSnappy: {
      type: 'spring' as const,
      stiffness: UI_ANIMATION['spring.bouncy.stiffness'],
      damping: UI_ANIMATION['spring.bouncy.damping'],
    },
  },

  /**
   * Stagger Configurations
   *
   * For animating lists of items with delays
   */
  stagger: {
    /**
     * Fast stagger - Quick sequential animations
     */
    fast: UI_ANIMATION['stagger.fast_ms'] / 1000, // 0.1s

    /**
     * Default stagger - Standard sequential animations
     */
    default: UI_ANIMATION['stagger.medium_ms'] / 1000, // 0.2s

    /**
     * Slow stagger - Deliberate sequential animations
     */
    slow: UI_ANIMATION['stagger.slow_ms'] / 1000, // 0.3s
  },
} as const;

/**
 * Type helper for animations tokens
 */
export type AnimationsTokens = typeof ANIMATIONS;

/**
 * Helper function to get smooth spring transition
 * Convenience wrapper for common use case
 */
export function getSpringSmooth(): Transition {
  return ANIMATIONS.spring.smooth;
}

/**
 * Helper function to get default spring transition
 * Convenience wrapper for common use case
 */
export function getSpringDefault(): Transition {
  return ANIMATIONS.spring.default;
}

/**
 * Helper function to get snappy spring transition
 * Convenience wrapper for common use case
 */
export function getSpringSnappy(): Transition {
  return ANIMATIONS.spring.snappy;
}
