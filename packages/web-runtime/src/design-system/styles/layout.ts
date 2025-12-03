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
  extra: 'gap-16',
  /** gap-y-1 - Vertical gap only */
  yTight: 'gap-y-1',
  /** lg:gap-10 - Section gap at lg breakpoint */
  lgSection: 'lg:gap-10',
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
// RESPONSIVE PADDING UTILITIES
// =============================================================================

/**
 * Responsive padding patterns.
 */
export const paddingResponsive = {
  /** px-4 sm:px-4 md:px-6 - Small responsive padding */
  sm: 'px-4 sm:px-4 md:px-6',
  /** px-4 sm:px-6 md:px-8 - Medium responsive padding */
  md: 'px-4 sm:px-6 md:px-8',
  /** px-6 sm:px-8 md:px-12 - Large responsive padding */
  lg: 'px-6 sm:px-8 md:px-12',
  /** px-8 sm:px-12 md:px-16 - Extra large responsive padding */
  xl: 'px-8 sm:px-12 md:px-16',
} as const;

// =============================================================================
// RESPONSIVE GAP UTILITIES
// =============================================================================

/**
 * Responsive gap patterns.
 */
export const gapResponsive = {
  /** gap-2 sm:gap-3 md:gap-4 - Small responsive gap */
  sm: 'gap-2 sm:gap-3 md:gap-4',
  /** gap-3 sm:gap-4 md:gap-6 - Medium responsive gap */
  md: 'gap-3 sm:gap-4 md:gap-6',
  /** gap-4 sm:gap-6 md:gap-8 - Large responsive gap */
  lg: 'gap-4 sm:gap-6 md:gap-8',
} as const;

// =============================================================================
// GRID UTILITIES
// =============================================================================

/**
 * Responsive grid patterns.
 * 
 * @migration Replaces inline `grid grid-cols-*` patterns
 * @example
 * // ❌ OLD: className="grid grid-cols-2 gap-4"
 * // ✅ NEW: className={grid.cols2}
 * // ❌ OLD: className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
 * // ✅ NEW: className={grid.responsive3}
 */
export const grid = {
  // Base grid utility (just the grid class, no columns)
  /** Base grid class (use with custom column definitions) */
  base: 'grid',
  
  // Fixed column grids (gap-4 default)
  /** 1 column, gap-4 */
  cols1: 'grid grid-cols-1 gap-4',
  /** 2 columns, gap-4 */
  cols2: 'grid grid-cols-2 gap-4',
  /** 3 columns, gap-4 */
  cols3: 'grid grid-cols-3 gap-4',
  /** 4 columns, gap-4 */
  cols4: 'grid grid-cols-4 gap-4',
  /** 6 columns, gap-4 */
  cols6: 'grid grid-cols-6 gap-4',
  /** 12 columns, gap-4 */
  cols12: 'grid grid-cols-12 gap-4',
  
  // Fixed column grids with gap-6
  /** 1 column, gap-6 */
  cols1Gap6: 'grid grid-cols-1 gap-6',
  /** 2 columns, gap-6 */
  cols2Gap6: 'grid grid-cols-2 gap-6',
  /** 3 columns, gap-6 */
  cols3Gap6: 'grid grid-cols-3 gap-6',
  /** 4 columns, gap-6 */
  cols4Gap6: 'grid grid-cols-4 gap-6',
  
  // Fixed column grids with no gap (for custom spacing)
  /** 1 column, no gap */
  cols1NoGap: 'grid grid-cols-1',
  /** 2 columns, no gap */
  cols2NoGap: 'grid grid-cols-2',
  /** 3 columns, no gap */
  cols3NoGap: 'grid grid-cols-3',
  /** 4 columns, no gap */
  cols4NoGap: 'grid grid-cols-4',

  // Responsive grids
  /** Responsive: 1 → 2 columns, gap-4 */
  responsive2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  /** Responsive: 1 column at all breakpoints (explicit) */
  responsive1: 'grid grid-cols-1 sm:grid-cols-1 gap-4',
  /** Responsive: 1 → 3 columns, gap-4 */
  responsive1To3: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
  /** Responsive: 1 → 2 → 3 columns, gap-6 */
  responsive3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  /** Responsive: 1 → 2 → 3 → 4 columns, gap-4 */
  responsive4: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  /** Responsive: 2 → 3 → 4 columns, gap-4 */
  responsive234: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
  /** Responsive: 1 → 2 → 4 columns, gap-4 */
  responsive124: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4',
  /** Responsive: 1 → 3 → 6 columns (contributors), gap-4 */
  responsive136: 'grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4',
  /** Responsive: 1 → 2 → 3 columns, gap-4 */
  responsive123: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4',
  /** Responsive: 1 → 3 columns, gap-4 */
  responsive13Gap4: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  /** Responsive: 1 → 3 columns, gap-6 (V1: GRID_RESPONSIVE_1_3) */
  responsive13: 'grid grid-cols-1 md:grid-cols-3 gap-6',
  /** Responsive: 2 → 3 columns, gap-4 */
  responsive23Gap4: 'grid grid-cols-2 md:grid-cols-3 gap-4',
  /** Responsive: 1 → 2 columns for forms */
  responsiveForm: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  /** Responsive: 1 → 2 columns with gap-6 */
  responsive2Gap6: 'grid grid-cols-1 sm:grid-cols-2 gap-6',
  /** Responsive: 1 → 3 columns with gap-6 */
  responsive3Gap6: 'grid grid-cols-1 md:grid-cols-3 gap-6',
  /** Responsive: 2 → 3 → 4 columns (tabs), gap-2 */
  responsive234Tabs: 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2',
  /** Responsive: 1 → 4 columns with gap-6 */
  responsive4Gap6: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6',
  /** Responsive: 1 → 3 columns (large gap), gap-8 */
  responsive13Gap8: 'grid grid-cols-1 lg:grid-cols-3 gap-8',
  /** Responsive: 1 → 2 → 3 → 6 columns (contributors), gap-4 */
  responsive1236: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4',
  /** Responsive: 1 → 2 → 3 columns (filters), gap-4 at sm, gap-6 at md */
  responsive123Filters: 'grid grid-cols-1 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 gap-4',
  /** Responsive: 1 → 2 → 4 columns, gap-relaxed */
  responsive124Relaxed: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',

  // Content grid patterns
  /** Content grid with tight gaps */
  contentTight: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  /** Content grid with relaxed gaps */
  contentRelaxed: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  /** Feature grid (larger items) */
  feature: 'grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4',
  /** List grid */
  list: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 list-none',
  
  // Layout grids (sidebar + content)
  /** 1 → 4 columns (1 sidebar, 3 content) */
  sidebar: 'grid grid-cols-1 lg:grid-cols-4 gap-6',
  /** 2-column auth layout */
  auth: 'grid grid-cols-1 lg:grid-cols-2',
  
  // Custom column definition grids (semantic patterns)
  /** Sidebar layout: content + 300px sidebar */
  sidebar300: 'grid grid-cols-1 lg:grid-cols-[1fr_300px]',
  /** Sidebar layout: content + 320px sidebar */
  sidebar320: 'grid grid-cols-1 lg:grid-cols-[1fr_320px]',
  /** Timeline layout: auto width + flexible */
  timeline: 'grid grid-cols-[auto_1fr]',
  /** Two-column layout: 2/3 + 1/3 ratio */
  twoThirdsOneThird: 'grid grid-cols-1 lg:grid-cols-[2fr_1fr]',
  /** Footer layout: 1.5:2.5 ratio */
  footer: 'grid grid-cols-1 lg:grid-cols-[1.5fr_2.5fr]',
  /** Hero layout: flexible + auto */
  hero: 'grid grid-cols-1 lg:grid-cols-[1fr_auto]',
  /** Search layout: content + 18rem sidebar */
  search: 'grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem]',
  /** Card header layout: flexible + auto */
  cardHeader: 'grid grid-cols-[1fr_auto]',
} as const;

// =============================================================================
// GRID COLUMN SPAN UTILITIES
// =============================================================================

/**
 * Grid column span utilities.
 * 
 * @migration Replaces inline `col-span-*` Tailwind classes
 * @example
 * // ❌ OLD: className="col-span-2"
 * // ✅ NEW: className={colSpan['2']}
 * // ❌ OLD: className="col-span-full"
 * // ✅ NEW: className={colSpan.full}
 * 
 * @see {@link grid} - For grid container patterns
 */
export const colSpan = {
  /** col-span-1 */
  '1': 'col-span-1',
  /** col-span-2 */
  '2': 'col-span-2',
  /** col-span-3 */
  '3': 'col-span-3',
  /** col-span-4 */
  '4': 'col-span-4',
  /** col-span-5 */
  '5': 'col-span-5',
  /** col-span-6 */
  '6': 'col-span-6',
  /** col-span-7 */
  '7': 'col-span-7',
  /** col-span-8 */
  '8': 'col-span-8',
  /** col-span-9 */
  '9': 'col-span-9',
  /** col-span-10 */
  '10': 'col-span-10',
  /** col-span-11 */
  '11': 'col-span-11',
  /** col-span-12 */
  '12': 'col-span-12',
  /** col-span-full - spans all columns */
  full: 'col-span-full',
  /** col-auto */
  auto: 'col-auto',
  /** lg:col-span-2 - Responsive 2 columns at lg breakpoint */
  lg2: 'lg:col-span-2',
  /** lg:col-span-3 - Responsive 3 columns at lg breakpoint */
  lg3: 'lg:col-span-3',
} as const;

/**
 * Grid row span utilities.
 * 
 * @migration Replaces inline `row-span-*` Tailwind classes
 * @example
 * // ❌ OLD: className="row-span-2"
 * // ✅ NEW: className={rowSpan['2']}
 */
export const rowSpan = {
  /** row-span-1 */
  '1': 'row-span-1',
  /** row-span-2 */
  '2': 'row-span-2',
  /** row-span-3 */
  '3': 'row-span-3',
  /** row-span-4 */
  '4': 'row-span-4',
  /** row-span-5 */
  '5': 'row-span-5',
  /** row-span-6 */
  '6': 'row-span-6',
  /** row-span-full - spans all rows */
  full: 'row-span-full',
  /** row-auto */
  auto: 'row-auto',
} as const;

// =============================================================================
// MAX-WIDTH UTILITIES
// =============================================================================

/**
 * Max-width constraints.
 * 
 * @migration Replaces inline `max-w-*` Tailwind classes
 * @example
 * // ❌ OLD: className="max-w-md"
 * // ✅ NEW: className={maxWidth.md}
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
  /** max-w-[200px] - Tooltip max width */
  tooltip: 'max-w-[200px]',
  /** max-w-[400px] - Newsletter form max width */
  newsletterForm: 'max-w-[400px]',
  /** max-w-32 - Small fixed max width */
  32: 'max-w-32',
  
  // Responsive max-width patterns
  /** sm:max-w-md - Responsive medium at sm breakpoint */
  smMd: 'sm:max-w-md',
  /** sm:max-w-lg - Responsive large at sm breakpoint */
  smLg: 'sm:max-w-lg',
  /** sm:max-w-sm - Responsive small at sm breakpoint */
  smSm: 'sm:max-w-sm',
  
  // Custom arbitrary values
  /** max-w-[150px] - Custom 150px max width */
  '150px': 'max-w-[150px]',
  /** max-w-[200px] - Custom 200px max width (alias for tooltip) */
  '200px': 'max-w-[200px]',
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
  narrow: `${maxWidth['2xl']} mx-auto px-4`,
  /** Medium container */
  medium: `${maxWidth['4xl']} mx-auto px-4`,
  /** Wide container */
  wide: `${maxWidth['7xl']} mx-auto px-4`,
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
  snug: 'space-y-1.5',
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
  /** p-[1px] - 1px padding for scrollbar */
  pixel1: 'p-[1px]',
  
  // X-axis (horizontal) - complete scale
  xNone: 'px-0',
  xHair: 'px-0.5',
  xMicro: 'px-1',
  xSnug: 'px-1.5',
  xTight: 'px-2',
  xBetween: 'px-2.5',
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
  yBetween: 'py-2.5',
  yCompact: 'py-3',
  yDefault: 'py-4',
  yMedium: 'py-5',
  yComfortable: 'py-6',
  yRelaxed: 'py-8',
  yLoose: 'py-12',
  ySpacious: 'py-10',
  ySection: 'py-12',
  yLargish: 'py-14',
  yHero: 'py-16',
  yLarge: 'py-20',
  yXl: 'py-24',
} as const;

// =============================================================================
// DIRECTIONAL PADDING UTILITIES
// =============================================================================

/**
 * Padding top patterns.
 * 
 * @migration Replaces inline `pt-*` Tailwind classes
 * @example
 * // ❌ OLD: className="pt-4"
 * // ✅ NEW: className={paddingTop.default}
 * 
 * @see {@link padding} - For all-sides or axis padding
 * @see {@link paddingBottom} - For bottom-only padding
 */
export const paddingTop = {
  /** pt-0 */
  none: 'pt-0',
  /** pt-0.5 (2px) */
  micro: 'pt-0.5',
  /** pt-1 (4px) */
  tight: 'pt-1',
  /** pt-1.5 (6px) */
  snug: 'pt-1.5',
  /** pt-2 (8px) */
  compact: 'pt-2',
  /** pt-3 (12px) */
  default: 'pt-3',
  /** pt-4 (16px) */
  comfortable: 'pt-4',
  /** pt-5 (20px) */
  medium: 'pt-5',
  /** pt-6 (24px) */
  relaxed: 'pt-6',
  /** pt-8 (32px) */
  loose: 'pt-8',
  /** pt-10 (40px) */
  spacious: 'pt-10',
  /** pt-12 (48px) */
  section: 'pt-12',
  /** pt-16 (64px) */
  hero: 'pt-16',
  /** pt-20 (80px) */
  large: 'pt-20',
  /** pt-24 (96px) */
  xl: 'pt-24',
} as const;

/**
 * Padding bottom patterns.
 * 
 * @migration Replaces inline `pb-*` Tailwind classes
 * @example
 * // ❌ OLD: className="pb-4"
 * // ✅ NEW: className={paddingBottom.default}
 * 
 * @see {@link padding} - For all-sides or axis padding
 * @see {@link paddingTop} - For top-only padding
 */
export const paddingBottom = {
  /** pb-0 */
  none: 'pb-0',
  /** pb-0.5 (2px) */
  micro: 'pb-0.5',
  /** pb-1 (4px) */
  tight: 'pb-1',
  /** pb-1.5 (6px) */
  snug: 'pb-1.5',
  /** pb-2 (8px) */
  compact: 'pb-2',
  /** pb-3 (12px) */
  default: 'pb-3',
  /** pb-4 (16px) */
  comfortable: 'pb-4',
  /** pb-5 (20px) */
  medium: 'pb-5',
  /** pb-6 (24px) */
  relaxed: 'pb-6',
  /** pb-8 (32px) */
  loose: 'pb-8',
  /** pb-10 (40px) */
  spacious: 'pb-10',
  /** pb-12 (48px) */
  section: 'pb-12',
  /** pb-16 (64px) */
  hero: 'pb-16',
  /** pb-20 (80px) */
  large: 'pb-20',
  /** pb-24 (96px) */
  xl: 'pb-24',
} as const;

/**
 * Padding left patterns.
 * 
 * @migration Replaces inline `pl-*` Tailwind classes
 * @example
 * // ❌ OLD: className="pl-4"
 * // ✅ NEW: className={paddingLeft.comfortable}
 * 
 * @see {@link padding} - For all-sides or axis padding
 * @see {@link paddingRight} - For right-only padding
 */
export const paddingLeft = {
  /** pl-0 */
  none: 'pl-0',
  /** pl-0.5 (2px) */
  micro: 'pl-0.5',
  /** pl-1 (4px) */
  tight: 'pl-1',
  /** pl-1.5 (6px) */
  snug: 'pl-1.5',
  /** pl-2 (8px) */
  compact: 'pl-2',
  /** pl-2.5 (10px) */
  between: 'pl-2.5',
  /** pl-3 (12px) */
  default: 'pl-3',
  /** pl-4 (16px) */
  comfortable: 'pl-4',
  /** pl-5 (20px) */
  medium: 'pl-5',
  /** pl-6 (24px) */
  relaxed: 'pl-6',
  /** pl-8 (32px) */
  loose: 'pl-8',
  /** pl-9 (36px) */
  large: 'pl-9',
  /** pl-10 (40px) */
  spacious: 'pl-10',
  /** pl-12 (48px) */
  section: 'pl-12',
  /** pl-14 (56px) */
  hero: 'pl-14',
  /** pl-10 (40px) - Icon padding */
  icon: 'pl-10',
} as const;

/**
 * Padding right patterns.
 * 
 * @migration Replaces inline `pr-*` Tailwind classes
 * @example
 * // ❌ OLD: className="pr-4"
 * // ✅ NEW: className={paddingRight.comfortable}
 * 
 * @see {@link padding} - For all-sides or axis padding
 * @see {@link paddingLeft} - For left-only padding
 */
export const paddingRight = {
  /** pr-0 */
  none: 'pr-0',
  /** pr-0.5 (2px) */
  micro: 'pr-0.5',
  /** pr-1 (4px) */
  tight: 'pr-1',
  /** pr-1.5 (6px) */
  snug: 'pr-1.5',
  /** pr-2 (8px) */
  compact: 'pr-2',
  /** pr-3 (12px) */
  default: 'pr-3',
  /** pr-4 (16px) */
  comfortable: 'pr-4',
  /** pr-5 (20px) */
  medium: 'pr-5',
  /** pr-6 (24px) */
  relaxed: 'pr-6',
  /** pr-8 (32px) */
  loose: 'pr-8',
  /** pr-10 (40px) */
  spacious: 'pr-10',
  /** pr-12 (48px) */
  section: 'pr-12',
  /** pr-10 (40px) - Icon padding */
  icon: 'pr-10',
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
  // Negative margins
  negativeMicro: '-mb-1',
  negativeTight: '-mb-2',
  negativeCompact: '-mb-3',
  negativeDefault: '-mb-4',
  negativeComfortable: '-mb-6',
  negativeRelaxed: '-mb-8',
} as const;

/**
 * Margin top patterns.
 * 
 * @migration Replaces inline `mt-*` Tailwind classes
 * @example
 * // ❌ OLD: className="mt-4"
 * // ✅ NEW: className={marginTop.default}
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
// MARGIN Y-AXIS (VERTICAL)
// =============================================================================

/**
 * Margin Y-axis (top + bottom) patterns.
 * 
 * @migration Replaces inline `my-*` Tailwind classes
 * @example
 * // ❌ OLD: className="my-4"
 * // ✅ NEW: className={marginY.default}
 * 
 * @see {@link marginTop} - For top-only margin
 * @see {@link marginBottom} - For bottom-only margin
 */
export const marginY = {
  /** my-0 */
  none: 'my-0',
  /** my-0.5 (2px) */
  micro: 'my-0.5',
  /** my-1 (4px) */
  tight: 'my-1',
  /** my-2 (8px) */
  compact: 'my-2',
  /** my-2.5 (10px) - Between compact and default */
  between: 'my-2.5',
  /** my-3 (12px) */
  default: 'my-3',
  /** my-4 (16px) */
  comfortable: 'my-4',
  /** my-6 (24px) */
  relaxed: 'my-6',
  /** my-8 (32px) */
  loose: 'my-8',
  /** my-12 (48px) */
  section: 'my-12',
  /** my-16 (64px) */
  hero: 'my-16',
} as const;

// =============================================================================
// MARGIN X-AXIS (HORIZONTAL)
// =============================================================================

/**
 * Margin X-axis (left + right) patterns.
 * 
 * @migration Replaces inline `mx-*` Tailwind classes
 * @example
 * // ❌ OLD: className="mx-auto"
 * // ✅ NEW: className={marginX.auto}
 * // ❌ OLD: className="mx-4"
 * // ✅ NEW: className={marginX.comfortable}
 */
export const marginX = {
  /** mx-0 */
  none: 'mx-0',
  /** mx-auto - Centers block elements */
  auto: 'mx-auto',
  /** -mx-1 (negative 4px) */
  neg1: '-mx-1',
  /** -mx-4 (negative 16px) - Negative comfortable margin */
  neg4: '-mx-4',
  /** mx-0.5 (2px) */
  micro: 'mx-0.5',
  /** mx-1 (4px) */
  tight: 'mx-1',
  /** mx-2 (8px) */
  compact: 'mx-2',
  /** mx-3 (12px) */
  default: 'mx-3',
  /** mx-4 (16px) */
  comfortable: 'mx-4',
  /** mx-6 (24px) */
  relaxed: 'mx-6',
  /** mx-8 (32px) */
  loose: 'mx-8',
} as const;

// =============================================================================
// MARGIN RIGHT
// =============================================================================

/**
 * Margin right patterns.
 * 
 * @migration Replaces inline `mr-*` Tailwind classes
 * @example
 * // ❌ OLD: className="mr-2"
 * // ✅ NEW: className={marginRight.compact}
 * // ❌ OLD: className="mr-auto"
 * // ✅ NEW: className={marginRight.auto}
 */
export const marginRight = {
  /** mr-0 */
  none: 'mr-0',
  /** mr-auto - Pushes element to the left */
  auto: 'mr-auto',
  /** mr-0.5 (2px) */
  micro: 'mr-0.5',
  /** mr-1 (4px) */
  tight: 'mr-1',
  /** mr-1.5 (6px) */
  snug: 'mr-1.5',
  /** mr-2 (8px) */
  compact: 'mr-2',
  /** mr-3 (12px) */
  default: 'mr-3',
  /** mr-4 (16px) */
  comfortable: 'mr-4',
  /** mr-6 (24px) */
  relaxed: 'mr-6',
  /** mr-8 (32px) */
  loose: 'mr-8',
} as const;

// =============================================================================
// MARGIN LEFT
// =============================================================================

/**
 * Margin left patterns.
 * 
 * @migration Replaces inline `ml-*` Tailwind classes
 * @example
 * // ❌ OLD: className="ml-2"
 * // ✅ NEW: className={marginLeft.compact}
 * // ❌ OLD: className="ml-auto"
 * // ✅ NEW: className={marginLeft.auto}
 */
export const marginLeft = {
  /** ml-0 */
  none: 'ml-0',
  /** ml-auto - Pushes element to the right */
  auto: 'ml-auto',
  /** ml-0.5 (2px) */
  micro: 'ml-0.5',
  /** ml-1 (4px) */
  tight: 'ml-1',
  /** ml-1.5 (6px) */
  snug: 'ml-1.5',
  /** ml-2 (8px) */
  compact: 'ml-2',
  /** ml-3 (12px) */
  default: 'ml-3',
  /** ml-4 (16px) */
  comfortable: 'ml-4',
  /** ml-6 (24px) */
  relaxed: 'ml-6',
  /** ml-8 (32px) */
  loose: 'ml-8',
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
  /** w-2.5 - 10px - Scrollbar width */
  scrollbar: 'w-2.5',
  /** w-2.5 - 10px - Slider width (same as scrollbar) */
  slider: 'w-2.5',
  /** w-0 - Zero width */
  0: 'w-0',
  /** w-0.5 - 2px - Thin divider width */
  hairline: 'w-0.5',
  /** w-1.5 - 6px - Small dot width */
  dot: 'w-1.5',
  /** w-3.5 - 14px - Small icon width */
  iconSm: 'w-3.5',
  /** w-20 - 80px - Gradient fade width */
  gradientFade: 'w-20',
  /** w-48 - 192px - Standard dropdown/menu width */
  menu: 'w-48',
  /** w-48 - 192px - Standard dropdown/menu width (numeric alias) */
  '48': 'w-48',
  /** w-56 - 224px - Dropdown/popover width */
  dropdown: 'w-56',
  /** w-80 - 320px - Sidebar width */
  sidebar: 'w-80',
  
  // Responsive fractional widths
  /** sm:w-1/3 - One third width at sm breakpoint */
  smThird: 'sm:w-1/3',
  /** sm:w-2/3 - Two thirds width at sm breakpoint */
  smTwoThirds: 'sm:w-2/3',
  
  // Skeleton/loading bar widths
  /** w-16 - 64px - Small skeleton width */
  skeletonSm: 'w-16',
  /** w-24 - 96px - Compact skeleton width */
  skeletonCompact: 'w-24',
  /** w-32 - 128px - Default skeleton width */
  skeletonDefault: 'w-32',
  /** w-48 - 192px - Comfortable skeleton width */
  skeletonComfortable: 'w-48',
  /** w-64 - 256px - Large skeleton width */
  skeletonLarge: 'w-64',
  /** w-96 - 384px - Extra large skeleton width */
  skeletonXl: 'w-96',
  
  // Additional fractional widths
  /** w-4/5 - 80% width */
  fourFifths: 'w-4/5',
  /** w-5/6 - 83.33% width */
  fiveSixths: 'w-5/6',
} as const;

// =============================================================================
// HEIGHT UTILITIES
// =============================================================================

/**
 * Height utilities for common patterns.
 * For icon heights, use iconSize.* instead.
 * 
 * @migration Replaces inline `h-*` Tailwind classes
 * @example
 * // ❌ OLD: className="h-[80vh]"
 * // ✅ NEW: className={height.viewport80}
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
  
  // Standard numeric heights (for inputs, buttons, etc.)
  /** h-10 - 40px - Standard input/button height */
  input: 'h-10',
  /** h-12 - 48px - Search bar height */
  search: 'h-12',
  /** h-6 - 24px - Badge/icon height */
  badge: 'h-6',
  /** h-14 - 56px - Large input height */
  inputLg: 'h-14',
  /** h-16 - 64px - Hero element height */
  hero: 'h-16',
  /** h-9 - 36px - Small button height */
  buttonSm: 'h-9',
  /** h-11 - 44px - Large button height */
  buttonLg: 'h-11',
  /** h-2 - 8px - Slider track height */
  slider: 'h-2',
  /** h-2.5 - 10px - Scrollbar height */
  scrollbar: 'h-2.5',
  
  // Skeleton/loading bar heights
  /** h-3 - 12px - Extra small skeleton height */
  skeletonXs: 'h-3',
  /** h-4 - 16px - Small skeleton height */
  skeletonSm: 'h-4',
  /** h-8 - 32px - Large skeleton height */
  skeletonLg: 'h-8',
  
  // Viewport-based heights
  /** h-[40vh] - 40% viewport */
  viewport40: 'h-[40vh]',
  /** h-[50vh] - 50% viewport */
  viewport50: 'h-[50vh]',
  /** h-[60vh] - 60% viewport */
  viewport60: 'h-[60vh]',
  /** h-[70vh] - 70% viewport */
  viewport70: 'h-[70vh]',
  /** h-[80vh] - 80% viewport */
  viewport80: 'h-[80vh]',
  /** h-[90vh] - 90% viewport */
  viewport90: 'h-[90vh]',
  /** h-[100vh] - 100% viewport */
  viewport100: 'h-[100vh]',
  /** h-[100dvh] - 100% dynamic viewport */
  viewport100dvh: 'h-[100dvh]',
  
  // Divider heights
  /** h-px - 1px divider */
  px: 'h-px',
  /** h-[1px] - Standard divider */
  divider: 'h-[1px]',
  /** h-[2px] - Underline/thick divider */
  underline: 'h-[2px]',
  /** h-[0.5px] - Hairline divider */
  hairline: 'h-[0.5px]',
  /** h-1.5 - 6px - Small dot/indicator height */
  dot: 'h-1.5',
  /** h-3.5 - 14px - Small icon height */
  iconSm: 'h-3.5',
  /** h-20 - 80px - Gradient fade height */
  gradientFade: 'h-20',
  /** h-80 (320px) - Avatar 5xl size */
  avatar5xl: 'h-80',
  /** h-[300px] - Scroll area height */
  scrollArea: 'h-[300px]',
  /** h-[400px] - Large scroll area height */
  scrollAreaLg: 'h-[400px]',
  /** h-48 - 192px - Large image/card height */
  imageLg: 'h-48',
} as const;

// =============================================================================
// SIZE UTILITIES (combined width + height)
// =============================================================================

/**
 * Square size utilities for elements that need equal width and height.
 * For icons, prefer iconSize.* which includes these plus semantic names.
 * 
 * @migration Replaces inline `h-X w-X` patterns for containers, avatars, and decorative elements
 * @example
 * // ❌ OLD: className="h-16 w-16"
 * // ✅ NEW: className={squareSize.avatarXl}
 * // ❌ OLD: className="h-32 w-32"
 * // ✅ NEW: className={squareSize.avatar4xl}
 * 
 * @see {@link iconSize} in icons.ts - For icon-specific square sizes
 */
export const squareSize = {
  // Dot/indicator sizes (tiny decorative elements)
  /** h-1 w-1 - 4px - Tiny dot indicator */
  dot: 'h-1 w-1',
  /** h-1.5 w-1.5 - 6px - Small dot */
  dotSm: 'h-1.5 w-1.5',
  /** h-2 w-2 - 8px - Medium dot */
  dotMd: 'h-2 w-2',
  /** h-3 w-3 - 12px - Large dot / timeline indicator */
  indicator: 'h-3 w-3',
  
  // Touch target sizes (accessibility)
  /** h-8 w-8 - 32px - minimum touch target */
  touchSm: 'h-8 w-8',
  /** h-10 w-10 - 40px - comfortable touch target */
  touchMd: 'h-10 w-10',
  /** h-11 w-11 - 44px - Apple's recommended minimum */
  touchLg: 'h-11 w-11',
  /** h-12 w-12 - 48px - Google's recommended minimum */
  touchXl: 'h-12 w-12',
  /** h-14 w-14 - 56px - Large touch target */
  touch2xl: 'h-14 w-14',
  
  // Avatar sizes (complete scale)
  /** h-6 w-6 - 24px */
  avatarXs: 'h-6 w-6',
  /** h-7 w-7 - 28px */
  avatarXsPlus: 'h-7 w-7',
  /** h-8 w-8 - 32px */
  avatarSm: 'h-8 w-8',
  /** h-10 w-10 - 40px */
  avatarMd: 'h-10 w-10',
  /** h-12 w-12 - 48px */
  avatarLg: 'h-12 w-12',
  /** h-16 w-16 - 64px */
  avatarXl: 'h-16 w-16',
  /** h-20 w-20 - 80px */
  avatar2xl: 'h-20 w-20',
  /** h-24 w-24 - 96px */
  avatar3xl: 'h-24 w-24',
  /** h-32 w-32 - 128px */
  avatar4xl: 'h-32 w-32',
  /** h-40 w-40 - 160px */
  avatar5xl: 'h-40 w-40',
  /** h-48 w-48 - 192px (QR codes, large avatars) */
  avatar6xl: 'h-48 w-48',
  
  // Hero/decorative sizes (large decorative elements)
  /** h-64 w-64 - 256px - Hero decorative element */
  hero: 'h-64 w-64',
  /** h-80 w-80 - 320px - Large hero element */
  heroLg: 'h-80 w-80',
  /** h-96 w-96 - 384px - Extra large hero element */
  heroXl: 'h-96 w-96',
} as const;

// =============================================================================
// SKELETON / LOADING BAR SIZES (non-square rectangular elements)
// =============================================================================

/**
 * Skeleton/loading bar size utilities for rectangular loading elements.
 * These are non-square patterns (h-X w-Y where X ≠ Y) used for skeleton loaders.
 * 
 * @migration Replaces inline `h-X w-Y` patterns for loading skeletons
 * @example
 * // ❌ OLD: className="h-4 w-24"
 * // ✅ NEW: className={skeletonSize.barCompact}
 * // ❌ OLD: className="h-6 w-32"
 * // ✅ NEW: className={skeletonSize.barDefault}
 */
export const skeletonSize = {
  // Navigation/UI element sizes
  /** h-1 w-12 - 4px × 48px - Navigation handle/drag bar */
  handle: 'h-1 w-12',
  
  // Small skeleton bars (text lines, compact elements)
  /** h-3 w-14 - 12px × 56px - Very small skeleton bar */
  barXs: 'h-3 w-14',
  /** h-3 w-32 - 12px × 128px - Small skeleton bar */
  barSm: 'h-3 w-32',
  /** h-3 w-5/6 - 12px × 83.33% - Small skeleton bar (responsive) */
  barSmResponsive: 'h-3 w-5/6',
  /** h-3 w-1/2 - 12px × 50% - Small skeleton bar (half width) */
  barSmHalf: 'h-3 w-1/2',
  
  // Default skeleton bars (common text/content)
  /** h-4 w-16 - 16px × 64px - Compact skeleton bar */
  barCompact: 'h-4 w-16',
  /** h-4 w-24 - 16px × 96px - Default skeleton bar */
  barDefault: 'h-4 w-24',
  /** h-4 w-32 - 16px × 128px - Comfortable skeleton bar */
  barComfortable: 'h-4 w-32',
  /** h-4 w-64 - 16px × 256px - Large skeleton bar */
  barLarge: 'h-4 w-64',
  /** h-4 w-80 - 16px × 320px - Extra large skeleton bar */
  barXl: 'h-4 w-80',
  /** h-4 w-96 - 16px × 384px - Maximum skeleton bar */
  barMax: 'h-4 w-96',
  /** h-4 w-2/3 - 16px × 66.67% - Skeleton bar (responsive) */
  barResponsive: 'h-4 w-2/3',
  /** h-4 w-3/4 - 16px × 75% - Skeleton bar (three-quarters width) */
  barThreeQuarters: 'h-4 w-3/4',
  
  // Medium skeleton bars (headings, larger content)
  /** h-5 w-16 - 20px × 64px - Medium compact skeleton */
  barMdCompact: 'h-5 w-16',
  /** h-5 w-24 - 20px × 96px - Medium default skeleton */
  barMdDefault: 'h-5 w-24',
  /** h-5 w-28 - 20px × 112px - Medium comfortable skeleton */
  barMdComfortable: 'h-5 w-28',
  /** h-5 w-32 - 20px × 128px - Medium large skeleton */
  barMdLarge: 'h-5 w-32',
  
  // Large skeleton bars (headings, buttons)
  /** h-6 w-16 - 24px × 64px - Large compact skeleton */
  barLgCompact: 'h-6 w-16',
  /** h-6 w-20 - 24px × 80px - Large default skeleton */
  barLgDefault: 'h-6 w-20',
  /** h-6 w-24 - 24px × 96px - Large comfortable skeleton */
  barLgComfortable: 'h-6 w-24',
  /** h-6 w-32 - 24px × 128px - Large skeleton */
  barLgLarge: 'h-6 w-32',
  /** h-6 w-64 - 24px × 256px - Large extra skeleton */
  barLgXl: 'h-6 w-64',
  /** h-6 w-80 - 24px × 320px - Large maximum skeleton */
  barLgMax: 'h-6 w-80',
  /** h-6 w-96 - 24px × 384px - Large maximum skeleton */
  barLgMaxWide: 'h-6 w-96',
  /** h-6 w-3/4 - 24px × 75% - Large skeleton (three-quarters width) */
  barLgThreeQuarters: 'h-6 w-3/4',
  
  // Extra large skeleton bars (hero elements, large headings)
  /** h-8 w-24 - 32px × 96px - Extra large skeleton */
  barXlDefault: 'h-8 w-24',
  
  // Button/input skeleton sizes
  /** h-9 w-16 - 36px × 64px - Button compact skeleton */
  buttonCompact: 'h-9 w-16',
  /** h-9 w-20 - 36px × 80px - Button default skeleton */
  buttonDefault: 'h-9 w-20',
  /** h-9 w-24 - 36px × 96px - Button comfortable skeleton */
  buttonComfortable: 'h-9 w-24',
  /** h-9 w-28 - 36px × 112px - Button large skeleton */
  buttonLarge: 'h-9 w-28',
  
  // Hero/heading skeleton sizes
  /** h-12 w-64 - 48px × 256px - Hero skeleton */
  heroBar: 'h-12 w-64',
  
  // Progress bar sizes
  /** h-2 w-32 - 8px × 128px - Progress bar */
  progressBar: 'h-2 w-32',
} as const;

// =============================================================================
// COMPONENT-SPECIFIC SIZES (non-standard patterns)
// =============================================================================

/**
 * Component-specific size utilities for UI elements with non-standard dimensions.
 * These are specific to certain components and don't fit into general categories.
 * 
 * @migration Replaces component-specific inline `h-X w-Y` patterns
 * @example
 * // ❌ OLD: className="h-6 w-11"
 * // ✅ NEW: className={componentSize.switch}
 */
export const componentSize = {
  /** h-6 w-11 - 24px × 44px - Switch component (Radix UI switch) */
  switch: 'h-6 w-11',
} as const;

// =============================================================================
// DROPDOWN WIDTH UTILITIES
// =============================================================================

/**
 * Dropdown width utilities.
 */
export const dropdownWidth = {
  /** w-[280px] - Small dropdown */
  sm: 'w-[280px]',
  /** w-[380px] - Medium dropdown */
  md: 'w-[380px]',
  /** w-[480px] - Large dropdown */
  lg: 'w-[480px]',
  /** w-[560px] - Extra large dropdown */
  xl: 'w-[560px]',
  /** w-[560px] - Mega menu (alias) */
  megaMenu: 'w-[560px]',
} as const;

// =============================================================================
// SIDEBAR WIDTH UTILITIES
// =============================================================================

/**
 * Sidebar width utilities.
 */
export const sidebarWidth = {
  /** w-[280px] - Default sidebar */
  default: 'w-[280px]',
  /** w-[380px] - Large sidebar */
  lg: 'w-[380px]',
} as const;

// =============================================================================
// SKELETON/LOADING PLACEHOLDER SIZES
// =============================================================================

/**
 * Skeleton loading placeholder dimensions.
 * Use these for consistent loading states across the app.
 * 
 * @migration Replaces inline skeleton dimension patterns
 * @example
 * // ❌ OLD: className="h-4 w-32"
 * // ✅ NEW: className={`${skeleton.height.text} ${skeleton.width.md}`}
 * // ❌ OLD: className="h-12 w-12"
 * // ✅ NEW: className={skeleton.square.avatar}
 */
export const skeleton = {
  // Height for text lines
  height: {
    /** h-2 - Tiny placeholder */
    micro: 'h-2',
    /** h-3 - Small text placeholder */
    xs: 'h-3',
    /** h-4 - Normal text placeholder */
    text: 'h-4',
    /** h-5 - Large text placeholder */
    textLg: 'h-5',
    /** h-6 - Heading placeholder */
    heading: 'h-6',
    /** h-8 - Large heading */
    headingLg: 'h-8',
    /** h-9 - Button placeholder */
    button: 'h-9',
    /** h-12 - Card header */
    cardHeader: 'h-12',
    /** h-16 - Card section */
    cardSection: 'h-16',
    /** h-32 - Image placeholder */
    image: 'h-32',
    /** h-48 - Large image */
    imageLg: 'h-48',
    /** h-64 - Hero image */
    hero: 'h-64',
  },
  // Width for text lines  
  width: {
    /** w-8 - Tiny width */
    xs: 'w-8',
    /** w-12 - Extra small width */
    sm: 'w-12',
    /** w-16 - Small width */
    md: 'w-16',
    /** w-20 - Medium-small width */
    lg: 'w-20',
    /** w-24 - Medium width */
    xl: 'w-24',
    /** w-28 - Medium-large width */
    '2xl': 'w-28',
    /** w-32 - Large width */
    '3xl': 'w-32',
    /** w-48 - Extra large width */
    '4xl': 'w-48',
    /** w-64 - Wide width */
    '5xl': 'w-64',
    /** w-80 - Extra wide width */
    '6xl': 'w-80',
    /** w-96 - Maximum width */
    '7xl': 'w-96',
    /** w-1/2 - Half width */
    half: 'w-1/2',
    /** w-2/3 - Two thirds width */
    twoThirds: 'w-2/3',
    /** w-3/4 - Three quarters width */
    threeQuarters: 'w-3/4',
    /** w-5/6 - Five sixths width */
    fiveSixths: 'w-5/6',
    /** w-full - Full width */
    full: 'w-full',
  },
  // Square placeholders
  square: {
    /** h-6 w-6 - Icon skeleton */
    icon: 'h-6 w-6',
    /** h-8 w-8 - Small avatar */
    avatarSm: 'h-8 w-8',
    /** h-10 w-10 - Medium avatar */
    avatar: 'h-10 w-10',
    /** h-12 w-12 - Large avatar */
    avatarLg: 'h-12 w-12',
    /** h-16 w-16 - Extra large avatar */
    avatarXl: 'h-16 w-16',
  },
} as const;

// =============================================================================
// MIN-WIDTH UTILITIES
// =============================================================================

/**
 * Min-width constraints.
 */
export const minWidth = {
  // Numeric scale (Tailwind standard)
  /** min-w-0 - Allow shrinking in flex */
  0: 'min-w-0',
  /** min-w-4 - 16px minimum */
  4: 'min-w-4',
  /** min-w-5 - 20px minimum */
  5: 'min-w-5',
  /** min-w-6 - 24px minimum */
  6: 'min-w-6',
  /** min-w-8 - 32px minimum */
  8: 'min-w-8',
  /** min-w-10 - 40px minimum */
  10: 'min-w-10',
  /** min-w-12 - 48px minimum */
  12: 'min-w-12',
  /** min-w-16 - 64px minimum */
  16: 'min-w-16',
  /** min-w-20 - 80px minimum */
  20: 'min-w-20',
  /** min-w-24 - 96px minimum */
  24: 'min-w-24',
  /** min-w-32 - 128px minimum */
  32: 'min-w-32',
  
  // Content-based
  /** min-w-fit - Fit content */
  fit: 'min-w-fit',
  /** min-w-max - Max content */
  max: 'min-w-max',
  /** min-w-min - Min content */
  min: 'min-w-min',
  /** min-w-full - Full width */
  full: 'min-w-full',
  
  // Semantic/arbitrary values
  /** min-w-[8rem] - Button minimum width */
  button: 'min-w-[8rem]',
  /** min-w-[1.5rem] - Badge minimum width */
  badge: 'min-w-[1.5rem]',
  /** min-w-[200px] - Input field minimum */
  input: 'min-w-[200px]',
  /** min-w-[36px] - Small icon button */
  iconButtonSm: 'min-w-[36px]',
  /** min-w-[40px] - Medium icon button */
  iconButtonMd: 'min-w-[40px]',
  /** min-w-[320px] - Newsletter form */
  newsletterForm: 'min-w-[320px]',
  /** min-w-[360px] - Large newsletter form */
  newsletterFormLg: 'min-w-[360px]',
  /** min-w-[140px] - Newsletter button */
  newsletterButton: 'min-w-[140px]',
  /** min-w-[400px] - Popover/modal width */
  popover: 'min-w-[400px]',
  /** min-w-[400px] - Modal width (alias) */
  modal: 'min-w-[400px]',
  /** min-w-[3ch] - Character-based width */
  char3: 'min-w-[3ch]',
} as const;

// =============================================================================
// MIN-HEIGHT UTILITIES
// =============================================================================

/**
 * Min-height constraints.
 * 
 * @migration Replaces inline `min-h-*` Tailwind classes
 * @example
 * // ❌ OLD: className="min-h-screen"
 * // ✅ NEW: className={minHeight.screen}
 * // ❌ OLD: className="min-h-[60vh]"
 * // ✅ NEW: className={minHeight.viewport60}
 */
export const minHeight = {
  // Standard Tailwind
  /** min-h-0 */
  0: 'min-h-0',
  /** min-h-full */
  full: 'min-h-full',
  /** min-h-screen */
  screen: 'min-h-screen',
  /** min-h-svh (small viewport height) */
  svh: 'min-h-svh',
  /** min-h-dvh (dynamic viewport height) */
  dvh: 'min-h-dvh',
  
  // Pixel-based semantic heights
  /** min-h-[150px] - Extra small content area */
  xs: 'min-h-[150px]',
  /** min-h-[200px] - Small content area */
  sm: 'min-h-[200px]',
  /** min-h-[300px] - Medium content area */
  md: 'min-h-[300px]',
  /** min-h-[400px] - Content section */
  lg: 'min-h-[400px]',
  /** min-h-[400px] - Content section (semantic alias) */
  content: 'min-h-[400px]',
  /** min-h-[400px] - Section (semantic alias) */
  section: 'min-h-[400px]',
  /** min-h-[500px] - Large content area */
  xl: 'min-h-[500px]',
  /** min-h-[500px] - Large (semantic alias) */
  large: 'min-h-[500px]',
  /** min-h-[500px] - Terminal height */
  terminal: 'min-h-[500px]',
  
  // Viewport-based heights
  /** min-h-[40vh] - 40% viewport */
  viewport40: 'min-h-[40vh]',
  /** min-h-[50vh] - 50% viewport */
  viewport50: 'min-h-[50vh]',
  /** min-h-[60vh] - 60% viewport */
  viewport60: 'min-h-[60vh]',
  /** min-h-[70vh] - 70% viewport */
  viewport70: 'min-h-[70vh]',
  /** min-h-[80vh] - 80% viewport */
  viewport80: 'min-h-[80vh]',
} as const;

// =============================================================================
// MAX-HEIGHT UTILITIES
// =============================================================================

/**
 * Max-height constraints.
 * 
 * @migration Replaces inline `max-h-*` Tailwind classes
 * @example
 * // ❌ OLD: className="max-h-screen"
 * @see {@link minHeight} - For minimum height constraints
 */
export const maxHeight = {
  /** max-h-0 */
  0: 'max-h-0',
  /** max-h-none */
  none: 'max-h-none',
  /** max-h-full */
  full: 'max-h-full',
  /** max-h-screen */
  screen: 'max-h-screen',
  /** max-h-svh (small viewport height) */
  svh: 'max-h-svh',
  /** max-h-dvh (dynamic viewport height) */
  dvh: 'max-h-dvh',
  /** max-h-min */
  min: 'max-h-min',
  /** max-h-max */
  max: 'max-h-max',
  /** max-h-fit */
  fit: 'max-h-fit',
  // Fixed height constraints
  /** max-h-48 (192px) */
  48: 'max-h-48',
  /** max-h-64 (256px) */
  64: 'max-h-64',
  /** max-h-80 (320px) */
  80: 'max-h-80',
  /** max-h-96 (384px) */
  96: 'max-h-96',
  // Viewport-based constraints (common UI patterns)
  /** max-h-[300px] - Dropdown menus */
  dropdown: 'max-h-[300px]',
  /** max-h-[400px] - Popovers */
  popover: 'max-h-[400px]',
  /** max-h-[80vh] - Modal dialogs */
  modal: 'max-h-[80vh]',
  /** max-h-[calc(100vh-6rem)] - Sidebars */
  sidebar: 'max-h-[calc(100vh-6rem)]',
  /** max-h-[calc(80vh-8rem)] - Notification panels */
  notification: 'max-h-[calc(80vh-8rem)]',
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

// =============================================================================
// FLEX DIRECTION & WRAP
// =============================================================================

/**
 * Flex direction utilities.
 */
export const flexDir = {
  /** Row (default) */
  row: 'flex-row',
  /** Row reverse */
  rowReverse: 'flex-row-reverse',
  /** Column */
  col: 'flex-col',
  /** Column reverse */
  colReverse: 'flex-col-reverse',
} as const;

/**
 * Flex wrap utilities.
 */
export const flexWrap = {
  /** Wrap */
  wrap: 'flex-wrap',
  /** Wrap reverse */
  wrapReverse: 'flex-wrap-reverse',
  /** No wrap */
  nowrap: 'flex-nowrap',
} as const;

/**
 * Flex grow/shrink utilities.
 */
export const flexGrow = {
  /** Grow */
  grow: 'grow',
  /** Don't grow */
  grow0: 'grow-0',
  /** Shrink */
  shrink: 'shrink',
  /** Don't shrink */
  shrink0: 'shrink-0',
  /** Flex-1 (grow and shrink) */
  '1': 'flex-1',
  /** Flex-auto */
  auto: 'flex-auto',
  /** Flex-initial */
  initial: 'flex-initial',
  /** Flex-none */
  none: 'flex-none',
} as const;

/**
 * Flex basis utilities.
 */
export const flexBasis = {
  /** basis-10 - 2.5rem (40px) */
  rem10: 'basis-10',
} as const;

// =============================================================================
// JUSTIFY CONTENT
// =============================================================================

/**
 * Justify content utilities.
 */
export const justify = {
  /** Start */
  start: 'justify-start',
  /** End */
  end: 'justify-end',
  /** Center */
  center: 'justify-center',
  /** Space between */
  between: 'justify-between',
  /** Space around */
  around: 'justify-around',
  /** Space evenly */
  evenly: 'justify-evenly',
  /** Stretch */
  stretch: 'justify-stretch',
} as const;

// =============================================================================
// ALIGN ITEMS
// =============================================================================

/**
 * Align items utilities.
 * Named `alignItems` to avoid conflicts with common `items` data arrays.
 */
export const alignItems = {
  /** Start */
  start: 'items-start',
  /** End */
  end: 'items-end',
  /** Center */
  center: 'items-center',
  /** Baseline */
  baseline: 'items-baseline',
  /** Stretch */
  stretch: 'items-stretch',
} as const;

/**
 * Grid column start utilities.
 * 
 * @migration Replaces inline `col-start-*` Tailwind classes
 * @example
 * // ❌ OLD: className="col-start-2"
 * // ✅ NEW: className={colStart['2']}
 */
export const colStart = {
  /** col-start-1 */
  '1': 'col-start-1',
  /** col-start-2 */
  '2': 'col-start-2',
  /** col-start-3 */
  '3': 'col-start-3',
  /** col-start-4 */
  '4': 'col-start-4',
  /** col-auto */
  auto: 'col-auto',
} as const;

/**
 * Grid row start utilities.
 * 
 * @migration Replaces inline `row-start-*` Tailwind classes
 * @example
 * // ❌ OLD: className="row-start-1"
 * // ✅ NEW: className={rowStart['1']}
 */
export const rowStart = {
  /** row-start-1 */
  '1': 'row-start-1',
  /** row-start-2 */
  '2': 'row-start-2',
  /** row-start-3 */
  '3': 'row-start-3',
  /** row-auto */
  auto: 'row-auto',
} as const;

/**
 * Grid justify-self utilities.
 * 
 * @migration Replaces inline `justify-self-*` Tailwind classes
 * @example
 * // ❌ OLD: className="justify-self-end"
 * // ✅ NEW: className={justifySelf.end}
 */
export const justifySelf = {
  /** justify-self-start */
  start: 'justify-self-start',
  /** justify-self-end */
  end: 'justify-self-end',
  /** justify-self-center */
  center: 'justify-self-center',
  /** justify-self-stretch */
  stretch: 'justify-self-stretch',
} as const;

/**
 * Grid auto-rows utilities.
 * 
 * @migration Replaces inline `auto-rows-*` Tailwind classes
 * @example
 * // ❌ OLD: className="auto-rows-min"
 * // ✅ NEW: className={gridAutoRows.min}
 */
export const gridAutoRows = {
  /** auto-rows-min */
  min: 'auto-rows-min',
  /** auto-rows-max */
  max: 'auto-rows-max',
  /** auto-rows-auto */
  auto: 'auto-rows-auto',
  /** auto-rows-fr */
  fr: 'auto-rows-fr',
} as const;

/**
 * Grid template rows utilities.
 * 
 * @migration Replaces inline `grid-rows-*` Tailwind classes
 * @example
 * // ❌ OLD: className="grid-rows-[auto_auto]"
 * // ✅ NEW: className={gridTemplateRows.autoAuto}
 */
export const gridTemplateRows = {
  /** grid-rows-[auto_auto] - Two auto rows */
  autoAuto: 'grid-rows-[auto_auto]',
  /** grid-rows-1 */
  '1': 'grid-rows-1',
  /** grid-rows-2 */
  '2': 'grid-rows-2',
  /** grid-rows-3 */
  '3': 'grid-rows-3',
  /** grid-rows-4 */
  '4': 'grid-rows-4',
  /** grid-rows-6 */
  '6': 'grid-rows-6',
} as const;

/**
 * Align self utilities.
 */
export const self = {
  /** Auto */
  auto: 'self-auto',
  /** Start */
  start: 'self-start',
  /** End */
  end: 'self-end',
  /** Center */
  center: 'self-center',
  /** Stretch */
  stretch: 'self-stretch',
  /** Baseline */
  baseline: 'self-baseline',
} as const;

// =============================================================================
// OVERFLOW
// =============================================================================

/**
 * Overflow utilities.
 */
export const overflow = {
  /** Auto */
  auto: 'overflow-auto',
  /** Hidden */
  hidden: 'overflow-hidden',
  /** Clip */
  clip: 'overflow-clip',
  /** Visible */
  visible: 'overflow-visible',
  /** Scroll */
  scroll: 'overflow-scroll',
  /** X-axis auto */
  xAuto: 'overflow-x-auto',
  /** X-axis hidden */
  xHidden: 'overflow-x-hidden',
  /** X-axis clip */
  xClip: 'overflow-x-clip',
  /** X-axis visible */
  xVisible: 'overflow-x-visible',
  /** X-axis scroll */
  xScroll: 'overflow-x-scroll',
  /** Y-axis auto */
  yAuto: 'overflow-y-auto',
  /** Y-axis hidden */
  yHidden: 'overflow-y-hidden',
  /** Y-axis clip */
  yClip: 'overflow-y-clip',
  /** Y-axis visible */
  yVisible: 'overflow-y-visible',
  /** Y-axis scroll */
  yScroll: 'overflow-y-scroll',
} as const;

// =============================================================================
// POSITION
// =============================================================================

/**
 * Position utilities.
 */
export const position = {
  /** Static (default) */
  static: 'static',
  /** Fixed */
  fixed: 'fixed',
  /** Absolute */
  absolute: 'absolute',
  /** Relative */
  relative: 'relative',
  /** Sticky */
  sticky: 'sticky',
} as const;

/**
 * Inset utilities (top/right/bottom/left).
 */
export const inset = {
  /** All sides 0 */
  '0': 'inset-0',
  /** All sides auto */
  auto: 'inset-auto',
  /** X-axis 0 */
  x0: 'inset-x-0',
  /** Y-axis 0 */
  y0: 'inset-y-0',
  /** Top 0 */
  top0: 'top-0',
  /** Right 0 */
  right0: 'right-0',
  /** Bottom 0 */
  bottom0: 'bottom-0',
  /** Left 0 */
  left0: 'left-0',
  /** Full coverage */
  full: 'inset-0',
  /** Top -1 (negative positioning) */
  topNeg1: '-top-1',
  /** Right -1 (negative positioning) */
  rightNeg1: '-right-1',
  /** Bottom -1 (negative positioning) */
  bottomNeg1: '-bottom-1',
  /** Left -1 (negative positioning) */
  leftNeg1: '-left-1',
  /** Negative inset 0.5 (for glow effects) */
  neg05: '-inset-0.5',
} as const;

// =============================================================================
// DISPLAY
// =============================================================================

/**
 * Display utilities.
 */
export const display = {
  /** Block */
  block: 'block',
  /** Inline block */
  inlineBlock: 'inline-block',
  /** Inline */
  inline: 'inline',
  /** Flex */
  flex: 'flex',
  /** Inline flex */
  inlineFlex: 'inline-flex',
  /** Grid */
  grid: 'grid',
  /** Inline grid */
  inlineGrid: 'inline-grid',
  /** None */
  none: 'hidden',
} as const;

// =============================================================================
// ASPECT RATIO
// =============================================================================

/**
 * Aspect ratio utilities.
 * 
 * @migration Replaces inline `aspect-*` Tailwind classes
 * @example
 * // ❌ OLD: className="aspect-square"
 * // ✅ NEW: className={aspectRatio.square}
 */
export const aspectRatio = {
  /** aspect-square - 1:1 ratio */
  square: 'aspect-square',
  /** aspect-video - 16:9 ratio */
  video: 'aspect-video',
  /** aspect-auto - Auto ratio */
  auto: 'aspect-auto',
} as const;

// =============================================================================
// OBJECT FIT
// =============================================================================

/**
 * Object fit utilities.
 */
export const objectFit = {
  /** Contain */
  contain: 'object-contain',
  /** Cover */
  cover: 'object-cover',
  /** Fill */
  fill: 'object-fill',
  /** None */
  none: 'object-none',
  /** Scale down */
  scaleDown: 'object-scale-down',
} as const;

/**
 * Object position utilities.
 */
export const objectPosition = {
  /** Bottom */
  bottom: 'object-bottom',
  /** Center */
  center: 'object-center',
  /** Left */
  left: 'object-left',
  /** Left bottom */
  leftBottom: 'object-left-bottom',
  /** Left top */
  leftTop: 'object-left-top',
  /** Right */
  right: 'object-right',
  /** Right bottom */
  rightBottom: 'object-right-bottom',
  /** Right top */
  rightTop: 'object-right-top',
  /** Top */
  top: 'object-top',
} as const;

// =============================================================================
// POINTER EVENTS & USER SELECT
// =============================================================================

/**
 * Pointer events utilities.
 */
export const pointerEvents = {
  /** None */
  none: 'pointer-events-none',
  /** Auto */
  auto: 'pointer-events-auto',
} as const;

/**
 * User select utilities.
 */
export const userSelect = {
  /** None */
  none: 'select-none',
  /** Text */
  text: 'select-text',
  /** All */
  all: 'select-all',
  /** Auto */
  auto: 'select-auto',
} as const;

/**
 * CSS Transform utilities.
 * 
 * @migration Replaces inline `transform` Tailwind classes
 * @example
 * // ❌ OLD: className="transform"
 * // ✅ NEW: className={cssTransform.enable}
 */
export const cssTransform = {
  /** Enable CSS transforms */
  enable: 'transform',
  /** Disable CSS transforms */
  none: 'transform-none',
} as const;

/**
 * Transform translate utilities for common centering patterns.
 * 
 * @migration Replaces inline `-translate-x-1/2`, `-translate-y-1/2` Tailwind classes
 * @example
 * // ❌ OLD: className="-translate-x-1/2"
 * // ✅ NEW: className={translate.centerX}
 */
export const translate = {
  /** -translate-x-1/2 - Center horizontally */
  centerX: '-translate-x-1/2',
  /** -translate-y-1/2 - Center vertically */
  centerY: '-translate-y-1/2',
  /** -translate-x-1/2 -translate-y-1/2 - Center both axes */
  center: '-translate-x-1/2 -translate-y-1/2',
} as const;

/**
 * Transform scale utilities for hover/active states.
 * 
 * @migration Replaces inline `scale-[1.02]`, `scale-[0.98]` Tailwind classes
 * @example
 * // ❌ OLD: className="hover:scale-[1.02] active:scale-[0.98]"
 * // ✅ NEW: className={scale.hover102Active98}
 */
export const scale = {
  /** hover:scale-[1.02] - Slight scale on hover */
  hover102: 'hover:scale-[1.02]',
  /** active:scale-[0.98] - Slight shrink on active */
  active98: 'active:scale-[0.98]',
  /** hover:scale-[1.02] active:scale-[0.98] - Combined hover and active */
  hover102Active98: 'hover:scale-[1.02] active:scale-[0.98]',
} as const;

/**
 * Will-change utilities for performance optimization.
 * 
 * @migration Replaces inline `will-change-*` Tailwind classes
 * @example
 * // ❌ OLD: className="will-change-transform"
 * // ✅ NEW: className={willChange.transform}
 */
export const willChange = {
  /** Optimize for transform animations */
  transform: 'will-change-transform',
  /** Optimize for auto (browser decides) */
  auto: 'will-change-auto',
  /** Optimize for scroll position */
  scroll: 'will-change-scroll',
  /** Optimize for contents */
  contents: 'will-change-contents',
  /** Optimize for opacity */
  opacity: 'will-change-opacity',
} as const;

/**
 * CSS Containment utilities.
 * 
 * @migration Replaces inline `contain-*` Tailwind classes
 * @example
 * // ❌ OLD: className="contain-layout"
 * // ✅ NEW: className={containment.layout}
 */
export const containment = {
  /** contain-layout - Layout containment */
  layout: 'contain-layout',
  /** contain-paint - Paint containment */
  paint: 'contain-paint',
  /** contain-content - Content containment */
  content: 'contain-content',
  /** contain-strict - Strict containment */
  strict: 'contain-strict',
  /** contain-none - No containment */
  none: 'contain-none',
} as const;

/**
 * Transform origin utilities.
 * 
 * @migration Replaces inline `origin-*` Tailwind classes
 * @example
 * // ❌ OLD: className="origin-left"
 * // ✅ NEW: className={transformOrigin.left}
 */
export const transformOrigin = {
  /** Origin center */
  center: 'origin-center',
  /** Origin top */
  top: 'origin-top',
  /** Origin top right */
  topRight: 'origin-top-right',
  /** Origin right */
  right: 'origin-right',
  /** Origin bottom right */
  bottomRight: 'origin-bottom-right',
  /** Origin bottom */
  bottom: 'origin-bottom',
  /** Origin bottom left */
  bottomLeft: 'origin-bottom-left',
  /** Origin left */
  left: 'origin-left',
  /** Origin top left */
  topLeft: 'origin-top-left',
} as const;

/**
 * Resize utilities.
 * 
 * @migration Replaces inline `resize-*` Tailwind classes
 * @example
 * // ❌ OLD: className="resize-y"
 * // ✅ NEW: className={resize.y}
 */
export const resize = {
  /** Resize none */
  none: 'resize-none',
  /** Resize vertical */
  y: 'resize-y',
  /** Resize horizontal */
  x: 'resize-x',
  /** Resize both */
  both: 'resize',
} as const;

/**
 * Responsive display utilities.
 */
export const displayResponsive = {
  /** sm:flex - Flex at sm breakpoint */
  smFlex: 'sm:flex',
  /** lg:block - Block at lg breakpoint */
  lgBlock: 'lg:block',
  /** max-md:hidden - Hidden at max-md breakpoint */
  maxMdNone: 'max-md:hidden',
} as const;

/**
 * Responsive flex direction utilities.
 */
export const flexDirResponsive = {
  /** sm:flex-row - Row at sm breakpoint */
  smRow: 'sm:flex-row',
} as const;

/**
 * Responsive justify utilities.
 */
export const justifyResponsive = {
  /** sm:justify-end - End at sm breakpoint */
  smEnd: 'sm:justify-end',
  /** max-md:justify-center - Center at max-md breakpoint */
  maxMdCenter: 'max-md:justify-center',
} as const;

/**
 * Responsive spaceX utilities.
 */
export const spaceXResponsive = {
  /** sm:space-x-2 - Compact spacing at sm breakpoint */
  smCompact: 'sm:space-x-2',
} as const;
