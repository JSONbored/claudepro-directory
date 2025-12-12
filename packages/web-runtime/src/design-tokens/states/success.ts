/**
 * Success State Tokens
 *
 * Tokens for success states (message, border, icon, background).
 *
 * @module web-runtime/design-tokens/states/success
 */

import { COLORS } from '../colors/index.ts';

/**
 * Success State Tokens
 * For success messages, success borders, success icons
 */
export const SUCCESS_STATES = {
  /**
   * Success text color
   */
  text: {
    light: COLORS.semantic.success.light.text,
    dark: COLORS.semantic.success.dark.text,
  },

  /**
   * Success background color
   */
  background: {
    light: COLORS.semantic.success.light.background,
    dark: COLORS.semantic.success.dark.background,
  },

  /**
   * Success border color
   */
  border: {
    light: COLORS.semantic.success.light.border,
    dark: COLORS.semantic.success.dark.border,
  },

  /**
   * Success icon color
   */
  icon: {
    light: COLORS.semantic.success.light.text,
    dark: COLORS.semantic.success.dark.text,
  },
} as const;
