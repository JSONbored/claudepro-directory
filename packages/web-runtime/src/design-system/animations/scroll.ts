/**
 * Scroll Animation Configurations
 *
 * Configurations for scroll-triggered and scroll-linked animations.
 * Uses Motion.dev's `whileInView` and `useScroll` patterns.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Reuses SPRING from animations design system
 * - 2025 best practices for scroll animations
 *
 * @module web-runtime/design-system/animations/scroll
 */

import { type Transition } from 'motion/react';

import { SPRING } from './spring.ts';

/**
 * Spring transitions for scroll animations
 */
const SPRING_SMOOTH: Transition = SPRING.smooth;
const SPRING_HERO: Transition = SPRING.hero;

/**
 * Scroll Animation Configurations
 */
export const SCROLL = {
  /**
   * Fade in + slide up when scrolled into view
   * Best for: Hero sections, feature reveals
   */
  fadeInUp: {
    initial: {
      opacity: 0,
      y: 20,
    },
    whileInView: {
      opacity: 1,
      y: 0,
    },
    viewport: {
      once: true,
      margin: '-100px',
    },
    transition: SPRING_SMOOTH,
  },

  /**
   * Fade in when scrolled into view
   * Best for: Content sections, cards
   */
  fadeIn: {
    initial: {
      opacity: 0,
    },
    whileInView: {
      opacity: 1,
    },
    viewport: {
      once: true,
      margin: '-50px',
    },
    transition: SPRING_SMOOTH,
  },

  /**
   * Scale + fade in when scrolled into view
   * Best for: Important sections, CTAs
   */
  scaleFadeIn: {
    initial: {
      opacity: 0,
      scale: 0.95,
    },
    whileInView: {
      opacity: 1,
      scale: 1,
    },
    viewport: {
      once: true,
      margin: '-100px',
    },
    transition: SPRING_SMOOTH,
  },

  /**
   * Hero section animation (ultra-smooth)
   * Best for: Hero sections, large content blocks
   */
  hero: {
    initial: {
      opacity: 0,
      y: 40,
    },
    whileInView: {
      opacity: 1,
      y: 0,
    },
    viewport: {
      once: true,
      margin: '-200px',
    },
    transition: SPRING_HERO,
  },

  /**
   * Staggered children animation
   * Best for: Lists, card grids
   */
  stagger: {
    initial: {
      opacity: 0,
      y: 20,
    },
    whileInView: {
      opacity: 1,
      y: 0,
    },
    viewport: {
      once: true,
      margin: '-50px',
    },
    transition: SPRING_SMOOTH,
  },

  /**
   * Default scroll animation configuration
   */
  default: {
    initial: {
      opacity: 0,
      y: 20,
    },
    whileInView: {
      opacity: 1,
      y: 0,
    },
    viewport: {
      once: true,
    },
    transition: SPRING_SMOOTH,
  },
} as const;

/**
 * Helper function to get scroll fade-in-up animation
 * @returns Scroll fade-in-up animation configuration
 */
export function getScrollFadeInUp() {
  return SCROLL.fadeInUp;
}

/**
 * Helper function to get scroll fade-in animation
 * @returns Scroll fade-in animation configuration
 */
export function getScrollFadeIn() {
  return SCROLL.fadeIn;
}
