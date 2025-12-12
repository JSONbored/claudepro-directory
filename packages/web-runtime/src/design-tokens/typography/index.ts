/**
 * Typography Design Tokens
 *
 * Comprehensive typography system with font families, sizes, weights, line heights, and letter spacing.
 * Provides semantic typography patterns for headings, body text, labels, and code.
 *
 * Architecture:
 * - Font families (sans, mono, display)
 * - Font sizes (xs through 5xl)
 * - Font weights (light through bold)
 * - Line heights (tight through loose)
 * - Letter spacing (tighter through widest)
 * - Semantic typography (heading, body, label, code)
 *
 * Usage:
 * ```tsx
 * import { TYPOGRAPHY } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Individual tokens
 * <div style={{ fontSize: TYPOGRAPHY.fontSizes.lg }}>
 * <div style={{ fontWeight: TYPOGRAPHY.fontWeights.semibold }}>
 *
 * // Semantic patterns
 * <h1 style={TYPOGRAPHY.semantic.heading.h1}>
 * <p style={TYPOGRAPHY.semantic.body.default}>
 * ```
 *
 * @module web-runtime/design-tokens/typography
 */

export * from './font-families.ts';
export * from './font-sizes.ts';
export * from './font-weights.ts';
export * from './line-heights.ts';
export * from './letter-spacing.ts';
export * from './semantic.ts';

import { FONT_FAMILIES } from './font-families.ts';
import { FONT_SIZES } from './font-sizes.ts';
import { FONT_WEIGHTS } from './font-weights.ts';
import { LINE_HEIGHTS } from './line-heights.ts';
import { LETTER_SPACING } from './letter-spacing.ts';
import { SEMANTIC_TYPOGRAPHY } from './semantic.ts';

/**
 * Complete Typography Design Tokens
 * Organized by category (fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing, semantic)
 */
export const TYPOGRAPHY = {
  fontFamilies: FONT_FAMILIES,
  fontSizes: FONT_SIZES,
  fontWeights: FONT_WEIGHTS,
  lineHeights: LINE_HEIGHTS,
  letterSpacing: LETTER_SPACING,
  semantic: SEMANTIC_TYPOGRAPHY,
} as const;
