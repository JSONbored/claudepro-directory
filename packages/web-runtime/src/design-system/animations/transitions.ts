/**
 * Transition Presets
 *
 * Complete transition configurations ready to use.
 * Combines duration, easing, and spring physics.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING and EASING from same design system
 * - No external dependencies
 *
 * @module web-runtime/design-system/animations/transitions
 */

import { type Transition } from 'motion/react';

import { DURATION } from './duration.ts';
import { EASING } from './easing.ts';
import { SPRING } from './spring.ts';

/**
 * Transition Presets
 * All values are semantic and self-contained
 */
export const TRANSITIONS = {
  /**
   * Default transition - Standard animations
   * Best for: Button interactions, card hovers
   */
  default: {
    duration: DURATION.default,
    ease: EASING.default,
  },

  /**
   * Fast transition - Quick animations
   * Best for: Icon state changes, tooltip entrance
   */
  fast: {
    duration: DURATION.fast,
    ease: EASING.default,
  },

  /**
   * Slow transition - Deliberate animations
   * Best for: Page transitions, modal entrances
   */
  slow: {
    duration: DURATION.slow,
    ease: EASING.default,
  },

  /**
   * Spring default transition
   * Best for: Button interactions, general animations
   */
  springDefault: SPRING.default,

  /**
   * Spring smooth transition
   * Best for: Card hovers, subtle state changes
   */
  springSmooth: SPRING.smooth,

  /**
   * Spring snappy transition
   * Best for: Icon state changes, quick feedback
   */
  springSnappy: SPRING.snappy,
} as const satisfies Record<string, Transition>;
