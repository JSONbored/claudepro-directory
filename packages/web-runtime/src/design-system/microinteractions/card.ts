/**
 * Card Microinteractions
 *
 * Hover and interaction effects for content cards
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - Creates premium lift and shadow effects
 *
 * @module web-runtime/design-system/microinteractions/card
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transitions for card interactions
 * Reused from animations design system for consistency
 */
const SPRING_SMOOTH: Transition = SPRING.smooth;
const SPRING_SNAPPY: Transition = SPRING.snappy;

/**
 * Card Microinteractions
 */
export const CARD = {
  /**
   * Hover state for cards
   * Subtle lift and border color change
   */
  hover: {
    borderColor: 'rgba(249, 115, 22, 0.5)', // Orange border
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    scale: 1.02,
    transition: SPRING_SMOOTH,
    y: -2, // Slight lift
  },

  /**
   * Tap state for cards (mobile)
   */
  tap: {
    scale: 0.98,
    transition: SPRING_SNAPPY,
  },

  /**
   * Default transition for card animations
   */
  transition: SPRING_SMOOTH,
} as const;

/**
 * Helper function to get card hover animation
 * @returns Card hover animation configuration
 */
export function getCardHover() {
  return CARD.hover;
}
