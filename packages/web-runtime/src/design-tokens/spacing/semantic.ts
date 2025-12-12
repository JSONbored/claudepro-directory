/**
 * Semantic Spacing Tokens
 *
 * Pre-composed spacing patterns for common use cases.
 * Provides semantic spacing tokens (margin, padding, gap) using the spacing scale.
 *
 * @module web-runtime/design-tokens/spacing/semantic
 */

import { SPACING_SCALE } from './scale.ts';

/**
 * Semantic Spacing Tokens
 * Organized by spacing type (margin, padding, gap)
 */
export const SEMANTIC_SPACING = {
  /**
   * Margin Tokens
   * For spacing between elements
   */
  margin: {
    micro: SPACING_SCALE.micro,
    tight: SPACING_SCALE.tight,
    compact: SPACING_SCALE.compact,
    default: SPACING_SCALE.default,
    comfortable: SPACING_SCALE.comfortable,
    relaxed: SPACING_SCALE.relaxed,
    loose: SPACING_SCALE.loose,
    section: SPACING_SCALE.section,
    hero: SPACING_SCALE.hero,
  },

  /**
   * Margin Bottom Tokens
   * For vertical spacing below elements
   */
  marginBottom: {
    micro: SPACING_SCALE.micro,
    tight: SPACING_SCALE.tight,
    compact: SPACING_SCALE.compact,
    default: SPACING_SCALE.default,
    comfortable: SPACING_SCALE.comfortable,
    relaxed: SPACING_SCALE.relaxed,
    loose: SPACING_SCALE.loose,
    section: SPACING_SCALE.section,
    hero: SPACING_SCALE.hero,
  },

  /**
   * Margin Top Tokens
   * For vertical spacing above elements
   */
  marginTop: {
    micro: SPACING_SCALE.micro,
    tight: SPACING_SCALE.tight,
    compact: SPACING_SCALE.compact,
    default: SPACING_SCALE.default,
    comfortable: SPACING_SCALE.comfortable,
    relaxed: SPACING_SCALE.relaxed,
    loose: SPACING_SCALE.loose,
  },

  /**
   * Padding Tokens
   * For internal spacing within elements
   */
  padding: {
    micro: SPACING_SCALE.micro,
    tight: SPACING_SCALE.tight,
    compact: SPACING_SCALE.compact,
    default: SPACING_SCALE.default,
    comfortable: SPACING_SCALE.comfortable,
    relaxed: SPACING_SCALE.relaxed,
    loose: SPACING_SCALE.loose,
    section: SPACING_SCALE.section,
  },

  /**
   * Gap Tokens
   * For spacing in flex/grid layouts
   */
  gap: {
    micro: SPACING_SCALE.micro,
    tight: SPACING_SCALE.tight,
    compact: SPACING_SCALE.compact,
    default: SPACING_SCALE.default,
    comfortable: SPACING_SCALE.comfortable,
    relaxed: SPACING_SCALE.relaxed,
    loose: SPACING_SCALE.loose,
  },
} as const;
