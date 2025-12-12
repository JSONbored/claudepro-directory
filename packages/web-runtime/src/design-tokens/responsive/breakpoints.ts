/**
 * Breakpoint Tokens
 *
 * Responsive breakpoints for mobile, tablet, desktop, and wide screens.
 * Based on standard viewport sizes and device categories.
 *
 * @module web-runtime/design-tokens/responsive/breakpoints
 */

/**
 * Breakpoint Tokens
 * Standard breakpoints in pixels
 */
export const BREAKPOINTS = {
  /**
   * Mobile - 320px
   * Small phones and devices
   */
  mobile: 320,

  /**
   * Tablet - 768px
   * Tablets and small laptops
   */
  tablet: 768,

  /**
   * Desktop - 1024px
   * Standard desktop screens
   */
  desktop: 1024,

  /**
   * Wide - 1280px
   * Large desktop screens
   */
  wide: 1280,

  /**
   * Ultra - 1920px
   * Very large screens
   */
  ultra: 1920,
} as const;

/**
 * Breakpoint Media Queries
 * Ready-to-use media query strings
 */
export const BREAKPOINT_QUERIES = {
  /**
   * Mobile and up
   */
  mobileUp: `(min-width: ${BREAKPOINTS.mobile}px)`,

  /**
   * Tablet and up
   */
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,

  /**
   * Desktop and up
   */
  desktopUp: `(min-width: ${BREAKPOINTS.desktop}px)`,

  /**
   * Wide and up
   */
  wideUp: `(min-width: ${BREAKPOINTS.wide}px)`,

  /**
   * Ultra and up
   */
  ultraUp: `(min-width: ${BREAKPOINTS.ultra}px)`,

  /**
   * Mobile only
   */
  mobileOnly: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,

  /**
   * Tablet only
   */
  tabletOnly: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,

  /**
   * Desktop only
   */
  desktopOnly: `(min-width: ${BREAKPOINTS.desktop}px) and (max-width: ${BREAKPOINTS.wide - 1}px)`,
} as const;
