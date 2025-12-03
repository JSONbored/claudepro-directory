/**
 * Radius Style Utilities
 *
 * Composable patterns for border-radius styling.
 * Provides semantic radius values for consistent rounded corners.
 *
 * @module web-runtime/design-system/styles/radius
 */

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Standard border-radius utilities.
 */
export const radius = {
  /** No rounding */
  none: 'rounded-none',
  /** Extra small (2px) */
  xs: 'rounded-xs',
  /** Small (4px) */
  sm: 'rounded-sm',
  /** Default (6px) */
  default: 'rounded',
  /** Medium (6px) - same as default */
  md: 'rounded-md',
  /** Large (8px) */
  lg: 'rounded-lg',
  /** Extra large (12px) */
  xl: 'rounded-xl',
  /** 2XL (16px) */
  '2xl': 'rounded-2xl',
  /** 3XL (24px) */
  '3xl': 'rounded-3xl',
  /** Full/pill (9999px) */
  full: 'rounded-full',
  /** Inherit border-radius from parent */
  inherit: 'rounded-[inherit]',
} as const;

/**
 * Radius with specific side applications.
 */
export const radiusTop = {
  none: 'rounded-t-none',
  sm: 'rounded-t-sm',
  default: 'rounded-t',
  md: 'rounded-t-md',
  lg: 'rounded-t-lg',
  xl: 'rounded-t-xl',
  '2xl': 'rounded-t-2xl',
} as const;

export const radiusBottom = {
  none: 'rounded-b-none',
  sm: 'rounded-b-sm',
  default: 'rounded-b',
  md: 'rounded-b-md',
  lg: 'rounded-b-lg',
  xl: 'rounded-b-xl',
  '2xl': 'rounded-b-2xl',
} as const;

export const radiusLeft = {
  none: 'rounded-l-none',
  sm: 'rounded-l-sm',
  default: 'rounded-l',
  md: 'rounded-l-md',
  lg: 'rounded-l-lg',
  xl: 'rounded-l-xl',
} as const;

export const radiusRight = {
  none: 'rounded-r-none',
  sm: 'rounded-r-sm',
  default: 'rounded-r',
  md: 'rounded-r-md',
  lg: 'rounded-r-lg',
  xl: 'rounded-r-xl',
} as const;

// =============================================================================
// COMPOSITE RADIUS PATTERNS
// =============================================================================

/**
 * Common composite radius patterns.
 */
export const radiusComposite = {
  /** Card-like rounding (lg) */
  card: 'rounded-lg',
  /** Button rounding (md) */
  button: 'rounded-md',
  /** Badge/pill rounding (full) */
  badge: 'rounded-full',
  /** Input field rounding (lg) */
  input: 'rounded-lg',
  /** Modal/dialog rounding (xl) */
  modal: 'rounded-xl',
  /** Tooltip rounding (md) */
  tooltip: 'rounded-md',
  /** Avatar rounding (full) */
  avatar: 'rounded-full',
  /** Tag rounding (md) */
  tag: 'rounded-md',
} as const;

/**
 * Responsive radius utilities.
 */
export const radiusResponsive = {
  /** sm:rounded-lg - Large radius at sm breakpoint */
  smLg: 'sm:rounded-lg',
} as const;
