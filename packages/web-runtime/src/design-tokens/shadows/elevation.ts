/**
 * Shadow Elevation Tokens
 *
 * Elevation-based shadow system for depth and hierarchy.
 * Different shadows for light and dark modes.
 * Uses OKLCH color space for shadows.
 *
 * @module web-runtime/design-tokens/shadows/elevation
 */

/**
 * Shadow Elevation Tokens
 * Organized by elevation level and theme mode
 */
export const SHADOW_ELEVATION = {
  /**
   * Dark Mode Shadows
   * Subtle shadows for dark backgrounds
   */
  dark: {
    /**
     * Subtle elevation - Very light shadow
     * Best for: Subtle depth, slight elevation
     */
    subtle: '0 1px 2px oklch(0% 0 0 / 0.02)',

    /**
     * Small elevation - Light shadow
     * Best for: Cards, small elevation
     */
    small: '0 1px 2px oklch(0% 0 0 / 0.04)',

    /**
     * Default elevation - Standard shadow
     * Best for: Default cards, standard elevation
     */
    default: '0 2px 4px oklch(0% 0 0 / 0.06), 0 1px 2px oklch(0% 0 0 / 0.04)',

    /**
     * Medium elevation - Medium shadow
     * Best for: Elevated cards, modals
     */
    medium: '0 4px 6px oklch(0% 0 0 / 0.08), 0 2px 4px oklch(0% 0 0 / 0.05)',

    /**
     * Large elevation - Strong shadow
     * Best for: High elevation, dropdowns, popovers
     */
    large: '0 8px 10px oklch(0% 0 0 / 0.1), 0 4px 6px oklch(0% 0 0 / 0.06)',

    /**
     * Stronger elevation - Very strong shadow
     * Best for: Very high elevation, dialogs
     */
    stronger: '0 12px 20px oklch(0% 0 0 / 0.15)',
  },

  /**
   * Light Mode Shadows
   * More pronounced shadows for light backgrounds
   */
  light: {
    /**
     * Subtle elevation - Very light shadow
     * Best for: Subtle depth, slight elevation
     */
    subtle: '0 1px 2px oklch(0% 0 0 / 0.03)',

    /**
     * Small elevation - Light shadow
     * Best for: Cards, small elevation
     */
    small: '0 1px 3px oklch(0% 0 0 / 0.06)',

    /**
     * Default elevation - Standard shadow
     * Best for: Default cards, standard elevation
     */
    default: '0 4px 6px oklch(0% 0 0 / 0.08)',

    /**
     * Medium elevation - Medium shadow
     * Best for: Elevated cards, modals
     */
    medium: '0 10px 15px oklch(0% 0 0 / 0.1)',

    /**
     * Large elevation - Strong shadow
     * Best for: High elevation, dropdowns, popovers
     */
    large: '0 15px 20px oklch(0% 0 0 / 0.12)',

    /**
     * Stronger elevation - Very strong shadow
     * Best for: Very high elevation, dialogs
     */
    stronger: '0 20px 25px oklch(0% 0 0 / 0.15)',
  },
} as const;
