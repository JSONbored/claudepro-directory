/**
 * Error State Tokens
 *
 * Tokens for error states (message, border, icon, background).
 *
 * @module web-runtime/design-tokens/states/error
 */

import { COLORS } from '../colors/index.ts';

/**
 * Error State Tokens
 * For error messages, error borders, error icons
 */
export const ERROR_STATES = {
  /**
   * Error text color
   */
  text: {
    light: COLORS.semantic.error.light.text,
    dark: COLORS.semantic.error.dark.text,
  },

  /**
   * Error background color
   */
  background: {
    light: COLORS.semantic.error.light.background,
    dark: COLORS.semantic.error.dark.background,
  },

  /**
   * Error border color
   */
  border: {
    light: COLORS.semantic.error.light.border,
    dark: COLORS.semantic.error.dark.border,
  },

  /**
   * Error icon color
   */
  icon: {
    light: COLORS.semantic.error.light.text,
    dark: COLORS.semantic.error.dark.text,
  },
} as const;
