/**
 * Shadow Design Tokens
 *
 * Elevation-based shadow system for depth and hierarchy.
 * Provides shadows for different elevation levels in light and dark modes.
 *
 * Architecture:
 * - Elevation levels (subtle, small, default, medium, large, stronger)
 * - Theme-aware (light/dark mode shadows)
 * - OKLCH color space for shadows
 *
 * Usage:
 * ```tsx
 * import { SHADOWS } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Elevation shadows
 * <div style={{ boxShadow: SHADOWS.elevation.dark.default }}>
 * <div style={{ boxShadow: SHADOWS.elevation.light.medium }}>
 * ```
 *
 * @module web-runtime/design-tokens/shadows
 */

export * from './elevation.ts';

import { SHADOW_ELEVATION } from './elevation.ts';

/**
 * Complete Shadow Design Tokens
 * Organized by elevation level and theme mode
 */
export const SHADOWS = {
  elevation: SHADOW_ELEVATION,
} as const;
