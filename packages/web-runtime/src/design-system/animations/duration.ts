/**
 * Duration Presets
 *
 * Standard animation durations in seconds.
 * Self-contained semantic values (v2 design system).
 *
 * Architecture:
 * - Semantic naming (describes purpose, not implementation)
 * - Optimized for perceived performance
 * - Follows Material Design timing guidelines
 *
 * @module web-runtime/design-system/animations/duration
 */

/**
 * Duration Presets
 * All values in seconds (Motion.dev standard)
 */
export const DURATION = {
  /**
   * Micro duration - Very quick animations
   * Best for: Dropdown transitions, quick state changes
   * Perceived as: Instant, snappy
   */
  micro: 0.1,

  /**
   * Fast duration - Quick feedback
   * Best for: Icon state changes, tooltip entrance
   * Perceived as: Instant, responsive
   */
  fast: 0.15,

  /**
   * Quick duration - Rapid animations
   * Best for: Form field transitions, button feedback
   * Perceived as: Quick, responsive
   */
  quick: 0.2,

  /**
   * Comfortable duration - Balanced quick animations
   * Best for: Modal transitions, card animations
   * Perceived as: Comfortable, balanced
   */
  comfortable: 0.25,

  /**
   * Default duration - Standard animations
   * Best for: Button interactions, card hovers
   * Perceived as: Smooth, natural
   */
  default: 0.3,

  /**
   * Balanced duration - Between default and slow
   * Best for: Card transitions, view transitions
   * Perceived as: Balanced, smooth
   */
  balanced: 0.35,

  /**
   * Slow duration - Deliberate animations
   * Best for: Page transitions, modal entrances
   * Perceived as: Deliberate, premium
   */
  slow: 0.4,

  /**
   * Moderate duration - Balanced animations
   * Best for: Auth panels, form submissions
   * Perceived as: Balanced, smooth
   */
  moderate: 0.5,

  /**
   * Extended duration - Longer animations
   * Best for: Brand panels, hero sections
   * Perceived as: Extended, deliberate
   */
  extended: 0.6,

  /**
   * Relaxed duration - Between extended and long
   * Best for: View transitions, circle blur effects
   * Perceived as: Relaxed, smooth
   */
  relaxed: 0.7,

  /**
   * Long duration - Extended animations
   * Best for: Loading spinners, rotation animations
   * Perceived as: Long, deliberate
   */
  long: 0.8,

  /**
   * Very long duration - Extended animations
   * Best for: Complex animations, rotation loops
   * Perceived as: Very long, premium
   */
  veryLong: 1.0,

  /**
   * Extended long duration - Very extended animations
   * Best for: Search animations, magnetic effects
   * Perceived as: Extended long, premium
   */
  extendedLong: 1.2,

  /**
   * Very extended duration - Maximum animations
   * Best for: Loading shimmer, complex sequences
   * Perceived as: Very extended, maximum
   */
  veryExtended: 1.5,

  /**
   * Maximum duration - Absolute maximum animations
   * Best for: Hero animations, gradient text
   * Perceived as: Maximum, premium
   */
  maximum: 2.0,

  /**
   * Extra long duration - Beyond maximum animations
   * Best for: Badge animations, special effects
   * Perceived as: Extra long, special
   */
  extraLong: 2.5,

  /**
   * Extreme duration - Extreme animations
   * Best for: Gradient text, complex effects
   * Perceived as: Extreme, special
   */
  extreme: 3.0,

  /**
   * Hero duration - Hero-level animations
   * Best for: Hero sections, prominent effects
   * Perceived as: Hero, prominent
   */
  hero: 5.0,

  /**
   * Subtle duration - Subtle, long animations
   * Best for: Subtle gradient effects
   * Perceived as: Subtle, long
   */
  subtle: 8.0,

  /**
   * Beam duration - Border beam animations
   * Best for: Border beam effects
   * Perceived as: Beam, special
   */
  beam: 15.0,

  /**
   * Morphing duration - Morphing blob animations
   * Best for: Morphing blob backgrounds
   * Perceived as: Morphing, special
   */
  morphing: 20.0,
} as const;
