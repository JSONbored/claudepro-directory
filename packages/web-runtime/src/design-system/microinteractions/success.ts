/**
 * Success Microinteractions
 *
 * Animations for success states (form submissions, completed actions, etc.)
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - 2025 best practices for success feedback
 *
 * @module web-runtime/design-system/microinteractions/success
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transitions for success interactions
 */
const SPRING_BOUNCY: Transition = SPRING.bouncy;
const SPRING_SMOOTH: Transition = SPRING.smooth;

/**
 * Success Microinteractions
 */
export const SUCCESS = {
  /**
   * Checkmark animation for successful actions
   * Scale + rotate for celebratory feel
   * Best for: Form submissions, completed actions
   */
  checkmark: {
    scale: [0, 1.2, 1],
    rotate: [0, 10, 0],
    transition: SPRING_BOUNCY,
  },

  /**
   * Success message fade-in
   * Smooth fade-in for success messages
   * Best for: Success text, confirmation messages
   */
  messageFadeIn: {
    opacity: [0, 1],
    y: [10, 0],
    transition: SPRING_SMOOTH,
  },

  /**
   * Success color transition
   * Border and background color change to green
   * Best for: Input fields with success state
   */
  colorTransition: {
    borderColor: 'hsl(142, 76%, 36%)', // Green-600
    backgroundColor: 'hsl(142, 76%, 36%) / 0.1',
    transition: SPRING_SMOOTH,
  },

  /**
   * Default transition for success animations
   */
  transition: SPRING_SMOOTH,
} as const;

/**
 * Helper function to get success checkmark animation
 * @returns Success checkmark animation configuration
 */
export function getSuccessCheckmark() {
  return SUCCESS.checkmark;
}

/**
 * Helper function to get success message fade-in animation
 * @returns Success message fade-in animation configuration
 */
export function getSuccessMessageFadeIn() {
  return SUCCESS.messageFadeIn;
}
