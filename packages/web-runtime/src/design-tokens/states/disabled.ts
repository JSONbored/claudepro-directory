/**
 * Disabled State Tokens
 *
 * Tokens for disabled states (appearance, cursor, interaction).
 *
 * @module web-runtime/design-tokens/states/disabled
 */

import { COLORS } from '../colors/index.ts';

/**
 * Disabled State Tokens
 * For disabled buttons, inputs, and interactive elements
 */
export const DISABLED_STATES = {
  /**
   * Disabled appearance
   */
  appearance: {
    /**
     * Disabled opacity
     */
    opacity: 0.5,

    /**
     * Disabled text color
     */
    textColor: {
      light: COLORS.semantic.text.light.disabled,
      dark: COLORS.semantic.text.dark.disabled,
    },

    /**
     * Disabled background color
     */
    backgroundColor: {
      light: COLORS.semantic.background.light.tertiary,
      dark: COLORS.semantic.background.dark.tertiary,
    },

    /**
     * Disabled border color
     */
    borderColor: {
      light: COLORS.semantic.border.light.light,
      dark: COLORS.semantic.border.dark.light,
    },
  },

  /**
   * Disabled cursor
   */
  cursor: 'not-allowed',

  /**
   * Disabled interaction
   */
  interaction: {
    pointerEvents: 'none',
    userSelect: 'none',
  },
} as const;
