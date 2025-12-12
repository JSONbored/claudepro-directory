/**
 * Button Microinteractions
 *
 * Standard button hover, tap, and state feedback animations.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - No external dependencies
 *
 * @module web-runtime/design-system/microinteractions/button
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transitions for button interactions
 * Reused from animations design system for consistency
 */
const SPRING_SMOOTH: Transition = SPRING.smooth;
const SPRING_SNAPPY: Transition = SPRING.snappy;

/**
 * Button Microinteractions
 */
export const BUTTON = {
  /**
   * Active state (when button is pressed/selected)
   */
  active: {
    scale: 0.97,
    transition: SPRING_SNAPPY,
  },

  /**
   * Disabled state (no interaction)
   */
  disabled: {
    opacity: 0.5,
    scale: 1,
  },

  /**
   * Hover state animations
   * Applied when user hovers over button (desktop only)
   * Scale: Subtle lift (1.02 = 2% larger) for premium feel
   */
  hover: {
    scale: 1.02,
    transition: SPRING_SMOOTH,
  },

  /**
   * Tap/press state animations
   * Applied when user clicks/taps button
   */
  tap: {
    scale: 0.95, // Slight press down effect
    transition: SPRING_SNAPPY,
  },

  /**
   * Default transition for button animations
   * Used for hover/tap state changes
   */
  transition: SPRING_SMOOTH,
} as const;

/**
 * Helper function to get button hover animation
 * @returns Button hover animation configuration
 */
export function getButtonHover() {
  return BUTTON.hover;
}

/**
 * Helper function to get button tap animation
 * @returns Button tap animation configuration
 */
export function getButtonTap() {
  return BUTTON.tap;
}
