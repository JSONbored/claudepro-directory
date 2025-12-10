/**
 * Semantic Typography Tokens
 *
 * Pre-composed typography combinations for common use cases.
 * Provides semantic typography patterns (heading, body, label, etc.).
 *
 * @module web-runtime/design-tokens/typography/semantic
 */

import { FONT_SIZES } from './font-sizes.ts';
import { FONT_WEIGHTS } from './font-weights.ts';
import { LINE_HEIGHTS } from './line-heights.ts';
import { LETTER_SPACING } from './letter-spacing.ts';
import { FONT_FAMILIES } from './font-families.ts';

/**
 * Semantic Typography Tokens
 * Pre-composed typography patterns for common use cases
 */
export const SEMANTIC_TYPOGRAPHY = {
  /**
   * Heading Styles
   * For page titles, section headings, etc.
   */
  heading: {
    /**
     * H1 - Large page title
     */
    h1: {
      fontSize: FONT_SIZES['4xl'],
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: LINE_HEIGHTS.tight,
      letterSpacing: LETTER_SPACING.tight,
      fontFamily: FONT_FAMILIES.display,
    },

    /**
     * H2 - Section title
     */
    h2: {
      fontSize: FONT_SIZES['3xl'],
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: LINE_HEIGHTS.tight,
      letterSpacing: LETTER_SPACING.tight,
      fontFamily: FONT_FAMILIES.display,
    },

    /**
     * H3 - Subsection title
     */
    h3: {
      fontSize: FONT_SIZES['2xl'],
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.snug,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },

    /**
     * H4 - Card title, small heading
     */
    h4: {
      fontSize: FONT_SIZES.xl,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.snug,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },

    /**
     * H5 - Small heading
     */
    h5: {
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },

    /**
     * H6 - Smallest heading
     */
    h6: {
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },
  },

  /**
   * Body Text Styles
   * For paragraphs, content, descriptions
   */
  body: {
    /**
     * Large body text
     */
    large: {
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.relaxed,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },

    /**
     * Default body text
     */
    default: {
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },

    /**
     * Small body text
     */
    small: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },
  },

  /**
   * Label Styles
   * For form labels, metadata, captions
   */
  label: {
    /**
     * Default label
     */
    default: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.medium,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },

    /**
     * Small label
     */
    small: {
      fontSize: FONT_SIZES.xs,
      fontWeight: FONT_WEIGHTS.medium,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.sans,
    },
  },

  /**
   * Code Styles
   * For code blocks, inline code, technical content
   */
  code: {
    /**
     * Inline code
     */
    inline: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.mono,
    },

    /**
     * Code block
     */
    block: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.relaxed,
      letterSpacing: LETTER_SPACING.normal,
      fontFamily: FONT_FAMILIES.mono,
    },
  },
} as const;
