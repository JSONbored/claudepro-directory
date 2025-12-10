/**
 * Responsive Spacing Tokens
 *
 * Spacing tokens that vary by breakpoint.
 * Provides responsive spacing for mobile, tablet, and desktop.
 *
 * @module web-runtime/design-tokens/responsive/spacing
 */

import { SPACING } from '../spacing/index.ts';

/**
 * Responsive Spacing Tokens
 * Spacing that adapts to screen size
 */
export const RESPONSIVE_SPACING = {
  /**
   * Responsive margin bottom
   * Smaller on mobile, larger on desktop
   */
  marginBottom: {
    mobile: {
      default: SPACING.marginBottom.compact,
      comfortable: SPACING.marginBottom.default,
      relaxed: SPACING.marginBottom.comfortable,
    },
    tablet: {
      default: SPACING.marginBottom.default,
      comfortable: SPACING.marginBottom.comfortable,
      relaxed: SPACING.marginBottom.relaxed,
    },
    desktop: {
      default: SPACING.marginBottom.comfortable,
      comfortable: SPACING.marginBottom.relaxed,
      relaxed: SPACING.marginBottom.loose,
    },
  },

  /**
   * Responsive padding
   * Smaller on mobile, larger on desktop
   */
  padding: {
    mobile: {
      default: SPACING.padding.compact,
      comfortable: SPACING.padding.default,
      relaxed: SPACING.padding.comfortable,
    },
    tablet: {
      default: SPACING.padding.default,
      comfortable: SPACING.padding.comfortable,
      relaxed: SPACING.padding.relaxed,
    },
    desktop: {
      default: SPACING.padding.comfortable,
      comfortable: SPACING.padding.relaxed,
      relaxed: SPACING.padding.loose,
    },
  },

  /**
   * Responsive gap
   * Smaller on mobile, larger on desktop
   */
  gap: {
    mobile: {
      default: SPACING.gap.compact,
      comfortable: SPACING.gap.default,
      relaxed: SPACING.gap.comfortable,
    },
    tablet: {
      default: SPACING.gap.default,
      comfortable: SPACING.gap.comfortable,
      relaxed: SPACING.gap.relaxed,
    },
    desktop: {
      default: SPACING.gap.comfortable,
      comfortable: SPACING.gap.relaxed,
      relaxed: SPACING.gap.loose,
    },
  },
} as const;
