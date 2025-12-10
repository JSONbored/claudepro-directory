/**
 * Line Height Tokens
 *
 * Line height scale for optimal readability.
 *
 * @module web-runtime/design-tokens/typography/line-heights
 */

/**
 * Line Height Tokens
 * Semantic line height definitions
 */
export const LINE_HEIGHTS = {
  /**
   * Tight - 1.25
   * Best for: Headings, single-line text
   */
  tight: 1.25,

  /**
   * Snug - 1.375
   * Best for: Compact text, labels
   */
  snug: 1.375,

  /**
   * Normal - 1.5
   * Best for: Body text, default line height
   */
  normal: 1.5,

  /**
   * Relaxed - 1.625
   * Best for: Comfortable reading, long-form content
   */
  relaxed: 1.625,

  /**
   * Loose - 2
   * Best for: Spacious text, large display text
   */
  loose: 2,
} as const;
