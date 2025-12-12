/**
 * Letter Spacing Tokens
 *
 * Letter spacing scale for typography refinement.
 *
 * @module web-runtime/design-tokens/typography/letter-spacing
 */

/**
 * Letter Spacing Tokens
 * Semantic letter spacing definitions
 */
export const LETTER_SPACING = {
  /**
   * Tighter - -0.05em
   * Best for: Large headings, display text
   */
  tighter: '-0.05em',

  /**
   * Tight - -0.025em
   * Best for: Headings, compact text
   */
  tight: '-0.025em',

  /**
   * Normal - 0
   * Best for: Body text, default spacing
   */
  normal: '0',

  /**
   * Wide - 0.025em
   * Best for: Uppercase text, labels
   */
  wide: '0.025em',

  /**
   * Wider - 0.05em
   * Best for: Uppercase headings, emphasis
   */
  wider: '0.05em',

  /**
   * Widest - 0.1em
   * Best for: Large uppercase text, display
   */
  widest: '0.1em',
} as const;
