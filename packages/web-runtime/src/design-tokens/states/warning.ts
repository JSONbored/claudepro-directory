/**
 * Warning State Tokens
 *
 * Tokens for warning states (message, border, icon, background).
 *
 * @module web-runtime/design-tokens/states/warning
 */

import { COLORS } from '../colors/index.ts';

/**
 * Warning State Tokens
 * For warning messages, warning borders, warning icons
 */
export const WARNING_STATES = {
  /**
   * Warning text color
   */
  text: {
    light: COLORS.semantic.warning.light.text,
    dark: COLORS.semantic.warning.dark.text,
  },

  /**
   * Warning background color
   */
  background: {
    light: COLORS.semantic.warning.light.background,
    dark: COLORS.semantic.warning.dark.background,
  },

  /**
   * Warning border color
   */
  border: {
    light: COLORS.semantic.warning.light.border,
    dark: COLORS.semantic.warning.dark.border,
  },

  /**
   * Warning icon color
   */
  icon: {
    light: COLORS.semantic.warning.light.text,
    dark: COLORS.semantic.warning.dark.text,
  },
} as const;
