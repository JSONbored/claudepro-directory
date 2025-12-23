/**
 * Search Bar Microinteractions
 *
 * Animations for search input focus, typing, and expansion
 *
 * Architecture:
 * - Uses COLORS tokens for consistent brand color
 * - Uses SHADOWS tokens for elevation
 * - Uses RGB colors for Motion.dev animations (OKLCH not animatable)
 *
 * @module web-runtime/design-system/microinteractions/search
 */

import { SPRING } from '../animations/spring.ts';
// COLORS removed - using CSS variables for dynamic Framer Motion animations

/**
 * Search Bar Microinteractions
 */
export const SEARCH = {
  /**
   * Initial/default state - search wrapper's base appearance
   * Used for SSR hydration matching and initial render
   * Uses RGB colors for Motion.dev animations (OKLCH not animatable)
   */
  initial: {
    scale: 1,
    borderColor: 'var(--foreground) / 0.15', // Theme foreground with 15% opacity for glassmorphism
    backgroundColor: 'var(--background) / 0.25', // Theme background with 25% opacity for glassmorphism
    // Use theme shadow variable for consistency
    boxShadow: 'var(--shadow-lg)', // Subtle elevation shadow from theme
  },

  /**
   * Expand state - when search expands (e.g., from button to input)
   */
  expand: {
    scale: 1,
    transition: {
      ...SPRING.smooth,
      mass: 0.5,
    },
    width: '100%',
  },

  /**
   * Focus state - when search input receives focus
   * Uses COLORS tokens for consistent brand color
   * Uses SPRING.hover for fast, responsive feel
   * BEAUTIFUL: Vibrant orange focus with higher opacity for visibility
   *
   * NOTE: Uses RGB colors for Motion.dev animations (OKLCH not animatable)
   * OKLCH versions available as CSS variables in globals.css @theme block
   */
  focus: {
    // Using CSS variables for Motion.dev animations (RGB format required)
    borderColor: 'var(--color-search-focus-border-rgb)', // rgba(249, 115, 22, 0.7)
    boxShadow: '0 0 0 3px var(--color-search-focus-shadow-rgb)', // rgba(249, 115, 22, 0.2)
    scale: 1.02,
    transition: {
      ...SPRING.hover,
      mass: 0.5,
    },
  },

  /**
   * Default transition for search animations - fast and responsive
   * Uses SPRING.hover for better hover/focus interactions
   */
  transition: {
    ...SPRING.hover,
    mass: 0.5,
  },

  /**
   * Typing state - subtle pulse on search icon while typing
   */
  typing: {
    scale: [1, 1.1, 1],
    transition: {
      ...SPRING.smooth,
      mass: 0.8,
      repeat: Infinity,
    },
  },
} as const;
