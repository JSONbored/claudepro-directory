/**
 * Blur Text Animation Variants
 *
 * Blur-to-focus text animation presets.
 * Creates modern, premium text reveal effects.
 *
 * @module web-runtime/design-system/text/blur
 */

/**
 * Blur Text Animation Variants
 */
export const BLUR = {
  /**
   * Bottom blur animation - Bottom to top
   * Creates: Blur → Focus effect from bottom
   */
  bottom: {
    from: {
      filter: 'blur(10px)',
      opacity: 0,
      y: 50,
    },
    to: [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: -5,
      },
      {
        filter: 'blur(0px)',
        opacity: 1,
        y: 0,
      },
    ],
  },

  /**
   * Default blur animation - Top to bottom
   * Creates: Blur → Focus effect from top
   */
  from: {
    filter: 'blur(10px)',
    opacity: 0,
    y: -50,
  },

  /**
   * Default blur animation - Steps
   * Creates: Multi-step blur reduction for smooth reveal
   */
  to: [
    {
      filter: 'blur(5px)',
      opacity: 0.5,
      y: 5,
    },
    {
      filter: 'blur(0px)',
      opacity: 1,
      y: 0,
    },
  ],
} as const;
