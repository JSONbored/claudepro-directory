/**
 * Layout Utilities
 * Semantic layout patterns using Tailwind classes
 * 
 * Provides semantic names for common layout patterns:
 * - stack: Vertical flex layouts (flex-col)
 * - cluster: Horizontal centered layouts (flex items-center)
 * - row: Horizontal flex layouts (flex-row)
 * - center: Centered content
 * - between: Space-between layouts
 * - wrap: Flex wrap
 * - responsive: Responsive flex layouts
 * - grid: Grid layouts
 * - container: Container with padding
 */

export const stack = {
  none: 'flex flex-col',
  tight: 'flex flex-col gap-1',
  compact: 'flex flex-col gap-2',
  default: 'flex flex-col gap-3',
  comfortable: 'flex flex-col gap-4',
  relaxed: 'flex flex-col gap-6',
  loose: 'flex flex-col gap-8',
} as const;

export const cluster = {
  none: 'flex items-center',
  tight: 'flex items-center gap-1',
  compact: 'flex items-center gap-2',
  default: 'flex items-center gap-3',
  comfortable: 'flex items-center gap-4',
} as const;

export const row = {
  none: 'flex flex-row',
  tight: 'flex flex-row gap-1',
  compact: 'flex flex-row gap-2',
  default: 'flex flex-row gap-3',
  comfortable: 'flex flex-row gap-4',
} as const;

export const center = 'flex items-center justify-center';

export const between = {
  center: 'flex items-center justify-between',
  start: 'flex items-start justify-between',
  end: 'flex items-end justify-between',
} as const;

export const wrap = 'flex flex-wrap';

export const responsive = {
  col: 'flex flex-col sm:flex-row',
  row: 'flex flex-row sm:flex-col',
  colCenter: 'flex flex-col items-start sm:flex-row sm:items-center',
  colBetween: 'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
} as const;

export const grid = {
  cols1: 'grid grid-cols-1 gap-4',
  cols2: 'grid grid-cols-2 gap-4',
  cols3: 'grid grid-cols-3 gap-4',
  responsive2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  responsive3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  responsive4: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
} as const;

export const container = 'container mx-auto px-4';

/**
 * Gap utilities for standalone gap patterns (not part of flex/grid compound patterns)
 * Used when gap appears independently (e.g., in grid layouts)
 */
export const gap = {
  micro: 'gap-1',
  tight: 'gap-2',
  compact: 'gap-3',
  default: 'gap-4',
  comfortable: 'gap-6',
  relaxed: 'gap-8',
} as const;
