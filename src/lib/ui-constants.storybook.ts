/**
 * UI Constants - Storybook-Only Export
 *
 * Lightweight export of ONLY the viewport/breakpoint constants needed by Storybook.
 * Does NOT import the full ui-constants.ts file to avoid pulling in server-side dependencies.
 *
 * **Architecture**: This file prevents Storybook from loading the full dependency chain:
 * ui-constants → category-config → content schemas → server code
 *
 * **Usage**: Import from this file in .storybook/preview.ts instead of ui-constants.ts
 */

/**
 * Responsive Breakpoints (Mobile-First)
 * These match Tailwind CSS breakpoints and are used for viewport testing
 */
export const BREAKPOINTS = {
  /** Mobile: < 768px (default, no prefix) */
  mobile: 375,
  /** Tablet: ≥ 768px (md: prefix) */
  tablet: 768,
  /** Desktop: ≥ 1024px (lg: prefix) */
  desktop: 1024,
  /** Wide: ≥ 1280px (xl: prefix) */
  wide: 1280,
  /** Ultra: ≥ 1536px (2xl: prefix) */
  ultra: 1536,
} as const;

/**
 * Viewport Presets for Component Testing
 * Provides realistic device dimensions for responsive testing
 */
export const VIEWPORT_PRESETS = {
  /** iPhone SE (2nd gen) - Small mobile */
  iphoneSE: {
    width: 375,
    height: 667,
  },
  /** iPhone 13 - Modern mobile */
  iphone13: {
    width: 390,
    height: 844,
  },
  /** iPad (Portrait) - Tablet portrait */
  ipadPortrait: {
    width: 810,
    height: 1080,
  },
  /** iPad (Landscape) - Tablet landscape */
  ipadLandscape: {
    width: 1080,
    height: 810,
  },
  /** 13" Laptop - Small desktop */
  laptop: {
    width: 1440,
    height: 900,
  },
  /** 1080p Desktop - Full HD */
  desktop1080p: {
    width: 1920,
    height: 1080,
  },
} as const;
