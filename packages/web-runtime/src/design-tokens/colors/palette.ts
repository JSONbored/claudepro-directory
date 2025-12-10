/**
 * Base Color Palette
 *
 * Base colors used to generate color scales and semantic mappings.
 * Uses OKLCH color space for perceptual uniformity and future-proofing.
 *
 * @module web-runtime/design-tokens/colors/palette
 */

/**
 * Brand Colors
 * Claude orange - primary brand color
 */
export const BRAND_COLORS = {
  /**
   * Primary brand orange - #F97316
   * Used for: Primary actions, accents, highlights
   */
  orange: 'oklch(74% 0.2 35)',

  /**
   * Orange variants
   */
  orangeHover: 'oklch(78% 0.19 35)',
  orangeActive: 'oklch(70% 0.21 35)',
  orangeLight: 'oklch(82% 0.17 37)',
  orangeMuted: 'oklch(65% 0.18 33)',
} as const;

/**
 * Neutral Colors
 * Grays for backgrounds, borders, text
 */
export const NEUTRAL_COLORS = {
  /**
   * Dark mode neutrals
   */
  dark: {
    bgPrimary: 'oklch(24% 0.008 60)',
    bgSecondary: 'oklch(28% 0.006 60)',
    bgTertiary: 'oklch(32% 0.008 60)',
    bgQuaternary: 'oklch(36% 0.009 60)',
    bgSelected: 'oklch(40% 0.01 60)',
    bgCode: 'oklch(12% 0.003 60)',
    bgOverlay: 'oklch(18% 0.005 0 / 0.8)',
    textPrimary: 'oklch(94% 0.005 60)',
    textSecondary: 'oklch(78% 0.008 60)',
    textTertiary: 'oklch(72% 0.01 60)',
    textDisabled: 'oklch(57% 0.012 60)',
    textInverse: 'oklch(100% 0 0)',
    borderDefault: 'oklch(30% 0.005 60 / 0.5)',
    borderLight: 'oklch(28% 0.005 60 / 0.3)',
    borderMedium: 'oklch(34% 0.008 60 / 0.6)',
    borderStrong: 'oklch(74% 0.2 35)',
  },

  /**
   * Light mode neutrals
   */
  light: {
    bgPrimary: 'oklch(99% 0.003 90)',
    bgSecondary: 'oklch(97.5% 0.005 85)',
    bgTertiary: 'oklch(96% 0.007 80)',
    bgQuaternary: 'oklch(94% 0.008 75)',
    bgSelected: 'oklch(92% 0.025 42)',
    bgCode: 'oklch(98% 0.004 85)',
    bgOverlay: 'oklch(98% 0.003 90 / 0.9)',
    textPrimary: 'oklch(18% 0.014 75)',
    textSecondary: 'oklch(42% 0.012 70)',
    textTertiary: 'oklch(44% 0.01 65)',
    textDisabled: 'oklch(68% 0.008 60)',
    textInverse: 'oklch(100% 0 0)',
    borderDefault: 'oklch(92% 0.006 75)',
    borderLight: 'oklch(95% 0.004 80)',
    borderMedium: 'oklch(88% 0.008 70)',
    borderStrong: 'oklch(70% 0.2 35)',
  },
} as const;

/**
 * Semantic State Colors
 * Success, warning, error, info
 */
export const STATE_COLORS = {
  /**
   * Dark mode state colors
   */
  dark: {
    success: 'oklch(72% 0.19 145)',
    successBg: 'oklch(35% 0.08 145 / 0.15)',
    successBorder: 'oklch(64% 0.19 145 / 0.3)',
    warning: 'oklch(75% 0.155 65)',
    warningBg: 'oklch(45% 0.08 65 / 0.15)',
    warningBorder: 'oklch(68% 0.155 65 / 0.3)',
    error: 'oklch(70% 0.195 25)',
    errorBg: 'oklch(40% 0.08 25 / 0.15)',
    errorBorder: 'oklch(63% 0.195 25 / 0.3)',
    info: 'oklch(78% 0.168 250)',
    infoBg: 'oklch(40% 0.08 250 / 0.15)',
    infoBorder: 'oklch(65% 0.168 250 / 0.3)',
  },

  /**
   * Light mode state colors
   */
  light: {
    success: 'oklch(52% 0.18 145)',
    successBg: 'oklch(96% 0.08 145 / 0.2)',
    successBorder: 'oklch(52% 0.18 145 / 0.3)',
    warning: 'oklch(58% 0.16 65)',
    warningBg: 'oklch(97% 0.08 65 / 0.2)',
    warningBorder: 'oklch(58% 0.16 65 / 0.3)',
    error: 'oklch(53% 0.19 25)',
    errorBg: 'oklch(97% 0.08 25 / 0.2)',
    errorBorder: 'oklch(53% 0.19 25 / 0.3)',
    info: 'oklch(54% 0.17 250)',
    infoBg: 'oklch(97% 0.08 250 / 0.2)',
    infoBorder: 'oklch(54% 0.17 250 / 0.3)',
  },
} as const;
