/**
 * Search Bar Microinteractions
 *
 * Animations for search input focus, typing, and expansion
 *
 * Architecture:
 * - Uses COLORS tokens for consistent brand color
 *
 * @module web-runtime/design-system/microinteractions/search
 */

import { COLORS } from '../../design-tokens/index.ts';

/**
 * Search Bar Microinteractions
 */
export const SEARCH = {
  /**
   * Expand state - when search expands (e.g., from button to input)
   */
  expand: {
    scale: 1,
    transition: {
      damping: 30,
      mass: 0.5,
      stiffness: 200,
      type: 'spring' as const,
    },
    width: '100%',
  },

  /**
   * Focus state - when search input receives focus
   * Uses COLORS tokens for consistent brand color
   */
  focus: {
    borderColor: `${COLORS.semantic.primary.dark.base} / 0.6`, // Orange border with 60% opacity - matches rgba(249, 115, 22, 0.6)
    boxShadow: `0 0 0 3px ${COLORS.semantic.primary.dark.base} / 0.1`, // Orange shadow with 10% opacity - matches rgba(249, 115, 22, 0.1)
    scale: 1.02,
    transition: {
      damping: 30,
      mass: 0.5,
      stiffness: 200,
      type: 'spring' as const,
    },
  },

  /**
   * Default transition for search animations - smooth and liquid
   */
  transition: {
    damping: 30,
    mass: 0.5,
    stiffness: 200,
    type: 'spring' as const,
  },

  /**
   * Typing state - subtle pulse on search icon while typing
   */
  typing: {
    scale: [1, 1.1, 1],
    transition: {
      damping: 20,
      duration: 0.6,
      mass: 0.8,
      repeat: Infinity,
      stiffness: 150,
      type: 'spring' as const,
    },
  },
} as const;
