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
  '2xs': 'text-[10px]', // 0.625rem = 10px (common pattern: 46 uses)
  '3xs': 'text-[11px]', // 0.6875rem = 11px (common pattern: multiple uses)
  xs: 'text-xs', // 0.75rem = 12px
  sm: 'text-sm', // 0.875rem = 14px
  base: 'text-base', // 1rem = 16px
  'sm-md': 'text-[13px]', // 0.8125rem = 13px (common pattern: multiple uses)
  lg: 'text-lg', // 1.125rem = 18px
  xl: 'text-xl', // 1.25rem = 20px
  '2xl': 'text-2xl', // 1.5rem = 24px
  '3xl': 'text-3xl', // 1.875rem = 30px
  '4xl': 'text-4xl', // 2.25rem = 36px
  '5xl': 'text-5xl', // 3rem = 48px (hero headings)
} as const satisfies Record<string, string>;

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
