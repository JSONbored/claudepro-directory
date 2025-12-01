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
 * Standalone gap utility for adding spacing to any flex/grid container.
 * Use when you need gap without the full cluster/stack pattern.
 * 
 * NOTE: Scale matches cluster/stack semantics (not padding).
 * - gap.compact = gap-2 (same as cluster.compact)
 * - gap.default = gap-3 (same as cluster.default)
 */
export const gap = {
  none: 'gap-0',
  micro: 'gap-0.5',
  tight: 'gap-1',
  snug: 'gap-1.5',
  compact: 'gap-2',
  default: 'gap-3',
  comfortable: 'gap-4',
  relaxed: 'gap-6',
  loose: 'gap-8',
  section: 'gap-10',
  hero: 'gap-12',
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
  // All-sides padding (complete scale)
  none: 'p-0',
  hair: 'p-0.5',
  micro: 'p-1',
  snug: 'p-1.5',
  tight: 'p-2',
  between: 'p-2.5',
  compact: 'p-3',
  default: 'p-4',
  medium: 'p-5',
  comfortable: 'p-6',
  relaxed: 'p-8',
  spacious: 'p-10',
  section: 'p-12',
  hero: 'p-16',
  
  // X-axis (horizontal) - complete scale
  xNone: 'px-0',
  xHair: 'px-0.5',
  xMicro: 'px-1',
  xSnug: 'px-1.5',
  xTight: 'px-2',
  xCompact: 'px-3',
  xDefault: 'px-4',
  xMedium: 'px-5',
  xComfortable: 'px-6',
  xRelaxed: 'px-8',
  xSpacious: 'px-12',
  xHero: 'px-16',
  
  // Y-axis (vertical) - complete scale
  yNone: 'py-0',
  yHair: 'py-0.5',
  yMicro: 'py-1',
  ySnug: 'py-1.5',
  yTight: 'py-2',
  yCompact: 'py-3',
  yDefault: 'py-4',
  yMedium: 'py-5',
  yComfortable: 'py-6',
  yRelaxed: 'py-8',
  ySpacious: 'py-10',
  ySection: 'py-12',
  yLargish: 'py-14',
  yHero: 'py-16',
  yLarge: 'py-20',
  yXl: 'py-24',
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
  section: 'mt-12',
  hero: 'mt-16',
} as const;

// =============================================================================
// WIDTH UTILITIES
// =============================================================================

/**
 * Width utilities for common patterns.
 * For icon widths, use iconSize.* instead.
 * 
 * Philosophy: Only include semantic sizes that communicate intent.
 * One-off pixel values should remain as inline Tailwind classes.
 */
export const width = {
  // Semantic widths
  auto: 'w-auto',
  full: 'w-full',
  screen: 'w-screen',
  min: 'w-min',
  max: 'w-max',
  fit: 'w-fit',
  
  // Fractional widths (for grid/flex children)
  half: 'w-1/2',
  third: 'w-1/3',
  twoThirds: 'w-2/3',
  quarter: 'w-1/4',
  threeQuarters: 'w-3/4',
} as const;

// =============================================================================
// HEIGHT UTILITIES
// =============================================================================

/**
 * Height utilities for common patterns.
 * For icon heights, use iconSize.* instead.
 */
export const height = {
  // Semantic heights
  auto: 'h-auto',
  full: 'h-full',
  screen: 'h-screen',
  svh: 'h-svh',
  dvh: 'h-dvh',
  min: 'h-min',
  max: 'h-max',
  fit: 'h-fit',
} as const;

// =============================================================================
// SIZE UTILITIES (combined width + height)
// =============================================================================

/**
 * Square size utilities for elements that need equal width and height.
 * For icons, prefer iconSize.* which includes these plus semantic names.
 */
export const squareSize = {
  // Touch target sizes (accessibility)
  touchSm: 'h-8 w-8',    // 32px - minimum touch target
  touchMd: 'h-10 w-10',  // 40px - comfortable touch target
  touchLg: 'h-11 w-11',  // 44px - Apple's recommended minimum
  touchXl: 'h-12 w-12',  // 48px - Google's recommended minimum
  
  // Avatar sizes
  avatarXs: 'h-6 w-6',   // 24px
  avatarSm: 'h-8 w-8',   // 32px
  avatarMd: 'h-10 w-10', // 40px
  avatarLg: 'h-12 w-12', // 48px
  avatarXl: 'h-16 w-16', // 64px
  avatar2xl: 'h-20 w-20', // 80px
  avatar3xl: 'h-24 w-24', // 96px
} as const;

// =============================================================================
// MAX-WIDTH UTILITIES
// =============================================================================

/**
 * Max-width constraints.
 */
export const maxWidth = {
  none: 'max-w-none',
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
  prose: 'max-w-prose',
  screenSm: 'max-w-screen-sm',
  screenMd: 'max-w-screen-md',
  screenLg: 'max-w-screen-lg',
  screenXl: 'max-w-screen-xl',
  screen2xl: 'max-w-screen-2xl',
} as const;

// =============================================================================
// MIN-HEIGHT UTILITIES
// =============================================================================

/**
 * Min-height constraints.
 */
export const minHeight = {
  0: 'min-h-0',
  full: 'min-h-full',
  screen: 'min-h-screen',
  svh: 'min-h-svh',
  dvh: 'min-h-dvh',
  /** Common min-heights */
  sm: 'min-h-[200px]',
  md: 'min-h-[300px]',
  lg: 'min-h-[400px]',
  xl: 'min-h-[500px]',
} as const;

// =============================================================================
// SCROLL UTILITIES
// =============================================================================

/**
 * Scroll behavior utilities.
 */
export const scroll = {
  /** Smooth scrolling */
  smooth: 'scroll-smooth',
  /** Auto scrolling */
  auto: 'scroll-auto',
  /** Overflow utilities */
  overflowAuto: 'overflow-auto',
  overflowHidden: 'overflow-hidden',
  overflowScroll: 'overflow-scroll',
  overflowXAuto: 'overflow-x-auto',
  overflowYAuto: 'overflow-y-auto',
  overflowXHidden: 'overflow-x-hidden',
  overflowYHidden: 'overflow-y-hidden',
  /** Hide scrollbar but allow scroll */
  hideScrollbar: 'scrollbar-hide',
  /** Scroll snap */
  snapX: 'snap-x',
  snapY: 'snap-y',
  snapMandatory: 'snap-mandatory',
  snapProximity: 'snap-proximity',
  snapStart: 'snap-start',
  snapCenter: 'snap-center',
  snapEnd: 'snap-end',
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
