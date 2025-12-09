/**
 * Layout Transition Presets
 *
 * Transition configurations for layout animations.
 * Used with Motion.dev's layout prop for smooth position/size changes.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING and DURATION from animations design system
 * - Optimized for FLIP technique performance
 *
 * @module web-runtime/design-system/layout/transitions
 */

import { type Transition } from 'motion/react';

import { DURATION } from '../animations/duration.ts';
import { EASING } from '../animations/easing.ts';
import { SPRING } from '../animations/spring.ts';

/**
 * Layout Transition Presets
 * All values are semantic and self-contained
 */
export const LAYOUT_TRANSITIONS = {
  /**
   * Default layout transition - Balanced, responsive
   * Best for: General layout changes
   */
  default: SPRING.default,

  /**
   * Duration-based layout transition
   * Best for: Precise timing control
   */
  duration: {
    duration: DURATION.default,
    ease: EASING.default,
  },

  /**
   * Smooth layout transition - Gentle, natural motion
   * Best for: Card grids, list reordering
   */
  smooth: SPRING.smooth,

  /**
   * Snappy layout transition - Quick, responsive
   * Best for: Quick reordering, immediate feedback
   */
  snappy: SPRING.snappy,
} as const satisfies Record<string, Transition>;
