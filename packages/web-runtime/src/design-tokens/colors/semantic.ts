/**
 * Semantic Color Mapping
 *
 * Maps base palette colors to semantic roles (primary, secondary, etc.).
 * Provides semantic naming that describes purpose, not appearance.
 *
 * @module web-runtime/design-tokens/colors/semantic
 */

import { BRAND_COLORS, NEUTRAL_COLORS, STATE_COLORS } from './palette.ts';

/**
 * Semantic Color Tokens
 * Organized by purpose, not appearance
 */
export const SEMANTIC_COLORS = {
  /**
   * Primary Colors
   * Main brand color, primary actions, key highlights
   */
  primary: {
    /**
     * Light mode primary
     */
    light: {
      base: 'oklch(70% 0.2 35)', // Adjusted for light mode
      hover: 'oklch(54% 0.17 40)',
      active: 'oklch(50% 0.175 39)',
      subtle: 'oklch(95% 0.035 42)',
    },

    /**
     * Dark mode primary
     */
    dark: {
      base: BRAND_COLORS.orange,
      hover: BRAND_COLORS.orangeHover,
      active: BRAND_COLORS.orangeActive,
      light: BRAND_COLORS.orangeLight,
      muted: BRAND_COLORS.orangeMuted,
    },
  },

  /**
   * Background Colors
   * Surface colors for containers, cards, etc.
   */
  background: {
    light: {
      primary: NEUTRAL_COLORS.light.bgPrimary,
      secondary: NEUTRAL_COLORS.light.bgSecondary,
      tertiary: NEUTRAL_COLORS.light.bgTertiary,
      quaternary: NEUTRAL_COLORS.light.bgQuaternary,
      selected: NEUTRAL_COLORS.light.bgSelected,
      code: NEUTRAL_COLORS.light.bgCode,
      overlay: NEUTRAL_COLORS.light.bgOverlay,
    },
    dark: {
      primary: NEUTRAL_COLORS.dark.bgPrimary,
      secondary: NEUTRAL_COLORS.dark.bgSecondary,
      tertiary: NEUTRAL_COLORS.dark.bgTertiary,
      quaternary: NEUTRAL_COLORS.dark.bgQuaternary,
      selected: NEUTRAL_COLORS.dark.bgSelected,
      code: NEUTRAL_COLORS.dark.bgCode,
      overlay: NEUTRAL_COLORS.dark.bgOverlay,
    },
  },

  /**
   * Text Colors
   * Text hierarchy colors
   */
  text: {
    light: {
      primary: NEUTRAL_COLORS.light.textPrimary,
      secondary: NEUTRAL_COLORS.light.textSecondary,
      tertiary: NEUTRAL_COLORS.light.textTertiary,
      disabled: NEUTRAL_COLORS.light.textDisabled,
      inverse: NEUTRAL_COLORS.light.textInverse,
      muted: NEUTRAL_COLORS.light.textTertiary, // Alias for tertiary
    },
    dark: {
      primary: NEUTRAL_COLORS.dark.textPrimary,
      secondary: NEUTRAL_COLORS.dark.textSecondary,
      tertiary: NEUTRAL_COLORS.dark.textTertiary,
      disabled: NEUTRAL_COLORS.dark.textDisabled,
      inverse: NEUTRAL_COLORS.dark.textInverse,
      muted: NEUTRAL_COLORS.dark.textTertiary, // Alias for tertiary
    },
  },

  /**
   * Border Colors
   * Border and divider colors
   */
  border: {
    light: {
      default: NEUTRAL_COLORS.light.borderDefault,
      light: NEUTRAL_COLORS.light.borderLight,
      medium: NEUTRAL_COLORS.light.borderMedium,
      strong: NEUTRAL_COLORS.light.borderStrong,
    },
    dark: {
      default: NEUTRAL_COLORS.dark.borderDefault,
      light: NEUTRAL_COLORS.dark.borderLight,
      medium: NEUTRAL_COLORS.dark.borderMedium,
      strong: NEUTRAL_COLORS.dark.borderStrong,
    },
  },

  /**
   * State Colors
   * Success, warning, error, info states
   */
  success: {
    light: {
      text: STATE_COLORS.light.success,
      background: STATE_COLORS.light.successBg,
      border: STATE_COLORS.light.successBorder,
    },
    dark: {
      text: STATE_COLORS.dark.success,
      background: STATE_COLORS.dark.successBg,
      border: STATE_COLORS.dark.successBorder,
    },
  },

  warning: {
    light: {
      text: STATE_COLORS.light.warning,
      background: STATE_COLORS.light.warningBg,
      border: STATE_COLORS.light.warningBorder,
    },
    dark: {
      text: STATE_COLORS.dark.warning,
      background: STATE_COLORS.dark.warningBg,
      border: STATE_COLORS.dark.warningBorder,
    },
  },

  error: {
    light: {
      text: STATE_COLORS.light.error,
      background: STATE_COLORS.light.errorBg,
      border: STATE_COLORS.light.errorBorder,
    },
    dark: {
      text: STATE_COLORS.dark.error,
      background: STATE_COLORS.dark.errorBg,
      border: STATE_COLORS.dark.errorBorder,
    },
  },

  info: {
    light: {
      text: STATE_COLORS.light.info,
      background: STATE_COLORS.light.infoBg,
      border: STATE_COLORS.light.infoBorder,
    },
    dark: {
      text: STATE_COLORS.dark.info,
      background: STATE_COLORS.dark.infoBg,
      border: STATE_COLORS.dark.infoBorder,
    },
  },

  /**
   * Featured Colors
   * For featured content badges and highlights
   * Uses amber/yellow gradient for premium content
   */
  featured: {
    light: {
      text: 'oklch(58% 0.16 65)', // amber-600
      border: 'oklch(58% 0.16 65 / 0.3)', // amber-500/30
      gradientFrom: 'oklch(58% 0.16 65 / 0.1)', // amber-500/10
      gradientTo: 'oklch(66% 0.155 65 / 0.1)', // yellow-500/10
    },
    dark: {
      text: 'oklch(82% 0.17 37)', // amber-400 (matches orangeLight hue)
      border: 'oklch(58% 0.16 65 / 0.3)', // amber-500/30
      gradientFrom: 'oklch(58% 0.16 65 / 0.1)', // amber-500/10
      gradientTo: 'oklch(66% 0.155 65 / 0.1)', // yellow-500/10
    },
  },

  /**
   * Sponsored Colors
   * For sponsored content badges
   * Uses purple/pink gradient
   */
  sponsored: {
    light: {
      text: 'oklch(64% 0.22 290)', // purple-600
      border: 'oklch(64% 0.22 290 / 0.3)', // purple-500/30
      gradientFrom: 'oklch(64% 0.22 290 / 0.1)', // purple-500/10
      gradientTo: 'oklch(68% 0.26 350 / 0.1)', // pink-500/10
    },
    dark: {
      text: 'oklch(78% 0.168 290)', // purple-400 (similar to info but purple hue)
      border: 'oklch(64% 0.22 290 / 0.3)', // purple-500/30
      gradientFrom: 'oklch(64% 0.22 290 / 0.1)', // purple-500/10
      gradientTo: 'oklch(68% 0.26 350 / 0.1)', // pink-500/10
    },
  },

  /**
   * Social Proof Colors
   * For notification badges and interaction counters
   */
  social: {
    view: {
      light: {
        text: 'oklch(54% 0.17 250)', // blue-500 (matches info.light.text)
      },
      dark: {
        text: 'oklch(78% 0.168 250)', // blue-500 (matches info.dark.text)
      },
    },
    copy: {
      light: {
        text: 'oklch(62% 0.19 145)', // green-500 (between success.light and success.dark)
      },
      dark: {
        text: 'oklch(72% 0.19 145)', // green-500 (matches success.dark.text)
      },
    },
    bookmark: {
      light: {
        text: 'oklch(66% 0.155 65)', // amber-500 (yellow-500, similar to warning)
      },
      dark: {
        text: 'oklch(82% 0.17 37)', // amber-500 (matches featured.dark.text)
      },
    },
  },

  /**
   * Swipe Gesture Colors
   * For mobile swipe gesture feedback
   */
  swipe: {
    copy: {
      light: {
        text: 'oklch(52% 0.18 145)', // green-600 (matches success.light.text)
        border: 'oklch(52% 0.18 145 / 0.3)', // green-500/30
        background: 'oklch(52% 0.18 145 / 0.2)', // green-500/20
      },
      dark: {
        text: 'oklch(72% 0.19 145)', // green-400 (matches success.dark.text)
        border: 'oklch(52% 0.18 145 / 0.3)', // green-500/30
        background: 'oklch(52% 0.18 145 / 0.2)', // green-500/20
      },
    },
    bookmark: {
      light: {
        text: 'oklch(54% 0.17 250)', // blue-600 (matches info.light.text)
        border: 'oklch(54% 0.17 250 / 0.3)', // blue-500/30
        background: 'oklch(54% 0.17 250 / 0.2)', // blue-500/20
      },
      dark: {
        text: 'oklch(78% 0.168 250)', // blue-400 (matches info.dark.text)
        border: 'oklch(54% 0.17 250 / 0.3)', // blue-500/30
        background: 'oklch(54% 0.17 250 / 0.2)', // blue-500/20
      },
    },
  },
} as const;
