/**
 * Position Style Utilities
 *
 * Composable patterns for absolute, fixed, and sticky positioning.
 * Replaces UI_CLASSES position patterns.
 *
 * @module web-runtime/design-system/styles/position
 */

// =============================================================================
// ABSOLUTE POSITIONING
// =============================================================================

/**
 * Absolute position patterns.
 */
export const absolute = {
  // Corners
  topRight: 'absolute top-0 right-0',
  topRightOffset: 'absolute top-2 right-2',
  topRightOffsetLg: 'absolute top-3 right-3',
  topRightOffsetXl: 'absolute top-4 right-4',
  /** -right-1 -top-1 - Negative positioning for badges */
  negRight1NegTop1: 'absolute -right-1 -top-1',
  topLeft: 'absolute top-0 left-0',
  topLeftOffset: 'absolute top-2 left-2',
  topLeftOffsetXl: 'absolute top-4 left-4',
  bottomLeft: 'absolute bottom-0 left-0',
  bottomRight: 'absolute bottom-0 right-0',
  bottomRightOffset: 'absolute bottom-4 right-4',
  bottom0: 'absolute bottom-0',
  /** bottom-0 - Bottom edge (alias) */
  bottom0Value: 'absolute bottom-0',
  /** left-0 - Left edge */
  left0Value: 'absolute left-0',
  /** right-0 - Right edge */
  right0Value: 'absolute right-0',

  // Full width edges
  topFull: 'absolute top-0 right-0 left-0',
  bottomFull: 'absolute right-0 bottom-0 left-0',

  // Center positions
  center: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  centerY: 'absolute top-1/2 -translate-y-1/2',
  centerX: 'absolute left-1/2 -translate-x-1/2',
  topHalf: 'absolute top-1/2',
  topHalfLeft: 'absolute top-1/2 left-3',
  topHalfRight: 'absolute top-1/2 right-3',

  // Inset
  inset: 'absolute inset-0',
  insetY: 'absolute inset-y-0',
  insetYLeft: 'absolute inset-y-0 left-0',
  insetYRight: 'absolute inset-y-0 right-0',

  // Special positions
  badge: 'absolute -top-1 -right-1',
  leftIcon: 'absolute left-2',
  
  // Inset X/Y patterns
  insetX0: 'absolute inset-x-0',
  insetX4: 'absolute inset-x-4',
  insetXAuto: 'absolute inset-x-auto',
  insetY0: 'absolute inset-y-0',
  
  // Half positions (without translate)
  leftHalf: 'absolute left-1/2',
  bottomHalf: 'absolute bottom-1/2',
  rightHalf: 'absolute right-1/2',
  
  // Specific position values
  /** top-24 - 96px - Below sticky header */
  top24: 'absolute top-24',
  /** top-14 - 56px - Below small header */
  top14: 'absolute top-14',
  /** top-full - Below parent element */
  topFullValue: 'absolute top-full',
  /** left-5 - 20px - Standard left offset */
  left5: 'absolute left-5',
  /** left-[5px] - 5px left offset */
  left5px: 'absolute left-[5px]',
} as const;

// =============================================================================
// FIXED POSITIONING
// =============================================================================

/**
 * Fixed position patterns.
 */
export const fixed = {
  // Full width edges
  topFull: 'fixed top-0 left-0 right-0',
  bottomFull: 'fixed bottom-0 left-0 right-0',
  bottomFullResponsive: 'fixed right-0 bottom-0 left-0',

  // Corner positions
  bottomRight: 'fixed bottom-4 right-4',
  bottomRightLg: 'fixed bottom-6 right-6',
  bottomRightResponsive: 'fixed right-6 bottom-6',
  /** right-6 bottom-6 - Desktop positioning */
  right6Bottom6: 'fixed right-6 bottom-6',
  /** Responsive: right-0 bottom-0 left-0 on mobile */
  mobileFullBottom: 'max-md:right-0 max-md:bottom-0 max-md:left-0',
  bottomLeft: 'fixed bottom-4 left-4',
  topRight: 'fixed top-4 right-4',
  topRightResponsive: 'fixed top-20 right-6',

  // Inset and center
  inset: 'fixed inset-0',
  center: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  
  // Inset X/Y patterns
  insetX0: 'fixed inset-x-0',
  insetX4: 'fixed inset-x-4',
  insetXAuto: 'fixed inset-x-auto',
  insetY0: 'fixed inset-y-0',
  
  // Half positions (without translate)
  leftHalf: 'fixed left-1/2',
  topHalf: 'fixed top-1/2',
  bottomHalf: 'fixed bottom-1/2',
  rightHalf: 'fixed right-1/2',
} as const;

// =============================================================================
// STICKY POSITIONING
// =============================================================================

/**
 * Sticky position patterns.
 */
export const sticky = {
  top: 'sticky top-0 z-10',
  topNav: 'sticky top-20 z-10',
  top4: 'sticky top-4',
  top24: 'sticky top-24',
  top28: 'sticky top-28',
  bottom: 'sticky bottom-0 z-10',
} as const;

// =============================================================================
// Z-INDEX UTILITIES
// =============================================================================

/**
 * Z-index layer classes.
 * Note: Named `zIndexClass` to avoid collision with `zIndex` in tokens.
 */
export const zIndexClass = {
  base: 'z-0',
  raised: 'z-10',
  dropdown: 'z-20',
  sticky: 'z-30',
  fixed: 'z-40',
  modalBackdrop: 'z-50',
  modal: 'z-60',
  popover: 'z-70',
  tooltip: 'z-80',
  toast: 'z-90',
  max: 'z-[100]',
} as const;

// NOTE: overflow utilities moved to layout.ts for consolidation
