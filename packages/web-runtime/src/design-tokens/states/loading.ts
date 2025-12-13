/**
 * Loading State Tokens
 *
 * Tokens for loading states (skeleton, spinner, progress).
 *
 * @module web-runtime/design-tokens/states/loading
 */

import { COLORS } from '../colors/index.ts';

/**
 * Loading State Tokens
 * For skeleton loaders, spinners, progress indicators
 */
export const LOADING_STATES = {
  /**
   * Skeleton loader
   * For placeholder content while loading
   * Uses rgba format for Motion.dev compatibility (oklch colors cannot be animated)
   */
  skeleton: {
    backgroundColor: 'rgba(55, 47, 42, 0.5)', // oklch(28% 0.006 60 / 0.5) converted to rgba for Motion.dev compatibility
    borderRadius: '0.375rem', // Rounded corners
    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },

  /**
   * Spinner
   * For loading indicators
   */
  spinner: {
    size: {
      small: '1rem', // 16px
      default: '1.5rem', // 24px
      large: '2rem', // 32px
    },
    color: COLORS.semantic.primary.dark.base,
    animation: 'spin 1s linear infinite',
  },

  /**
   * Progress bar
   * For progress indicators
   */
  progress: {
    height: {
      small: '0.125rem', // 2px
      default: '0.25rem', // 4px
      large: '0.5rem', // 8px
    },
    backgroundColor: 'rgba(55, 47, 42, 0.3)', // oklch(28% 0.006 60 / 0.3) converted to rgba for Motion.dev compatibility
    fillColor: COLORS.semantic.primary.dark.base, // Fill color
    borderRadius: '9999px', // Fully rounded
  },
} as const;
