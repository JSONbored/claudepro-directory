/**
 * Border Utilities
 * Semantic border patterns using Tailwind classes
 * 
 * Provides semantic names for borders and radius:
 * - border: Border styles
 * - radius: Border radius
 */

export const border = {
  default: 'border border-border',
  none: 'border-0',
  thick: 'border-2 border-border',
} as const;

export const radius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;
