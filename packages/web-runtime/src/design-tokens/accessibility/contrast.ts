/**
 * Contrast Ratio Tokens
 *
 * WCAG contrast ratio requirements for accessibility.
 * Ensures text meets minimum contrast ratios for readability.
 *
 * @module web-runtime/design-tokens/accessibility/contrast
 */

/**
 * Contrast Ratio Tokens
 * WCAG AA and AAA contrast requirements
 */
export const CONTRAST_RATIOS = {
  /**
   * Minimum contrast ratios (WCAG AA)
   * Required for all text and UI elements
   */
  minimum: {
    /**
     * Normal text (under 18pt or 14pt bold)
     * Minimum 4.5:1 contrast ratio
     */
    text: 4.5,

    /**
     * Large text (18pt+ or 14pt+ bold)
     * Minimum 3:1 contrast ratio
     */
    largeText: 3,

    /**
     * UI components (icons, buttons)
     * Minimum 3:1 contrast ratio
     */
    ui: 3,
  },

  /**
   * Enhanced contrast ratios (WCAG AAA)
   * Target for improved accessibility
   */
  enhanced: {
    /**
     * Normal text
     * Minimum 7:1 contrast ratio
     */
    text: 7,

    /**
     * Large text
     * Minimum 4.5:1 contrast ratio
     */
    largeText: 4.5,

    /**
     * UI components
     * Minimum 4.5:1 contrast ratio
     */
    ui: 4.5,
  },

  /**
   * Target contrast (WCAG 3.0 APCA)
   * Future-proofing for WCAG 3.0
   * TODO: Implement APCA contrast calculations
   */
  target: {
    /**
     * Target APCA contrast score
     * Positive = light text on dark, Negative = dark text on light
     */
    apca: {
      minimum: 60, // WCAG 3.0 APCA minimum
      enhanced: 75, // WCAG 3.0 APCA enhanced
    },
  },
} as const;
