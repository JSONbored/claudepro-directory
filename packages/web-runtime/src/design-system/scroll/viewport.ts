/**
 * Viewport Configuration
 *
 * Standard viewport settings for scroll-triggered animations.
 * Used with whileInView, inView, and Intersection Observer.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Optimized for performance and UX
 * - Respects accessibility (once: true by default)
 *
 * @module web-runtime/design-system/scroll/viewport
 */

/**
 * Viewport Configuration Presets
 * Used with Motion.dev's viewport prop or Intersection Observer options
 */
export const VIEWPORT = {
  /**
   * Default viewport - Standard scroll-triggered animations
   * Best for: Most scroll animations
   * Features: Animate once, trigger before fully visible
   */
  default: {
    once: true,
    margin: '-100px',
    amount: 0.2, // 20% of element must be visible
  } as const,

  /**
   * Early trigger - Animations start before element enters viewport
   * Best for: Large sections, hero content
   * Features: More aggressive margin for earlier trigger
   */
  early: {
    once: true,
    margin: '-200px',
    amount: 0.1, // 10% of element must be visible
  } as const,

  /**
   * Late trigger - Animations start when element is mostly visible
   * Best for: Small elements, subtle reveals
   * Features: Tighter margin, more of element must be visible
   */
  late: {
    once: true,
    margin: '-50px',
    amount: 0.5, // 50% of element must be visible
  } as const,

  /**
   * Repeat - Animations trigger every time element enters viewport
   * Best for: Interactive elements, scroll indicators
   * Features: Re-triggers on every viewport entry
   */
  repeat: {
    once: false,
    margin: '-100px',
    amount: 0.2,
  } as const,
} as const;
