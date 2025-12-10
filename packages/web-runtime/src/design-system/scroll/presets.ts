/**
 * Scroll Animation Presets
 *
 * Common scroll-linked animation patterns.
 * Input ranges: [0, 1] (scroll progress from start to end)
 * Output ranges: animation values (opacity, scale, y, etc.)
 *
 * @module web-runtime/design-system/scroll/presets
 */

/**
 * Scroll Animation Presets
 * Each preset defines input and output ranges for useTransform
 */
export const SCROLL_PRESETS = {
  /**
   * Blur in as user scrolls down
   * Input: [0, 0.2] means animation happens in first 20% of scroll
   * Output: [10, 0] means blur goes from 10px to 0
   */
  blurIn: {
    input: [0, 0.2] as const,
    output: [10, 0] as const,
  },

  /**
   * Fade in as user scrolls down
   * Input: [0, 0.2] means animation happens in first 20% of scroll
   * Output: [0, 1] means opacity goes from 0 to 1
   */
  fadeIn: {
    input: [0, 0.2] as const,
    output: [0, 1] as const,
  },

  /**
   * Fade out as user scrolls down
   * Input: [0.8, 1] means animation happens in last 20% of scroll
   * Output: [1, 0] means opacity goes from 1 to 0
   */
  fadeOut: {
    input: [0.8, 1] as const,
    output: [1, 0] as const,
  },

  /**
   * Scale up as user scrolls down
   * Input: [0, 0.3] means animation happens in first 30% of scroll
   * Output: [0.8, 1] means scale goes from 0.8 to 1
   */
  scaleUp: {
    input: [0, 0.3] as const,
    output: [0.8, 1] as const,
  },

  /**
   * Slide down as user scrolls down
   * Input: [0, 0.25] means animation happens in first 25% of scroll
   * Output: [-50, 0] means y goes from -50px to 0
   */
  slideDown: {
    input: [0, 0.25] as const,
    output: [-50, 0] as const,
  },

  /**
   * Slide up as user scrolls down
   * Input: [0, 0.25] means animation happens in first 25% of scroll
   * Output: [50, 0] means y goes from 50px to 0
   */
  slideUp: {
    input: [0, 0.25] as const,
    output: [50, 0] as const,
  },

  /**
   * Hero fade out - Hero content fades as user scrolls down
   * Input: [0, 0.3] means animation happens in first 30% of scroll
   * Output: [1, 0] means opacity goes from 1 to 0
   */
  heroFade: {
    input: [0, 0.3] as const,
    output: [1, 0] as const,
  },

  /**
   * Hero scale down - Hero content scales down as user scrolls
   * Input: [0, 0.3] means animation happens in first 30% of scroll
   * Output: [1, 0.95] means scale goes from 1 to 0.95
   */
  heroScale: {
    input: [0, 0.3] as const,
    output: [1, 0.95] as const,
  },
} as const;
