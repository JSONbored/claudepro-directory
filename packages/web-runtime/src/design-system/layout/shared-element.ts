/**
 * Shared Element Transitions
 *
 * Configurations for shared element transitions (e.g., hero image → detail page).
 * Uses Motion.dev's layoutId for smooth element transitions across routes.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - Optimized for route transitions
 *
 * @module web-runtime/design-system/layout/shared-element
 */

import { type Transition } from 'motion/react';

import { SPRING } from '../animations/spring.ts';

/**
 * Shared Element Transitions
 */
export const SHARED_ELEMENT = {
  /**
   * Default shared element transition
   * Best for: General shared elements
   */
  default: SPRING.default,

  /**
   * Smooth shared element transition
   * Best for: Hero images, featured content
   */
  smooth: SPRING.smooth,

  /**
   * Snappy shared element transition
   * Best for: Quick transitions, immediate feedback
   */
  snappy: SPRING.snappy,
} as const satisfies Record<string, Transition>;
