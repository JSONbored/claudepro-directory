/**
 * Responsive Typography Tokens
 *
 * Typography tokens that vary by breakpoint.
 * Provides responsive typography for mobile, tablet, and desktop.
 *
 * @module web-runtime/design-tokens/responsive/typography
 */

import { TYPOGRAPHY } from '../typography/index.ts';

/**
 * Responsive Typography Tokens
 * Typography that adapts to screen size
 */
export const RESPONSIVE_TYPOGRAPHY = {
  /**
   * Responsive font sizes
   * Smaller on mobile, larger on desktop
   */
  fontSizes: {
    mobile: {
      h1: TYPOGRAPHY.fontSizes['3xl'], // Smaller on mobile
      h2: TYPOGRAPHY.fontSizes['2xl'],
      h3: TYPOGRAPHY.fontSizes.xl,
      h4: TYPOGRAPHY.fontSizes.lg,
      body: TYPOGRAPHY.fontSizes.base,
    },
    tablet: {
      h1: TYPOGRAPHY.fontSizes['4xl'],
      h2: TYPOGRAPHY.fontSizes['3xl'],
      h3: TYPOGRAPHY.fontSizes['2xl'],
      h4: TYPOGRAPHY.fontSizes.xl,
      body: TYPOGRAPHY.fontSizes.base,
    },
    desktop: {
      h1: TYPOGRAPHY.fontSizes['4xl'], // Full size on desktop
      h2: TYPOGRAPHY.fontSizes['3xl'],
      h3: TYPOGRAPHY.fontSizes['2xl'],
      h4: TYPOGRAPHY.fontSizes.xl,
      body: TYPOGRAPHY.fontSizes.lg, // Larger body text on desktop
    },
  },
} as const;
