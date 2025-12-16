/**
 * Dimension Utilities
 * Semantic dimension patterns using Tailwind classes
 * 
 * Provides semantic names for height, width, and max-width utilities:
 * - height: Element heights
 * - width: Element widths
 * - maxWidth: Maximum content widths
 */

export const height = {
  xs: 'h-4',        // 1rem = 16px
  sm: 'h-5',        // 1.25rem = 20px
  md: 'h-6',        // 1.5rem = 24px
  base: 'h-7',      // 1.75rem = 28px
  lg: 'h-8',        // 2rem = 32px
  xl: 'h-9',        // 2.25rem = 36px
  '2xl': 'h-12',    // 3rem = 48px
  '3xl': 'h-14',    // 3.5rem = 56px
  '4xl': 'h-16',    // 4rem = 64px
} as const satisfies Record<string, string>;

export const width = {
  auto: 'w-auto',
  full: 'w-full',
  fit: 'w-fit',
  '32': 'w-32',     // 8rem = 128px
  'min-fit': 'min-w-fit',
} as const satisfies Record<string, string>;

export const maxWidth = {
  xs: 'max-w-xs',           // 20rem = 320px
  sm: 'max-w-sm',           // 24rem = 384px
  md: 'max-w-md',           // 28rem = 448px
  lg: 'max-w-lg',           // 32rem = 512px
  xl: 'max-w-xl',           // 36rem = 576px
  '2xl': 'max-w-2xl',       // 42rem = 672px
  '3xl': 'max-w-3xl',       // 48rem = 768px
  '4xl': 'max-w-4xl',       // 56rem = 896px
  '5xl': 'max-w-5xl',       // 64rem = 1024px
  '6xl': 'max-w-6xl',       // 72rem = 1152px
  '7xl': 'max-w-7xl',       // 80rem = 1280px
  // Custom content widths (for hero sections, content areas)
  content400: 'max-w-[400px]',   // 400px (hero heading line 2)
  content600: 'max-w-[600px]',   // 600px (hero heading line 1)
  content700: 'max-w-[700px]',   // 700px (hero description, search bar)
} as const satisfies Record<string, string>;
