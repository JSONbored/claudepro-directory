/**
 * Empty State Microinteractions
 *
 * Animations for empty states (no results, no data, etc.)
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - 2025 best practices for empty state feedback
 *
 * @module web-runtime/design-system/microinteractions/empty-state
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transitions for empty state interactions
 */
const SPRING_SMOOTH: Transition = SPRING.smooth;
const SPRING_BOUNCY: Transition = SPRING.bouncy;

/**
 * Empty State Microinteractions
 *
 * Uses array syntax for motion values to avoid TypeScript export naming issues
 * Type assertion prevents exposing internal motion-dom types
 */
export const EMPTY_STATE = {
  /**
   * Fade-in animation for empty state container
   * Best for: Empty state containers
   */
  fadeIn: {
    opacity: [0, 1],
    y: [20, 0],
    transition: SPRING_SMOOTH,
  },

  /**
   * Icon bounce animation for empty state icons
   * Best for: Empty state icons
   */
  iconBounce: {
    scale: [0, 1.2, 1],
    rotate: [-180, 0],
    transition: SPRING_BOUNCY,
  },

  /**
   * Staggered text appearance - title
   * Best for: Empty state title text
   */
  textStaggerTitle: {
    opacity: [0, 1],
    y: [10, 0],
    transition: { ...SPRING_SMOOTH, delay: 0.1 },
  },

  /**
   * Staggered text appearance - description
   * Best for: Empty state description text
   */
  textStaggerDescription: {
    opacity: [0, 1],
    y: [10, 0],
    transition: { ...SPRING_SMOOTH, delay: 0.2 },
  },

  /**
   * Default transition for empty state animations
   */
  transition: SPRING_SMOOTH,
} as {
  readonly fadeIn: {
    readonly opacity: readonly [number, number];
    readonly y: readonly [number, number];
    readonly transition: Transition;
  };
  readonly iconBounce: {
    readonly scale: readonly [number, number, number];
    readonly rotate: readonly [number, number];
    readonly transition: Transition;
  };
  readonly textStaggerTitle: {
    readonly opacity: readonly [number, number];
    readonly y: readonly [number, number];
    readonly transition: Transition;
  };
  readonly textStaggerDescription: {
    readonly opacity: readonly [number, number];
    readonly y: readonly [number, number];
    readonly transition: Transition;
  };
  readonly transition: Transition;
};

/**
 * Helper function to get empty state fade-in animation
 * @returns Empty state fade-in animation configuration
 */
export function getEmptyStateFadeIn() {
  return EMPTY_STATE.fadeIn;
}

/**
 * Helper function to get empty state icon bounce animation
 * @returns Empty state icon bounce animation configuration
 */
export function getEmptyStateIconBounce() {
  return EMPTY_STATE.iconBounce;
}
