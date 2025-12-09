/**
 * Icon Button Microinteractions
 *
 * Specialized animations for icon-only buttons (bookmark, pin, copy, etc.)
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - More pronounced than regular buttons (icon-only needs stronger feedback)
 *
 * @module web-runtime/design-system/microinteractions/icon-button
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Spring transitions for icon button interactions
 * Reused from animations design system for consistency
 */
const SPRING_SMOOTH: Transition = SPRING.smooth;
const SPRING_SNAPPY: Transition = SPRING.snappy;

/**
 * Icon Button Microinteractions
 */
export const ICON_BUTTON = {
  /**
   * Active state (when icon button is toggled on)
   * Example: Bookmark button when bookmarked, Pin button when pinned
   */
  active: {
    color: 'var(--claude-orange)', // Brand orange
    scale: 1.05,
    transition: SPRING_SMOOTH,
  },

  /**
   * Hover state for icon buttons
   * Slightly more pronounced than regular buttons
   */
  hover: {
    scale: 1.1,
    transition: SPRING_SMOOTH,
  },

  /**
   * Inactive state (when icon button is toggled off)
   */
  inactive: {
    color: 'currentColor',
    scale: 1,
    transition: SPRING_SMOOTH,
  },

  /**
   * Tap state for icon buttons
   */
  tap: {
    scale: 0.9,
    transition: SPRING_SNAPPY,
  },

  /**
   * Default transition for icon button animations
   */
  transition: SPRING_SMOOTH,
} as const;

/**
 * Helper function to get icon button active state
 * @returns Icon button active state configuration
 */
export function getIconButtonActive() {
  return ICON_BUTTON.active;
}
