/**
 * Typography Utilities
 * Semantic typography patterns using Tailwind classes
 * 
 * Provides semantic names for text styling:
 * - muted: Muted text colors
 * - size: Text sizes
 * - weight: Font weights
 * - leading: Line heights
 * - tracking: Letter spacing
 * - truncate: Text truncation
 */

export const muted = {
  default: 'text-muted-foreground',
  sm: 'text-sm text-muted-foreground',
  xs: 'text-xs text-muted-foreground',
} as const;

export const size = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
} as const;

export const weight = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

export const leading = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
} as const;

export const tracking = {
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
} as const;

export const truncate = {
  single: 'truncate',
  lines2: 'line-clamp-2',
  lines3: 'line-clamp-3',
} as const;
