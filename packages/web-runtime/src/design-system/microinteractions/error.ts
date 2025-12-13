/**
 * Error Microinteractions
 *
 * Animations for error states (form validation, API errors, etc.)
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - 2025 best practices for error feedback
 *
 * @module web-runtime/design-system/microinteractions/error
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transitions for error interactions
 */
const SPRING_SNAPPY: Transition = SPRING.snappy;
const SPRING_BOUNCY: Transition = SPRING.bouncy;

/**
 * Error Microinteractions
 */
export const ERROR = {
  /**
   * Shake animation for form validation errors
   * Horizontal shake to draw attention to error
   * Best for: Input fields with validation errors
   */
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },

  /**
   * Icon bounce animation for error icons
   * Scale + bounce to emphasize error state
   * Best for: Error icons, alert badges
   */
  iconBounce: {
    scale: [1, 1.2, 1],
    transition: SPRING_BOUNCY,
  },

  /**
   * Error message fade-in
   * Smooth fade-in for error messages
   * Best for: Error text, validation messages
   */
  messageFadeIn: {
    opacity: [0, 1],
    y: [10, 0],
    transition: SPRING_SNAPPY,
  },

  /**
   * Default transition for error animations
   */
  transition: SPRING_SNAPPY,
} as const;

/**
 * Helper function to get error shake animation
 * @returns Error shake animation configuration
 */
export function getErrorShake() {
  return ERROR.shake;
}

/**
 * Helper function to get error icon bounce animation
 * @returns Error icon bounce animation configuration
 */
export function getErrorIconBounce() {
  return ERROR.iconBounce;
}
