/**
 * Font Family Tokens
 *
 * Font family definitions for sans-serif, monospace, and display fonts.
 *
 * @module web-runtime/design-tokens/typography/font-families
 */

/**
 * Font Family Tokens
 * Semantic font family definitions
 */
export const FONT_FAMILIES = {
  /**
   * Sans-serif font family
   * Primary font for UI text, body text, labels
   * Uses Inter with system font fallbacks
   */
  sans: [
    'var(--font-inter, "Inter")',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],

  /**
   * Monospace font family
   * For code, technical content, terminal output
   * Uses Geist Mono with system monospace fallbacks
   */
  mono: [
    'var(--font-geist-mono, "GeistMono")',
    '"SF Mono"',
    'Consolas',
    '"Monaco"',
    'monospace',
  ],

  /**
   * Display font family
   * For headings, large text, hero sections
   * Uses Geist with system font fallbacks
   */
  display: [
    'var(--font-geist, "Geist")',
    'system-ui',
    '-apple-system',
    'sans-serif',
  ],
} as const;
