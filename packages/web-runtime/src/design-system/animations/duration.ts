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
   * Default duration - Standard animations
   * Best for: Button interactions, card hovers
   * Perceived as: Smooth, natural
   */
  default: 0.3,

  /**
   * Fast duration - Quick feedback
   * Best for: Icon state changes, tooltip entrance
   * Perceived as: Instant, responsive
   */
  fast: 0.15,

  /**
   * Slow duration - Deliberate animations
   * Best for: Page transitions, modal entrances
   * Perceived as: Deliberate, premium
   */
  slow: 0.4,
} as const;
