/**
 * Button Style Utilities
 *
 * Composable patterns for button styling.
 * Note: For full button component with variants, use the Button component.
 * These are raw class patterns for custom button implementations.
 *
 * @module web-runtime/design-system/styles/buttons
 */

// =============================================================================
// BASE BUTTON STYLES
// =============================================================================

/**
 * Base button styles (applied to all buttons).
 */
export const buttonBase = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

// =============================================================================
// BUTTON VARIANTS
// =============================================================================

/**
 * Button variant styles.
 */
export const button = {
  /** Primary/accent button */
  primary: 'bg-accent text-accent-foreground hover:bg-accent/90',
  /** Destructive/danger button */
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  /** Outline button */
  outline: 'border border-input bg-background hover:bg-accent/10 hover:text-accent',
  /** Secondary button */
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  /** Ghost button */
  ghost: 'hover:bg-accent/10 hover:text-accent',
  /** Link style button */
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

// =============================================================================
// BUTTON SIZES
// =============================================================================

/**
 * Button size styles.
 */
export const buttonSize = {
  sm: 'h-9 rounded-md px-3',
  default: 'h-10 px-4 py-2',
  lg: 'h-11 rounded-md px-8',
  xl: 'h-12 rounded-lg px-10 text-base',
  icon: 'h-10 w-10',
  iconSm: 'h-7 w-7 p-0',
  iconMd: 'h-9 w-9 p-0',
} as const;

// =============================================================================
// SPECIALIZED BUTTONS
// =============================================================================

/**
 * Large action button (for primary CTAs).
 */
export const actionButton = {
  primary: 'flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200',
  secondary: 'flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]',
} as const;

/**
 * Icon button styles.
 */
export const iconButton = {
  ghost: 'hover:bg-accent/10 hover:text-accent',
  subtle: 'text-muted-foreground hover:text-foreground hover:bg-accent/5',
  /** With text */
  withText: 'h-7 px-2 text-xs gap-1',
} as const;

/**
 * Ghost button state styles.
 */
export const buttonGhost = {
  /** Standard ghost icon button hover */
  icon: 'text-muted-foreground hover:text-foreground hover:bg-accent/5',
  /** More prominent hover */
  prominent: 'text-muted-foreground hover:text-foreground hover:bg-accent/10',
} as const;

// =============================================================================
// CODE BLOCK BUTTONS
// =============================================================================

/**
 * Code block action buttons.
 */
export const codeButton = {
  base: 'flex items-center justify-center rounded-md bg-code/95 p-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-code',
  icon: 'flex items-center justify-center rounded-md bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-code hover:text-foreground',
  floating: 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  floatingHeader: 'absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
} as const;

// =============================================================================
// BUTTON MIN WIDTHS
// =============================================================================

/**
 * Minimum width constraints for buttons.
 */
export const buttonMinWidth = {
  /** min-w-[8rem] - Default button minimum width */
  default: 'min-w-[8rem]',
  /** min-w-[36px] - Small icon button */
  icon: 'min-w-[36px]',
  /** min-w-[40px] - Medium icon button */
  iconMd: 'min-w-[40px]',
  /** min-w-[140px] - Newsletter button */
  newsletter: 'min-w-[140px]',
} as const;

// =============================================================================
// BUTTON HEIGHT UTILITIES
// =============================================================================

/**
 * Arbitrary height utilities for buttons.
 * Use when standard Tailwind heights don't match design specs.
 */
export const buttonHeight = {
  /** h-[36px] - Small button */
  sm: 'h-[36px]',
  /** h-[40px] - Medium button */
  md: 'h-[40px]',
  /** h-[52px] - Large button */
  lg: 'h-[52px]',
} as const;

/**
 * Button minimum height utilities.
 */
export const buttonMinHeight = {
  /** min-h-[36px] - Small icon button */
  icon: 'min-h-[36px]',
  /** min-h-[40px] - Medium icon button */
  iconMd: 'min-h-[40px]',
} as const;
