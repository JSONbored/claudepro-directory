/**
 * Stagger Configurations
 *
 * For animating lists of items with sequential delays.
 * Creates beautiful cascading effects for card grids, lists, etc.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Values in seconds (Motion.dev standard)
 * - Optimized for visual rhythm and flow
 *
 * @module web-runtime/design-system/animations/stagger
 */

/**
 * Stagger Configurations
 * All values in seconds (delay between each item)
 */
export const STAGGER = {
  /**
   * Default stagger - Standard sequential animations
   * Best for: Card grids, content lists
   * Creates: Smooth, natural cascade
   */
  default: 0.2,

  /**
   * Fast stagger - Quick sequential animations
   * Best for: Small lists, quick reveals
   * Creates: Rapid, energetic cascade
   */
  fast: 0.1,

  /**
   * Slow stagger - Deliberate sequential animations
   * Best for: Hero sections, important reveals
   * Creates: Dramatic, premium cascade
   */
  slow: 0.3,
} as const;
