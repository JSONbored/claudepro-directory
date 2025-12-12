/**
 * Info State Tokens
 *
 * Tokens for info states (message, border, icon, background).
 *
 * @module web-runtime/design-tokens/states/info
 */

import { COLORS } from '../colors/index.ts';

/**
 * Info State Tokens
 * For info messages, info borders, info icons
 */
export const INFO_STATES = {
  /**
   * Info text color
   */
  text: {
    light: COLORS.semantic.info.light.text,
    dark: COLORS.semantic.info.dark.text,
  },

  /**
   * Info background color
   */
  background: {
    light: COLORS.semantic.info.light.background,
    dark: COLORS.semantic.info.dark.background,
  },

  /**
   * Info border color
   */
  border: {
    light: COLORS.semantic.info.light.border,
    dark: COLORS.semantic.info.dark.border,
  },

  /**
   * Info icon color
   */
  icon: {
    light: COLORS.semantic.info.light.text,
    dark: COLORS.semantic.info.dark.text,
  },
} as const;
