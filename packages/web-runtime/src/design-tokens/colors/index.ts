/**
 * Color Design Tokens
 *
 * Comprehensive color system with semantic colors, palette, and theme modes.
 * Uses OKLCH color space for perceptual uniformity and future-proofing.
 *
 * Architecture:
 * - Base palette (brand colors, neutrals, states)
 * - Semantic mapping (primary, secondary, background, text, border)
 * - Theme modes (light, dark, high-contrast)
 * - All colors in OKLCH format
 *
 * Usage:
 * ```tsx
 * import { COLORS } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Semantic colors (theme-aware)
 * <div style={{ color: COLORS.semantic.text.primary.dark }}>
 * <div style={{ backgroundColor: COLORS.semantic.background.primary.dark }}>
 *
 * // Mode-specific colors
 * <div style={{ color: COLORS.modes.dark.text.primary }}>
 * ```
 *
 * @module web-runtime/design-tokens/colors
 */

export * from './palette.ts';
export * from './semantic.ts';
export * from './modes.ts';

import { BRAND_COLORS, NEUTRAL_COLORS, STATE_COLORS } from './palette.ts';
import { SEMANTIC_COLORS } from './semantic.ts';
import { MODE_COLORS } from './modes.ts';

/**
 * Complete Color Design Tokens
 * Organized by category (palette, semantic, modes)
 */
export const COLORS = {
  /**
   * Base Color Palette
   * Raw colors before semantic mapping
   */
  palette: {
    brand: BRAND_COLORS,
    neutral: NEUTRAL_COLORS,
    state: STATE_COLORS,
  },

  /**
   * Semantic Colors
   * Purpose-based color tokens (primary, background, text, etc.)
   */
  semantic: SEMANTIC_COLORS,

  /**
   * Theme Mode Colors
   * Colors organized by theme mode (light, dark, high-contrast)
   */
  modes: MODE_COLORS,
} as const;
