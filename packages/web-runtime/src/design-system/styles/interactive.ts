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
 * 
 * @migration Replaces inline `hover:bg-*` Tailwind classes
 * @example
 * // ❌ OLD: className="hover:bg-accent/10"
 * // ✅ NEW: className={hoverBg.default}
 */
export const hoverBg = {
  /** Very subtle hover */
  subtle: 'hover:bg-accent/5',
  /** Default hover */
  default: 'hover:bg-accent/10',
  /** Medium hover (15% opacity) */
  medium: 'hover:bg-accent/15',
  /** Strong hover */
  strong: 'hover:bg-accent/20',
  /** Stronger hover (50% opacity) */
  stronger: 'hover:bg-accent/50',
  /** Very strong hover (80% opacity) */
  veryStrong: 'hover:bg-accent/80',
  /** Maximum hover (90% opacity) */
  max: 'hover:bg-accent/90',
  /** Solid accent hover (no opacity) */
  accentSolid: 'hover:bg-accent',
  /** Accent-primary variant hover */
  accentPrimary: 'hover:bg-accent-primary/20',
  /** Muted hover */
  muted: 'hover:bg-muted/50',
  /** Muted lighter hover */
  mutedLight: 'hover:bg-muted/30',
  /** Solid muted hover (no opacity) */
  mutedSolid: 'hover:bg-muted',
  /** White subtle hover (dark backgrounds) */
  white5: 'hover:bg-white/5',
  /** White hover (dark backgrounds) */
  white10: 'hover:bg-white/10',
  /** Destructive hover */
  destructive: 'hover:bg-destructive/10',
  /** Destructive strong hover */
  destructiveStrong: 'hover:bg-destructive/20',
  /** Destructive very strong hover (80% opacity) */
  destructiveVeryStrong: 'hover:bg-destructive/80',
  /** Destructive maximum hover (90% opacity) */
  destructiveMax: 'hover:bg-destructive/90',
  /** Primary hover */
  primary: 'hover:bg-primary/10',
  /** Primary strong hover */
  primaryStrong: 'hover:bg-primary/20',
  /** Primary very strong hover (80% opacity) */
  primaryVeryStrong: 'hover:bg-primary/80',
  /** Primary maximum hover (90% opacity) */
  primaryMax: 'hover:bg-primary/90',
  /** Secondary very strong hover (80% opacity) */
  secondaryVeryStrong: 'hover:bg-secondary/80',
  /** Amber subtle hover */
  amberSubtle: 'hover:bg-amber-500/10',
  /** Amber strong hover */
  amberStrong: 'hover:bg-amber-500/20',
  /** Violet hover */
  violet: 'hover:bg-violet-500',
  /** Violet darker hover */
  violetDarker: 'hover:bg-violet-600',
  /** Background solid hover */
  backgroundSolid: 'hover:bg-background',
} as const;

/**
 * Hover text effects.
 * 
 * @migration Replaces inline `hover:text-*` Tailwind classes
 * @example
 * // ❌ OLD: className="hover:text-foreground"
 * // ✅ NEW: className={hoverText.foreground}
 */
export const hoverText = {
  /** Hover to accent color */
  accent: 'hover:text-accent',
  /** Hover to foreground color */
  foreground: 'hover:text-foreground',
  /** Hover to primary color */
  primary: 'hover:text-primary',
  /** Hover to muted color */
  muted: 'hover:text-muted-foreground',
  /** Hover to destructive color */
  destructive: 'hover:text-destructive',
  /** Hover to white */
  white: 'hover:text-white',
} as const;

/**
 * Hover border effects.
 * 
 * @migration Replaces inline `hover:border-*` Tailwind classes
 * @example
 * // ❌ OLD: className="hover:border-primary"
 * // ✅ NEW: className={hoverBorder.primary}
 */
export const hoverBorder = {
  /** Hover to accent border */
  accent: 'hover:border-accent/50',
  /** Hover to accent border (30% opacity) */
  accent30: 'hover:border-accent/30',
  /** Hover to accent-primary border (50% opacity) */
  accentPrimary50: 'hover:border-accent-primary/50',
  /** Hover to medium border */
  medium: 'hover:border-border-medium',
  /** Hover to primary border */
  primary: 'hover:border-primary/30',
  /** Hover to primary solid */
  primarySolid: 'hover:border-primary',
  /** Hover to foreground border */
  foreground: 'hover:border-foreground',
  /** Hover to border color */
  border: 'hover:border-border',
  /** Hover to destructive border */
  destructive: 'hover:border-destructive',
  /** Hover to amber border (50% opacity) */
  'amber/50': 'hover:border-amber-500/50',
  /** Hover to green border (40% opacity) */
  'green/40': 'hover:border-green-500/40',
  /** Hover to blue border (40% opacity) */
  'blue/40': 'hover:border-blue-500/40',
  /** Hover to gray border (40% opacity) */
  'gray/40': 'hover:border-gray-500/40',
  /** Hover to accent border (40% opacity) */
  'accent/40': 'hover:border-accent/40',
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
  /** Focus ring with accent and offset */
  accentWithOffset: 'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
  /** Focus ring with accent/60 opacity */
  accent60: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
  /** No focus ring */
  none: 'focus:ring-0',
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
  /** Larger scale down (for mobile buttons) */
  downLg: 'active:scale-[0.97]',
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

/**
 * Hover opacity effects.
 */
export const hoverOpacity = {
  /** hover:opacity-100 - Full opacity on hover */
  full: 'hover:opacity-100',
  /** hover:opacity-80 - 80% opacity on hover */
  '80': 'hover:opacity-80',
  /** hover:opacity-70 - 70% opacity on hover */
  '70': 'hover:opacity-70',
  /** hover:opacity-60 - 60% opacity on hover */
  '60': 'hover:opacity-60',
  /** hover:opacity-50 - 50% opacity on hover */
  '50': 'hover:opacity-50',
} as const;

// =============================================================================
// TRANSITION UTILITIES
// =============================================================================

/**
 * Transition patterns.
 * 
 * @migration Replaces inline `transition-*` Tailwind classes
 * @example
 * // ❌ OLD: className="transition-colors"
 * // ✅ NEW: className={transition.colors}
 * // ❌ OLD: className="transition-all duration-200 ease-out"
 * // ✅ NEW: className={transition.default}
 */
export const transition = {
  /** No transition */
  none: 'transition-none',
  /** Fast transition (150ms) */
  fast: 'transition-all duration-150 ease-out',
  /** Default transition (200ms) */
  default: 'transition-all duration-200 ease-out',
  /** Slow transition (300ms) */
  slow: 'transition-all duration-300 ease-out',
  /** Very slow transition (500ms) */
  slower: 'transition-all duration-500 ease-out',
  /** Smooth (from design system) */
  smooth: 'transition-smooth',
  /** All properties */
  all: 'transition-all',
  /** Colors only */
  colors: 'transition-colors',
  /** Transform only */
  transform: 'transition-transform',
  /** Opacity only */
  opacity: 'transition-opacity',
  /** Shadow only */
  shadow: 'transition-shadow',
  /** Width only */
  width: 'transition-[width]',
  /** Height only */
  height: 'transition-[height]',
  /** Combined common for interactive elements */
  interactive: 'transition-colors duration-200 ease-out',
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
  /** Small muted link (for footers, captions) */
  mutedSm: 'text-sm text-muted-foreground hover:text-foreground transition-colors',
  /** Primary link */
  primary: 'text-primary hover:text-primary-hover transition-colors duration-200',
  /** Nav link with underline animation */
  navUnderline: 'group relative inline-block',
  /** Nav link underline span */
  navUnderlineSpan: 'absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300 w-0 group-hover:w-full',
} as const;

// =============================================================================
// CURSOR UTILITIES
// =============================================================================

/**
 * Cursor style utilities.
 */
export const cursor = {
  /** Default arrow cursor */
  default: 'cursor-default',
  /** Pointer/hand cursor for clickable elements */
  pointer: 'cursor-pointer',
  /** Move cursor for draggable elements */
  move: 'cursor-move',
  /** Text selection cursor */
  text: 'cursor-text',
  /** Wait/loading cursor */
  wait: 'cursor-wait',
  /** Progress cursor (loading but interactive) */
  progress: 'cursor-progress',
  /** Not allowed cursor for disabled elements */
  notAllowed: 'cursor-not-allowed',
  /** Grab cursor for draggable elements */
  grab: 'cursor-grab',
  /** Grabbing cursor for actively dragged elements */
  grabbing: 'cursor-grabbing',
  /** Help cursor */
  help: 'cursor-help',
  /** Zoom in cursor */
  zoomIn: 'cursor-zoom-in',
  /** Zoom out cursor */
  zoomOut: 'cursor-zoom-out',
  /** Crosshair cursor for precision selection */
  crosshair: 'cursor-crosshair',
  /** None/hidden cursor */
  none: 'cursor-none',
  /** Resize cursors */
  resizeCol: 'cursor-col-resize',
  resizeRow: 'cursor-row-resize',
  resizeN: 'cursor-n-resize',
  resizeE: 'cursor-e-resize',
  resizeS: 'cursor-s-resize',
  resizeW: 'cursor-w-resize',
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
