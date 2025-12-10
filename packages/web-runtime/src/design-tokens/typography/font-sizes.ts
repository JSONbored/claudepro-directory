/**
 * Font Size Tokens
 *
 * Typography size scale using modular scale (1.125 ratio).
 * Provides semantic sizes (xs, sm, base, lg, xl, etc.) with responsive variants.
 *
 * @module web-runtime/design-tokens/typography/font-sizes
 */

/**
 * Font Size Tokens
 * Semantic font size definitions
 */
export const FONT_SIZES = {
  /**
   * Extra small - 12px (0.75rem)
   * Best for: Labels, captions, metadata
   */
  xs: '0.75rem', // 12px

  /**
   * Small - 14px (0.875rem)
   * Best for: Secondary text, helper text
   */
  sm: '0.875rem', // 14px

  /**
   * Base - 16px (1rem)
   * Best for: Body text, default text size
   */
  base: '1rem', // 16px

  /**
   * Large - 18px (1.125rem)
   * Best for: Emphasized body text, lead paragraphs
   */
  lg: '1.125rem', // 18px

  /**
   * Extra large - 20px (1.25rem)
   * Best for: Subheadings, section titles
   */
  xl: '1.25rem', // 20px

  /**
   * 2XL - 24px (1.5rem)
   * Best for: H3 headings, card titles
   */
  '2xl': '1.5rem', // 24px

  /**
   * 3XL - 30px (1.875rem)
   * Best for: H2 headings, page titles
   */
  '3xl': '1.875rem', // 30px

  /**
   * 4XL - 36px (2.25rem)
   * Best for: H1 headings, hero titles
   */
  '4xl': '2.25rem', // 36px

  /**
   * 5XL - 48px (3rem)
   * Best for: Large hero titles, display text
   */
  '5xl': '3rem', // 48px
} as const;
