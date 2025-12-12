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
   * Micro stagger - Very quick sequential animations
   * Best for: Tight lists, rapid reveals, dropdown menus
   * Creates: Quick, snappy cascade
   */
  micro: 0.05,

  /**
   * Tight stagger - Quick sequential animations
   * Best for: Type selection cards, compact reveals
   * Creates: Tight, rapid cascade
   */
  tight: 0.08,

  /**
   * Fast stagger - Quick sequential animations
   * Best for: Small lists, quick reveals
   * Creates: Rapid, energetic cascade
   */
  fast: 0.1,

  /**
   * Medium stagger - Moderate sequential animations
   * Best for: Navigation items, form fields
   * Creates: Balanced, smooth cascade
   */
  medium: 0.15,

  /**
   * Default stagger - Standard sequential animations
   * Best for: Card grids, content lists
   * Creates: Smooth, natural cascade
   */
  default: 0.2,

  /**
   * Comfortable stagger - Moderate extended sequential animations
   * Best for: Newsletter CTAs, balanced reveals
   * Creates: Comfortable, balanced cascade
   */
  comfortable: 0.25,

  /**
   * Slow stagger - Deliberate sequential animations
   * Best for: Hero sections, important reveals
   * Creates: Dramatic, premium cascade
   */
  slow: 0.3,

  /**
   * Relaxed stagger - Extended sequential animations
   * Best for: Success messages, multi-step reveals
   * Creates: Spacious, deliberate cascade
   */
  relaxed: 0.4,

  /**
   * Loose stagger - Very extended sequential animations
   * Best for: Complex forms, detailed reveals
   * Creates: Very spacious, premium cascade
   */
  loose: 0.5,

  /**
   * Extended stagger - Maximum sequential animations
   * Best for: Complex multi-step reveals, detailed animations
   * Creates: Maximum spacing, very deliberate cascade
   */
  extended: 0.6,

  /**
   * Very extended stagger - Extra long sequential animations
   * Best for: Multi-step forms, complex reveals
   * Creates: Very spacious, premium cascade
   */
  veryExtended: 0.7,

  /**
   * Maximum stagger - Longest sequential animations
   * Best for: Complex workflows, detailed multi-step reveals
   * Creates: Maximum spacing, very deliberate cascade
   */
  maximum: 0.8,

  /**
   * Ultimate stagger - Absolute maximum sequential animations
   * Best for: Final steps, completion states, trust signals
   * Creates: Ultimate spacing, very deliberate cascade
   */
  ultimate: 1.0,
} as const;
