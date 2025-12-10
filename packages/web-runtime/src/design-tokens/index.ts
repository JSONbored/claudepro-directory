/**
 * Design Tokens V2 - Comprehensive Semantic Design Token System
 *
 * Central export point for all semantic design tokens.
 * This is the new comprehensive design token system, providing:
 * - Colors (semantic, palette, modes)
 * - Typography (fonts, sizes, weights, line heights, letter spacing)
 * - Spacing (scale, semantic spacing)
 * - Shadows (elevation-based)
 * - States (loading, error, success, warning, info, disabled)
 * - Accessibility (focus, contrast, motion)
 * - Responsive (breakpoints, responsive tokens)
 *
 * Architecture:
 * - Self-contained semantic values (no external dependencies)
 * - Type-safe with const assertions
 * - Organized by domain (colors, typography, spacing, etc.)
 * - Semantic naming (describes purpose, not implementation)
 * - Compatible with existing V2 design system (animations, microinteractions)
 *
 * Usage:
 * ```tsx
 * import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, STATES } from '@heyclaude/web-runtime/design-tokens';
 *
 * <div className={`${SPACING.marginBottom.default} ${TYPOGRAPHY.fontSizes.sm} ${COLORS.text.muted}`}>
 *   Content
 * </div>
 * ```
 *
 * @module web-runtime/design-tokens
 */

// Colors
export * from './colors/index.ts';
export { COLORS } from './colors/index.ts';

// Typography
export * from './typography/index.ts';
export { TYPOGRAPHY } from './typography/index.ts';

// Spacing
export * from './spacing/index.ts';
export { SPACING } from './spacing/index.ts';

// Shadows
export * from './shadows/index.ts';
export { SHADOWS } from './shadows/index.ts';

// States
export * from './states/index.ts';
export { STATES } from './states/index.ts';

// Accessibility
export * from './accessibility/index.ts';
export { ACCESSIBILITY } from './accessibility/index.ts';

// Responsive
export * from './responsive/index.ts';
export { RESPONSIVE } from './responsive/index.ts';
