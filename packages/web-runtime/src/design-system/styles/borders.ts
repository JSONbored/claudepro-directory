/**
 * Border Style Utilities
 *
 * Composable patterns for border styling.
 * Provides semantic border patterns for consistent edge treatments.
 *
 * @module web-runtime/design-system/styles/borders
 */

// =============================================================================
// BASE BORDER PATTERNS
// =============================================================================

/**
 * Standard border utilities with default border color.
 */
export const border = {
  /** No border */
  none: 'border-0',
  /** Default border (1px solid) */
  default: 'border border-border',
  /** Light/subtle border */
  light: 'border border-border/50',
  /** Strong border (2px) */
  strong: 'border-2 border-border',
  /** Accent colored border */
  accent: 'border border-accent/30',
  /** Dashed border */
  dashed: 'border border-dashed border-border/50',
  /** Dotted border */
  dotted: 'border border-dotted border-border/50',
} as const;

// =============================================================================
// DIRECTIONAL BORDERS
// =============================================================================

/**
 * Top border utilities.
 */
export const borderTop = {
  none: 'border-t-0',
  default: 'border-t border-border',
  light: 'border-t border-border/50',
  strong: 'border-t-2 border-border',
  accent: 'border-t border-accent/30',
} as const;

/**
 * Bottom border utilities.
 */
export const borderBottom = {
  none: 'border-b-0',
  default: 'border-b border-border',
  light: 'border-b border-border/50',
  strong: 'border-b-2 border-border',
  accent: 'border-b border-accent/30',
} as const;

/**
 * Left border utilities.
 */
export const borderLeft = {
  none: 'border-l-0',
  default: 'border-l border-border',
  light: 'border-l border-border/50',
  strong: 'border-l-2 border-border',
  accent: 'border-l border-accent/30',
} as const;

/**
 * Right border utilities.
 */
export const borderRight = {
  none: 'border-r-0',
  default: 'border-r border-border',
  light: 'border-r border-border/50',
  strong: 'border-r-2 border-border',
  accent: 'border-r border-accent/30',
} as const;

// =============================================================================
// AXIS BORDERS
// =============================================================================

/**
 * Horizontal (x-axis) border utilities.
 */
export const borderX = {
  none: 'border-x-0',
  default: 'border-x border-border',
  light: 'border-x border-border/50',
} as const;

/**
 * Vertical (y-axis) border utilities.
 */
export const borderY = {
  none: 'border-y-0',
  default: 'border-y border-border',
  light: 'border-y border-border/50',
} as const;

// =============================================================================
// SEMANTIC BORDERS
// =============================================================================

/**
 * Semantic border utilities for status indication.
 */
export const borderSemantic = {
  /** Success state */
  success: 'border border-success-border',
  /** Warning state */
  warning: 'border border-warning-border',
  /** Error state */
  error: 'border border-error-border',
  /** Info state */
  info: 'border border-info-border',
} as const;

// =============================================================================
// COMPONENT-SPECIFIC BORDERS
// =============================================================================

/**
 * Card border patterns.
 */
export const borderCard = {
  /** Default card border */
  default: 'border border-border',
  /** Subtle card border */
  subtle: 'border border-border/50',
  /** Interactive card border */
  interactive: 'border border-border/50 hover:border-accent/20',
  /** Featured card border */
  featured: 'border-2 border-orange-500/50',
  /** Selected card border */
  selected: 'border-2 border-accent',
} as const;

/**
 * Input border patterns.
 */
export const borderInput = {
  /** Default input border */
  default: 'border border-input',
  /** Focus state */
  focus: 'border border-accent focus:border-accent',
  /** Error state */
  error: 'border border-error',
  /** Success state */
  success: 'border border-success',
} as const;

/**
 * Divider patterns (horizontal lines).
 */
export const divider = {
  /** Default horizontal divider */
  default: 'border-t border-border',
  /** Light divider */
  light: 'border-t border-border/50',
  /** Strong divider */
  strong: 'border-t-2 border-border',
  /** Accent divider */
  accent: 'border-t border-accent/30',
  /** With vertical margin */
  spaced: 'border-t border-border my-4',
  /** With more vertical margin */
  spacedLarge: 'border-t border-border my-6',
} as const;

// =============================================================================
// BORDER WIDTH UTILITIES
// =============================================================================

/**
 * Border width utilities.
 */
export const borderWidth = {
  '0': 'border-0',
  '1': 'border',
  '2': 'border-2',
  '4': 'border-4',
  '8': 'border-8',
} as const;
