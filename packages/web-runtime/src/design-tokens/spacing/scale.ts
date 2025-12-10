/**
 * Spacing Scale
 *
 * Base spacing scale using semantic naming (tight, comfortable, relaxed, etc.).
 * Values in rem units for consistency and accessibility.
 *
 * @module web-runtime/design-tokens/spacing/scale
 */

/**
 * Spacing Scale Tokens
 * Semantic spacing values in rem
 */
export const SPACING_SCALE = {
  /**
   * Micro - 0.125rem (2px)
   * Best for: Tight spacing, icon padding
   */
  micro: '0.125rem', // 2px

  /**
   * Tight - 0.25rem (4px)
   * Best for: Compact spacing, small gaps
   */
  tight: '0.25rem', // 4px

  /**
   * Compact - 0.5rem (8px)
   * Best for: Small spacing, tight layouts
   */
  compact: '0.5rem', // 8px

  /**
   * Default - 0.75rem (12px)
   * Best for: Standard spacing, default gaps
   */
  default: '0.75rem', // 12px

  /**
   * Comfortable - 1rem (16px)
   * Best for: Comfortable spacing, standard padding
   */
  comfortable: '1rem', // 16px

  /**
   * Relaxed - 1.5rem (24px)
   * Best for: Relaxed spacing, section padding
   */
  relaxed: '1.5rem', // 24px

  /**
   * Loose - 2rem (32px)
   * Best for: Loose spacing, large gaps
   */
  loose: '2rem', // 32px

  /**
   * Section - 3rem (48px)
   * Best for: Section spacing, large margins
   */
  section: '3rem', // 48px

  /**
   * Hero - 4rem (64px)
   * Best for: Hero spacing, very large margins
   */
  hero: '4rem', // 64px
} as const;
