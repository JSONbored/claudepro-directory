/**
 * Layout Style Utilities
 *
 * Composable patterns for flex, grid, and container layouts.
 * Replaces UI_CLASSES layout patterns with tree-shakeable utilities.
 *
 * @module web-runtime/design-system/styles/layout
 */

// =============================================================================
// FLEX UTILITIES
// =============================================================================

/**
 * Vertical stack layout (flex column).
 * @param gap - Gap size (Tailwind gap class number)
 */
export const stack = {
  /** No gap */
  none: 'flex flex-col',
  /** gap-0.5 (2px) */
  micro: 'flex flex-col gap-0.5',
  /** gap-1 (4px) */
  tight: 'flex flex-col gap-1',
  /** gap-1.5 (6px) */
  snug: 'flex flex-col gap-1.5',
  /** gap-2 (8px) */
  compact: 'flex flex-col gap-2',
  /** gap-3 (12px) */
  default: 'flex flex-col gap-3',
  /** gap-4 (16px) */
  comfortable: 'flex flex-col gap-4',
  /** gap-6 (24px) */
  relaxed: 'flex flex-col gap-6',
  /** gap-8 (32px) */
  loose: 'flex flex-col gap-8',
  /** gap-12 (48px) */
  section: 'flex flex-col gap-12',
} as const;

/**
 * Horizontal cluster layout (flex row with centered items).
 * @param gap - Gap size
 */
export const cluster = {
  none: 'flex items-center',
  micro: 'flex items-center gap-0.5',
  tight: 'flex items-center gap-1',
  snug: 'flex items-center gap-1.5',
  compact: 'flex items-center gap-2',
  default: 'flex items-center gap-3',
  comfortable: 'flex items-center gap-4',
  relaxed: 'flex items-center gap-6',
  loose: 'flex items-center gap-8',
} as const;

/**
 * Flex row with top-aligned items.
 */
export const row = {
  none: 'flex items-start',
  micro: 'flex items-start gap-0.5',
  tight: 'flex items-start gap-1',
  snug: 'flex items-start gap-1.5',
  compact: 'flex items-start gap-2',
  default: 'flex items-start gap-3',
  comfortable: 'flex items-start gap-4',
  relaxed: 'flex items-start gap-6',
} as const;

/**
 * Centered flex container.
 */
export const center = {
  /** Center both axes */
  both: 'flex items-center justify-center',
  /** Center with gap */
  withGap: 'flex items-center justify-center gap-2',
  /** Center column */
  column: 'flex flex-col items-center justify-center',
  /** Center column with gap */
  columnWithGap: 'flex flex-col items-center justify-center gap-4',
} as const;

/**
 * Space-between layouts.
 */
export const between = {
  /** Items centered, space-between */
  center: 'flex items-center justify-between',
  /** Items at start, space-between */
  start: 'flex items-start justify-between',
  /** With gap */
  centerGap: 'flex items-center justify-between gap-4',
  startGap: 'flex items-start justify-between gap-2',
} as const;

/**
 * Flex wrap patterns.
 */
export const wrap = {
  default: 'flex flex-wrap',
  tight: 'flex flex-wrap gap-1',
  compact: 'flex flex-wrap gap-2',
  comfortable: 'flex flex-wrap gap-3',
  relaxed: 'flex flex-wrap gap-4',
  centered: 'flex flex-wrap items-center gap-2',
  centeredRelaxed: 'flex flex-wrap items-center gap-3',
  centeredJustified: 'flex flex-wrap items-center justify-center gap-3',
} as const;

/**
 * Responsive flex patterns (column on mobile, row on larger screens).
 */
export const responsive = {
  /** Column → Row at sm */
  smRow: 'flex flex-col sm:flex-row',
  /** Column → Row at sm with gap */
  smRowGap: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
  /** Column → Row at md */
  mdRow: 'flex flex-col md:flex-row',
  /** Column → Row at md with gap */
  mdRowGap: 'flex flex-col md:flex-row gap-3 md:gap-6',
  /** Column → Row at lg */
  lgRow: 'flex flex-col lg:flex-row',
  /** Column → Row at lg with gap */
  lgRowGap: 'flex flex-col lg:flex-row gap-4 lg:gap-8',
  /** Centered responsive */
  smRowCentered: 'flex flex-col items-start sm:flex-row sm:items-center',
  /** Between responsive */
  smRowBetween: 'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
} as const;

// =============================================================================
// GRID UTILITIES
// =============================================================================

/**
 * Responsive grid patterns.
 */
export const grid = {
  /** 1 column */
  cols1: 'grid grid-cols-1 gap-4',
  /** 2 columns */
  cols2: 'grid grid-cols-2 gap-4',
  /** 3 columns */
  cols3: 'grid grid-cols-3 gap-4',
  /** 4 columns */
  cols4: 'grid grid-cols-4 gap-4',

  /** Responsive: 1 → 2 columns */
  responsive2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  /** Responsive: 1 → 2 → 3 columns */
  responsive3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  /** Responsive: 1 → 2 → 3 → 4 columns */
  responsive4: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  /** Responsive: 2 → 3 → 4 columns */
  responsive234: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
  /** Responsive: 1 → 2 → 4 columns */
  responsive124: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4',

  /** Content grid with tight gaps */
  contentTight: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  /** Content grid with relaxed gaps */
  contentRelaxed: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  /** Feature grid (larger items) */
  feature: 'grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4',
  /** List grid */
  list: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 list-none',
} as const;

// =============================================================================
// CONTAINER UTILITIES
// =============================================================================

/**
 * Container patterns with max-width constraints.
 */
export const container = {
  /** Standard centered container */
  default: 'container mx-auto px-4',
  /** Container with more padding */
  padded: 'container mx-auto px-4 sm:px-6 md:px-8',
  /** Narrow container for forms/prose */
  narrow: 'max-w-2xl mx-auto px-4',
  /** Medium container */
  medium: 'max-w-4xl mx-auto px-4',
  /** Wide container */
  wide: 'max-w-7xl mx-auto px-4',
  /** Full width */
  full: 'w-full px-4',
} as const;

/**
 * Section spacing patterns.
 */
export const section = {
  /** Tight section margin */
  tight: 'mb-8',
  /** Default section margin */
  default: 'mb-12',
  /** Relaxed section margin */
  relaxed: 'mb-16',
  /** Hero section margin */
  hero: 'mb-20',
  /** Section padding */
  paddingTight: 'py-8',
  paddingDefault: 'py-12',
  paddingRelaxed: 'py-16',
  paddingHero: 'py-20',
} as const;

// =============================================================================
// SPACING UTILITIES (margin/padding)
// =============================================================================

/**
 * Vertical spacing (space-y).
 */
export const spaceY = {
  tight: 'space-y-1',
  compact: 'space-y-2',
  default: 'space-y-3',
  comfortable: 'space-y-4',
  relaxed: 'space-y-6',
  loose: 'space-y-8',
} as const;

/**
 * Horizontal spacing (space-x).
 */
export const spaceX = {
  tight: 'space-x-1',
  compact: 'space-x-2',
  default: 'space-x-3',
  comfortable: 'space-x-4',
  relaxed: 'space-x-6',
} as const;

/**
 * Padding patterns.
 */
export const padding = {
  none: 'p-0',
  micro: 'p-1',
  tight: 'p-2',
  compact: 'p-3',
  default: 'p-4',
  comfortable: 'p-6',
  relaxed: 'p-8',
  
  // X-axis
  xTight: 'px-2',
  xCompact: 'px-3',
  xDefault: 'px-4',
  xComfortable: 'px-6',
  xRelaxed: 'px-8',
  
  // Y-axis
  yMicro: 'py-0.5',
  yTight: 'py-1',
  yCompact: 'py-2',
  yDefault: 'py-4',
  yComfortable: 'py-6',
  yRelaxed: 'py-8',
  ySection: 'py-12',
} as const;

/**
 * Margin bottom patterns.
 */
export const marginBottom = {
  none: 'mb-0',
  micro: 'mb-1',
  tight: 'mb-2',
  compact: 'mb-3',
  default: 'mb-4',
  comfortable: 'mb-6',
  relaxed: 'mb-8',
  section: 'mb-12',
  hero: 'mb-16',
} as const;

/**
 * Margin top patterns.
 */
export const marginTop = {
  none: 'mt-0',
  micro: 'mt-0.5',
  tight: 'mt-1',
  compact: 'mt-2',
  default: 'mt-4',
  comfortable: 'mt-6',
  relaxed: 'mt-8',
} as const;

// =============================================================================
// UTILITY HELPERS
// =============================================================================

/**
 * Shrink-resistant flex item.
 */
export const shrink0 = 'flex-shrink-0';

/**
 * Flex-1 for growing items.
 */
export const flex1 = 'flex-1';

/**
 * Minimum width 0 for text truncation in flex.
 */
export const minW0 = 'min-w-0';

/**
 * Common flex item pattern for text with truncation.
 */
export const flexItemText = 'flex min-w-0 flex-1 flex-col items-start gap-0.5';

/**
 * Full-width flex row.
 */
export const fullRow = 'flex w-full items-center gap-1.5';
