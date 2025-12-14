/**
 * Icon Utilities
 * Semantic icon sizing patterns using Tailwind classes
 * 
 * Provides semantic names for icon dimensions:
 * - iconSize: Icon width/height
 * - iconLeading: Icon line-height (for alignment)
 */

export const iconSize = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-12 w-12',
  '3xl': 'h-16 w-16',
} as const;

/**
 * Rectangular icon sizes (non-square)
 * For icons, loading skeletons, and other rectangular elements
 */
export const iconSizeRect = {
  // Small rectangular icons
  '4x5': 'h-4 w-5',
  '5x4': 'h-5 w-4',
  '4x6': 'h-4 w-6',
  '6x4': 'h-6 w-4',
  '5x6': 'h-5 w-6',
  '6x5': 'h-6 w-5',
  // Loading skeleton patterns
  '4x12': 'h-4 w-12',
  '4x16': 'h-4 w-16',
  '4x20': 'h-4 w-20',
  '4x24': 'h-4 w-24',
  '4x48': 'h-4 w-48',
  '4x64': 'h-4 w-64',
  '5x24': 'h-5 w-24',
  '6x32': 'h-6 w-32',
  '8x24': 'h-8 w-24',
  '8x28': 'h-8 w-28',
  '8x32': 'h-8 w-32',
  '8x48': 'h-8 w-48',
  '8x64': 'h-8 w-64',
  '32x48': 'h-32 w-48',
  '64x72': 'h-64 w-72',
  // Fractional widths (for loading skeletons)
  '2x32': 'h-2 w-32',
  '3x2-3': 'h-3 w-2/3', // h-3 w-2/3
  '4x3-4': 'h-4 w-3/4', // h-4 w-3/4
  '8x3-4': 'h-8 w-3/4', // h-8 w-3/4
} as const;

export const iconLeading = {
  tight: 'leading-none',
  normal: 'leading-normal',
} as const;
