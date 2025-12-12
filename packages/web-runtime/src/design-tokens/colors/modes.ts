/**
 * Theme Mode Color Tokens
 *
 * Provides theme-aware color access (light/dark/high-contrast).
 * Automatically selects correct colors based on current theme mode.
 *
 * @module web-runtime/design-tokens/colors/modes
 */

import { SEMANTIC_COLORS } from './semantic.ts';

/**
 * Theme Mode Colors
 * Organized by theme mode for easy access
 */
export const MODE_COLORS = {
  /**
   * Light Mode Colors
   * All semantic colors for light theme
   */
  light: {
    primary: SEMANTIC_COLORS.primary.light,
    background: SEMANTIC_COLORS.background.light,
    text: SEMANTIC_COLORS.text.light,
    border: SEMANTIC_COLORS.border.light,
    success: SEMANTIC_COLORS.success.light,
    warning: SEMANTIC_COLORS.warning.light,
    error: SEMANTIC_COLORS.error.light,
    info: SEMANTIC_COLORS.info.light,
  },

  /**
   * Dark Mode Colors
   * All semantic colors for dark theme
   */
  dark: {
    primary: SEMANTIC_COLORS.primary.dark,
    background: SEMANTIC_COLORS.background.dark,
    text: SEMANTIC_COLORS.text.dark,
    border: SEMANTIC_COLORS.border.dark,
    success: SEMANTIC_COLORS.success.dark,
    warning: SEMANTIC_COLORS.warning.dark,
    error: SEMANTIC_COLORS.error.dark,
    info: SEMANTIC_COLORS.info.dark,
  },

  /**
   * High Contrast Mode Colors
   * Enhanced contrast for accessibility
   * TODO: Define high contrast colors (Phase 1, Step 1.2)
   */
  highContrast: {
    primary: SEMANTIC_COLORS.primary.dark, // Placeholder
    background: SEMANTIC_COLORS.background.dark, // Placeholder
    text: SEMANTIC_COLORS.text.dark, // Placeholder
    border: SEMANTIC_COLORS.border.dark, // Placeholder
    success: SEMANTIC_COLORS.success.dark, // Placeholder
    warning: SEMANTIC_COLORS.warning.dark, // Placeholder
    error: SEMANTIC_COLORS.error.dark, // Placeholder
    info: SEMANTIC_COLORS.info.dark, // Placeholder
  },
} as const;
