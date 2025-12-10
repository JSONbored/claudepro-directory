/**
 * Responsive Design Tokens
 *
 * Responsive system with breakpoints and responsive token variations.
 * Provides breakpoints and responsive spacing/typography tokens.
 *
 * Architecture:
 * - Breakpoints (mobile, tablet, desktop, wide, ultra)
 * - Breakpoint media queries (ready-to-use)
 * - Responsive spacing (adapts to screen size)
 * - Responsive typography (adapts to screen size)
 *
 * Usage:
 * ```tsx
 * import { RESPONSIVE } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Breakpoints
 * const isMobile = window.innerWidth < RESPONSIVE.breakpoints.tablet;
 *
 * // Responsive spacing
 * <div style={{ padding: RESPONSIVE.spacing.padding.mobile.default }}>
 * ```
 *
 * @module web-runtime/design-tokens/responsive
 */

export * from './breakpoints.ts';
export * from './spacing.ts';
export * from './typography.ts';

import { BREAKPOINTS, BREAKPOINT_QUERIES } from './breakpoints.ts';
import { RESPONSIVE_SPACING } from './spacing.ts';
import { RESPONSIVE_TYPOGRAPHY } from './typography.ts';

/**
 * Complete Responsive Design Tokens
 * Organized by category (breakpoints, spacing, typography)
 */
export const RESPONSIVE = {
  breakpoints: BREAKPOINTS,
  breakpointQueries: BREAKPOINT_QUERIES,
  spacing: RESPONSIVE_SPACING,
  typography: RESPONSIVE_TYPOGRAPHY,
} as const;
