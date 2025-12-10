/**
 * Card Microinteractions
 *
 * Hover and interaction effects for content cards
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - Uses COLORS tokens for consistent color values
 * - Creates premium lift and shadow effects
 *
 * @module web-runtime/design-system/microinteractions/card
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';
import { COLORS } from '../../design-tokens/index.ts';

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
   * Forward tilt animation creates "entering" feeling with 3D perspective
   * Uses semantic design tokens for consistent colors
   * 
   * IMPORTANT: This borderColor is applied via motion.dev whileHover and takes precedence
   * over CSS hover classes. Ensure no conflicting hover:border-* classes are applied.
   * 
   * Requires parent container with perspective: '1000px' and transformStyle: 'preserve-3d'
   */
  hover: {
    // Use semantic primary color token - theme-aware (component must use useTheme hook)
    // Note: This is a static value - components using this should override with theme-aware value
    borderColor: COLORS.semantic.primary.dark.base, // Orange border from semantic tokens
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', // Enhanced shadow for depth
    scale: 1.01, // Subtle scale (reduced from 1.02)
    rotateX: -8, // Forward tilt (negative = forward, creates "entering" effect)
    z: 8, // Move forward in 3D space
    transition: SPRING_SMOOTH,
    // No y movement - forward tilt replaces lift animation
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
