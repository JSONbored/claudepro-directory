/**
 * Accessibility Style Utilities
 *
 * Screen reader, focus, and accessibility-focused utilities.
 * Ensures consistent accessible patterns across the codebase.
 *
 * @module web-runtime/design-system/styles/a11y
 */

// =============================================================================
// SCREEN READER UTILITIES
// =============================================================================

/**
 * Screen reader utilities.
 */
export const srOnly = {
  /** Hide visually but keep accessible to screen readers */
  default: 'sr-only',
  /** Make visible again (e.g., on focus) */
  focusable: 'sr-only focus:not-sr-only',
  /** Not screen reader only (visible) */
  visible: 'not-sr-only',
} as const;

// =============================================================================
// FOCUS VISIBLE UTILITIES
// =============================================================================

/**
 * Focus-visible ring patterns for keyboard navigation.
 */
export const focusVisible = {
  /** Standard focus ring */
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  /** Accent focus ring */
  ringAccent: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
  /** Primary focus ring */
  ringPrimary: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  /** No ring (for custom focus styles) */
  none: 'focus-visible:outline-none',
  /** Ring without offset */
  ringNoOffset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  /** Outline style (alternative to ring) */
  outline: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
} as const;

// =============================================================================
// REDUCED MOTION
// =============================================================================

/**
 * Reduced motion utilities for users who prefer less animation.
 */
export const reducedMotion = {
  /** Disable transition for reduced motion preference */
  noTransition: 'motion-reduce:transition-none',
  /** Disable animation for reduced motion preference */
  noAnimation: 'motion-reduce:animate-none',
  /** Disable transform for reduced motion preference */
  noTransform: 'motion-reduce:transform-none',
} as const;

// =============================================================================
// TOUCH TARGET UTILITIES
// =============================================================================

/**
 * Touch target sizes for accessibility.
 * Ensures minimum 44x44px touch targets.
 */
export const touchTarget = {
  /** Minimum touch target (44x44px) */
  min: 'min-h-[44px] min-w-[44px]',
  /** Comfortable touch target (48x48px) */
  comfortable: 'min-h-[48px] min-w-[48px]',
  /** Large touch target */
  large: 'min-h-[56px] min-w-[56px]',
} as const;

// =============================================================================
// SKIP LINKS
// =============================================================================

/**
 * Skip link patterns for keyboard navigation.
 */
export const skipLink = {
  /** Hidden skip link that shows on focus */
  default: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring',
} as const;

// =============================================================================
// ARIA UTILITIES
// =============================================================================

/**
 * Styles for aria states.
 */
export const ariaStates = {
  /** Expanded state */
  expanded: 'aria-expanded:rotate-180',
  /** Selected state */
  selected: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
  /** Disabled state */
  disabled: 'aria-disabled:opacity-50 aria-disabled:pointer-events-none',
  /** Current page */
  current: 'aria-[current=page]:font-semibold aria-[current=page]:text-foreground',
} as const;

// =============================================================================
// COMPOSITE A11Y PATTERNS
// =============================================================================

/**
 * Combined accessibility patterns.
 */
export const a11y = {
  /** Interactive element with proper focus */
  interactive: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  /** Button accessibility pattern */
  button: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none motion-reduce:transition-none',
  /** Link accessibility pattern */
  link: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
  /** Form input accessibility pattern */
  input: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
} as const;
