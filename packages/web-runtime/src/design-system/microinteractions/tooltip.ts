/**
 * Tooltip Microinteractions
 *
 * Entrance/exit animations for tooltips
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - Subtle, non-intrusive animations
 *
 * @module web-runtime/design-system/microinteractions/tooltip
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transition for tooltip animations
 * Reused from animations design system for consistency
 */
const SPRING_SMOOTH: Transition = SPRING.smooth;

/**
 * Tooltip Microinteractions
 */
export const TOOLTIP = {
  /**
   * Animate state (when tooltip is visible)
   */
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },

  /**
   * Exit state (when tooltip disappears)
   */
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
  },

  /**
   * Initial state (before tooltip appears)
   */
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },

  /**
   * Transition for tooltip animations
   */
  transition: SPRING_SMOOTH,
} as const;
