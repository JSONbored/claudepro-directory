/**
 * Interactive Utilities
 * Semantic interactive patterns using Tailwind classes
 * 
 * Provides semantic names for interactive states:
 * - hoverBg: Hover background colors
 * - hoverText: Hover text colors
 * - focusRing: Focus ring styles
 * - transition: Transition utilities
 * - interactive: Interactive element base
 * - link: Link styling
 */

export const hoverBg = {
  subtle: 'hover:bg-accent/5',
  default: 'hover:bg-accent/10',
  accent15: 'hover:bg-accent/15',
  strong: 'hover:bg-accent/20',
  accent50: 'hover:bg-accent/50',
  accent90: 'hover:bg-accent/90',
  muted30: 'hover:bg-muted/30',
  muted: 'hover:bg-muted/50',
  // Solid color hovers
  primary: 'hover:bg-primary',
  primary90: 'hover:bg-primary/90',
  destructive: 'hover:bg-destructive',
  destructive10: 'hover:bg-destructive/10',
  secondary: 'hover:bg-secondary',
  // Accent solid
  accentSolid: 'hover:bg-accent',
} as const;

export const hoverText = {
  default: 'hover:text-foreground',
  muted: 'hover:text-muted-foreground',
  primary: 'hover:text-primary',
} as const;

export const focusRing = {
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  none: 'focus-visible:outline-none',
} as const;

export const transition = {
  fast: 'transition-all duration-150 ease-out',
  default: 'transition-all duration-200 ease-out',
  colors: 'transition-colors',
} as const;

export const interactive = 'cursor-pointer select-none';

export const link = 'text-primary underline-offset-4 hover:underline';
