/**
 * Interactive Style Utilities
 *
 * Composable patterns for interactive elements (hover, focus, active states).
 * Replaces UI_CLASSES state patterns.
 *
 * @module web-runtime/design-system/styles/interactive
 */

// =============================================================================
// HOVER STATES
// =============================================================================

/**
 * Hover background effects.
 */
export const hoverBg = {
  /** Very subtle hover */
  subtle: 'hover:bg-accent/5',
  /** Default hover */
  default: 'hover:bg-accent/10',
  /** Strong hover */
  strong: 'hover:bg-accent/20',
  /** Muted hover */
  muted: 'hover:bg-muted/50',
} as const;

/**
 * Hover text effects.
 */
export const hoverText = {
  accent: 'hover:text-accent',
  foreground: 'hover:text-foreground',
  primary: 'hover:text-primary',
} as const;

/**
 * Hover border effects.
 */
export const hoverBorder = {
  accent: 'hover:border-accent/50',
  medium: 'hover:border-border-medium',
  primary: 'hover:border-primary/50',
} as const;

// =============================================================================
// FOCUS STATES
// =============================================================================

/**
 * Focus ring patterns.
 */
export const focusRing = {
  /** Standard focus ring */
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  /** Accent colored focus ring */
  accent: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  /** Focus ring with offset */
  offset: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  /** Simple outline focus */
  outline: 'focus:outline-none focus:ring-2 focus:ring-accent',
} as const;

// =============================================================================
// ACTIVE STATES
// =============================================================================

/**
 * Active/pressed scale effects.
 */
export const activeScale = {
  /** Subtle scale down */
  down: 'active:scale-[0.98]',
  /** Smaller scale down */
  downSm: 'active:scale-[0.99]',
  /** Scale up */
  up: 'active:scale-[1.02]',
} as const;

// =============================================================================
// DISABLED STATES
// =============================================================================

/**
 * Disabled state patterns.
 */
export const disabled = {
  /** Standard disabled */
  default: 'disabled:opacity-50 disabled:pointer-events-none',
  /** Disabled with cursor */
  cursor: 'disabled:opacity-50 disabled:cursor-not-allowed',
  /** Just opacity */
  opacity: 'disabled:opacity-40',
} as const;

// =============================================================================
// COMBINED INTERACTIVE PATTERNS
// =============================================================================

/**
 * Combined interactive state patterns.
 */
export const interactive = {
  /** Default interactive element */
  default: 'hover:bg-accent/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  /** Interactive button */
  button: 'hover:bg-accent/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  /** Interactive card */
  card: 'hover:bg-accent/5 active:scale-[0.99] transition-colors',
  /** Interactive link */
  link: 'hover:text-accent active:text-accent-hover focus-visible:underline',
  /** Nav item */
  navItem: 'group flex items-center gap-2 rounded-md px-3 py-2.5 no-underline transition-colors hover:bg-accent/10',
  /** Menu item */
  menuItem: 'group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 no-underline transition-colors hover:bg-white/5',
  /** List item */
  listItem: 'flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50',
  /** Card row */
  cardRow: 'flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5',
  /** Generic pressable item */
  pressable: 'px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left',
} as const;

// =============================================================================
// GROUP HOVER PATTERNS
// =============================================================================

/**
 * Group hover effects (for parent hover triggering child changes).
 */
export const groupHover = {
  accent: 'group-hover:text-accent',
  foreground: 'group-hover:text-foreground',
  underline: 'group-hover:underline',
  scale: 'group-hover:scale-105',
  visible: 'opacity-0 group-hover:opacity-100',
} as const;

// =============================================================================
// TRANSITION UTILITIES
// =============================================================================

/**
 * Transition patterns.
 */
export const transition = {
  /** Fast transition */
  fast: 'transition-all duration-150 ease-out',
  /** Default transition */
  default: 'transition-all duration-200 ease-out',
  /** Slow transition */
  slow: 'transition-all duration-300 ease-out',
  /** Smooth (from design system) */
  smooth: 'transition-smooth',
  /** Colors only */
  colors: 'transition-colors',
  /** Transform only */
  transform: 'transition-transform',
  /** Opacity only */
  opacity: 'transition-opacity',
} as const;

// =============================================================================
// LINK STYLES
// =============================================================================

/**
 * Link style patterns.
 */
export const link = {
  /** Default link with accent color */
  accent: 'text-accent hover:text-accent-hover transition-colors duration-200',
  /** Muted link */
  muted: 'text-muted-foreground hover:text-foreground transition-colors duration-200',
  /** Primary link */
  primary: 'text-primary hover:text-primary-hover transition-colors duration-200',
  /** Nav link with underline animation */
  navUnderline: 'group relative inline-block',
  /** Nav link underline span */
  navUnderlineSpan: 'absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300 w-0 group-hover:w-full',
} as const;

// =============================================================================
// SCORE/QUALITY INDICATORS
// =============================================================================

/**
 * Score indicator colors.
 */
export const score = {
  excellent: 'text-green-600 dark:text-green-400',
  good: 'text-blue-600 dark:text-blue-400',
  fair: 'text-yellow-600 dark:text-yellow-400',
  poor: 'text-red-600 dark:text-red-400',
} as const;

// =============================================================================
// CODE BLOCK PATTERNS
// =============================================================================

/**
 * Code block style patterns for syntax-highlighted code displays.
 */
export const codeBlock = {
  /** Wrapper for code block group */
  groupWrapper: 'rounded-lg bg-card border border-border overflow-hidden',
  /** Header bar above code */
  header: 'flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30',
  /** Filename display in header */
  filename: 'text-sm font-medium text-muted-foreground truncate',
  /** Base button style */
  buttonBase: 'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground',
  /** Icon button in header */
  buttonIcon: 'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground',
  /** Social icon wrapper */
  socialIconWrapper: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
} as const;
