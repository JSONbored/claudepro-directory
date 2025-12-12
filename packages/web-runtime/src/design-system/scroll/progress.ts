/**
 * Scroll Progress Indicators
 *
 * Configurations for scroll progress bars and indicators.
 * Useful for reading progress, section progress, etc.
 *
 * @module web-runtime/design-system/scroll/progress
 */

/**
 * Scroll Progress Indicators
 */
export const PROGRESS = {
  /**
   * Reading progress - Full page scroll progress
   * Input: [0, 1] (entire scroll range)
   * Output: [0, 100] (percentage)
   */
  reading: {
    input: [0, 1] as const,
    output: [0, 100] as const,
  },

  /**
   * Section progress - Progress within a specific section
   * Input: [0, 1] (section scroll range)
   * Output: [0, 100] (percentage)
   */
  section: {
    input: [0, 1] as const,
    output: [0, 100] as const,
  },
} as const;
