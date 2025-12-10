/**
 * Focus State Tokens
 *
 * Tokens for focus indicators and focus states.
 * Ensures accessible focus visibility for keyboard navigation.
 *
 * @module web-runtime/design-tokens/accessibility/focus
 */

import { COLORS } from '../colors/index.ts';

/**
 * Focus State Tokens
 * For focus rings, focus indicators, focus visibility
 */
export const FOCUS_STATES = {
  /**
   * Focus ring
   * Visible focus indicator for keyboard navigation
   */
  ring: {
    /**
     * Focus ring width
     */
    width: '2px',

    /**
     * Focus ring offset
     * Space between element and focus ring
     */
    offset: '2px',

    /**
     * Focus ring color
     * Uses accent color for visibility
     */
    color: {
      light: COLORS.semantic.primary.light.base,
      dark: COLORS.semantic.primary.dark.base,
    },

    /**
     * Focus ring style
     */
    style: 'solid',
  },

  /**
   * Focus visible
   * Only show focus ring when keyboard navigating (not mouse)
   */
  visible: {
    outline: '2px solid',
    outlineOffset: '2px',
    outlineColor: {
      light: COLORS.semantic.primary.light.base,
      dark: COLORS.semantic.primary.dark.base,
    },
  },

  /**
   * Focus active
   * When focus ring is active (clicked)
   */
  active: {
    outlineOffset: '0px',
  },
} as const;
