/**
 * Icon State Transitions
 *
 * Animations for icon changes (e.g., Bookmark → BookmarkCheck)
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - Playful rotation and scale for state changes
 *
 * @module web-runtime/design-system/microinteractions/icon-transition
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transition for icon state changes
 * Uses snappy spring for quick, responsive feedback
 */
const SPRING_SNAPPY: Transition = SPRING.snappy;

/**
 * Icon State Transitions
 */
export const ICON_TRANSITION = {
  /**
   * Animate state for new icon
   */
  animate: {
    rotate: 0,
    scale: 1,
  },

  /**
   * Exit state for old icon (unmounting)
   */
  exit: {
    rotate: 180,
    scale: 0,
  },

  /**
   * Initial state for new icon (mounting)
   */
  initial: {
    rotate: -180,
    scale: 0,
  },

  /**
   * Transition for icon state changes
   */
  transition: SPRING_SNAPPY,
} as const;
