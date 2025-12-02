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
  topLeft: 'absolute top-0 left-0',
  topLeftOffset: 'absolute top-2 left-2',
  topLeftOffsetXl: 'absolute top-4 left-4',
  bottomLeft: 'absolute bottom-0 left-0',
  bottomRight: 'absolute bottom-0 right-0',
  bottomRightOffset: 'absolute bottom-4 right-4',

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
  bottomLeft: 'fixed bottom-4 left-4',
  topRight: 'fixed top-4 right-4',
  topRightResponsive: 'fixed top-20 right-6',

  // Inset and center
  inset: 'fixed inset-0',
  center: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
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
