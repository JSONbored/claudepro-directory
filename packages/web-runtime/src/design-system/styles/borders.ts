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
 * 
 * @migration Replaces inline `border border-border` patterns
 * @example
 * // ❌ OLD: className="border border-border"
 * // ✅ NEW: className={border.default}
 */
export const border = {
  /** border-0 - No border */
  none: 'border-0',
  /** border border-border - Default border (1px solid) */
  default: 'border border-border',
  /** border border-border/30 - Very faint border (30%) */
  faint: 'border border-border/30',
  /** border border-border/40 - Subtle border (40%) */
  subtle: 'border border-border/40',
  /** border border-border/50 - Light border (50%) */
  light: 'border border-border/50',
  /** border border-border/60 - Medium border (60%) */
  medium: 'border border-border/60',
  /** border border-border/70 - Visible border (70%) */
  visible: 'border border-border/70',
  /** border-2 border-border - Strong border (2px) */
  strong: 'border-2 border-border',
  /** border border-accent/30 - Accent colored border */
  accent: 'border border-accent/30',
  /** border border-dashed border-border/40 - Dashed border (subtle) */
  dashedSubtle: 'border border-dashed border-border/40',
  /** border border-dashed border-border/50 - Dashed border (light) */
  dashed: 'border border-dashed border-border/50',
  /** border border-dashed border-border/60 - Dashed border (medium) */
  dashedMedium: 'border border-dashed border-border/60',
  /** border border-dashed border-border/70 - Dashed border (visible) */
  dashedVisible: 'border border-dashed border-border/70',
  /** border border-dotted border-border/50 - Dotted border */
  dotted: 'border border-dotted border-border/50',
} as const;

// =============================================================================
// DIRECTIONAL BORDERS
// =============================================================================

/**
 * Top border utilities.
 * 
 * @migration Replaces inline `border-t border-border` patterns
 * @example
 * // ❌ OLD: className="border-t border-border"
 * // ✅ NEW: className={borderTop.default}
 */
export const borderTop = {
  /** border-t-0 */
  none: 'border-t-0',
  /** border-t border-border */
  default: 'border-t border-border',
  /** border-t border-transparent */
  transparent: 'border-t border-transparent',
  /** border-t border-border/30 - Very subtle top border */
  faint: 'border-t border-border/30',
  /** border-t border-border/40 - Subtle top border */
  subtle: 'border-t border-border/40',
  /** border-t border-border/50 - Light top border */
  light: 'border-t border-border/50',
  /** border-t-2 border-border - Strong top border */
  strong: 'border-t-2 border-border',
  /** border-t border-accent/30 */
  accent: 'border-t border-accent/30',
} as const;

/**
 * Bottom border utilities.
 * 
 * @migration Replaces inline `border-b border-border` patterns
 * @example
 * // ❌ OLD: className="border-b border-border"
 * // ✅ NEW: className={borderBottom.default}
 */
export const borderBottom = {
  /** border-b-0 */
  none: 'border-b-0',
  /** border-b border-border */
  default: 'border-b border-border',
  /** border-b border-border/30 - Very subtle bottom border */
  faint: 'border-b border-border/30',
  /** border-b border-border/50 - Light bottom border */
  light: 'border-b border-border/50',
  /** border-b-2 border-border - Strong bottom border */
  strong: 'border-b-2 border-border',
  /** border-b border-accent/30 */
  accent: 'border-b border-accent/30',
} as const;

/**
 * Left border utilities.
 * 
 * @migration Replaces inline `border-l border-border` patterns
 * @example
 * // ❌ OLD: className="border-l-4 border-primary"
 * // ✅ NEW: className={borderLeft.accentPrimary}
 */
export const borderLeft = {
  /** border-l-0 */
  none: 'border-l-0',
  /** border-l border-border */
  default: 'border-l border-border',
  /** border-l border-transparent */
  transparent: 'border-l border-transparent',
  /** border-l border-border/30 - Very subtle */
  faint: 'border-l border-border/30',
  /** border-l border-border/50 - Light */
  light: 'border-l border-border/50',
  /** border-l-2 border-border - Strong */
  strong: 'border-l-2 border-border',
  /** border-l border-accent/30 */
  accent: 'border-l border-accent/30',
  /** border-l-4 border-primary - Primary accent indicator (blockquotes, callouts) */
  accentPrimary: 'border-l-4 border-primary',
  /** border-l-4 border-accent - Accent indicator (info boxes, highlights) */
  accentHighlight: 'border-l-4 border-accent',
} as const;

/**
 * Right border utilities.
 * 
 * @migration Replaces inline `border-r border-border` patterns
 */
export const borderRight = {
  /** border-r-0 */
  none: 'border-r-0',
  /** border-r border-border */
  default: 'border-r border-border',
  /** border-r border-border/30 - Very subtle */
  faint: 'border-r border-border/30',
  /** border-r border-border/50 - Light */
  light: 'border-r border-border/50',
  /** border-r-2 border-border - Strong */
  strong: 'border-r-2 border-border',
  /** border-r border-accent/30 */
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
  '3': 'border-[3px]',
  '4': 'border-4',
  '8': 'border-8',
} as const;
