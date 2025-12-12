/**
 * Spacing Design Tokens
 *
 * Comprehensive spacing system with scale and semantic spacing tokens.
 * Provides semantic spacing patterns for margins, padding, and gaps.
 *
 * Architecture:
 * - Spacing scale (micro through hero)
 * - Semantic spacing (margin, padding, gap)
 * - All values in rem units
 *
 * Usage:
 * ```tsx
 * import { SPACING } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Semantic spacing
 * <div style={{ marginBottom: SPACING.marginBottom.default }}>
 * <div style={{ padding: SPACING.padding.comfortable }}>
 * <div style={{ gap: SPACING.gap.tight }}>
 * ```
 *
 * @module web-runtime/design-tokens/spacing
 */

export * from './scale.ts';
export * from './semantic.ts';

import { SPACING_SCALE } from './scale.ts';
import { SEMANTIC_SPACING } from './semantic.ts';

/**
 * Complete Spacing Design Tokens
 * Organized by category (scale, margin, marginBottom, marginTop, padding, gap)
 */
export const SPACING = {
  scale: SPACING_SCALE,
  margin: SEMANTIC_SPACING.margin,
  marginBottom: SEMANTIC_SPACING.marginBottom,
  marginTop: SEMANTIC_SPACING.marginTop,
  padding: SEMANTIC_SPACING.padding,
  gap: SEMANTIC_SPACING.gap,
} as const;
