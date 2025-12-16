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

/**
 * Transition Utilities
 * Semantic transition patterns using Tailwind classes
 * 
 * Maps DURATION values to Tailwind transition classes.
 * Uses CSS variables from globals.css for consistency.
 * 
 * @example
 * ```tsx
 * import { transition } from '@heyclaude/web-runtime/design-system';
 * 
 * <div className={transition.default}>Smooth transition</div>
 * <div className={transition.colors}>Color transition only</div>
 * ```
 */
export const transition = {
  /**
   * Micro transition - 100ms (0.1s)
   * Best for: Very quick state changes
   */
  micro: 'transition-all duration-[var(--duration-micro)] ease-out',
  
  /**
   * Fast transition - 150ms (0.15s)
   * Best for: Quick feedback, icon state changes
   */
  fast: 'transition-all duration-[var(--duration-fast)] ease-out',
  
  /**
   * Quick transition - 200ms (0.2s)
   * Best for: Form field transitions, button feedback
   */
  quick: 'transition-all duration-[var(--duration-quick)] ease-out',
  
  /**
   * Comfortable transition - 250ms (0.25s)
   * Best for: Modal transitions, card animations
   */
  comfortable: 'transition-all duration-[var(--duration-comfortable)] ease-out',
  
  /**
   * Default transition - 300ms (0.3s)
   * Best for: Button interactions, card hovers (most common)
   */
  default: 'transition-all duration-[var(--duration-default)] ease-out',
  
  /**
   * Balanced transition - 350ms (0.35s)
   * Best for: Card transitions, view transitions
   */
  balanced: 'transition-all duration-[var(--duration-balanced)] ease-out',
  
  /**
   * Slow transition - 400ms (0.4s)
   * Best for: Page transitions, modal entrances
   */
  slow: 'transition-all duration-[var(--duration-slow)] ease-out',
  
  /**
   * Moderate transition - 500ms (0.5s)
   * Best for: Auth panels, form submissions
   */
  moderate: 'transition-all duration-[var(--duration-moderate)] ease-out',
  
  /**
   * Extended transition - 600ms (0.6s)
   * Best for: Brand panels, hero sections
   */
  extended: 'transition-all duration-[var(--duration-extended)] ease-out',
  
  /**
   * Relaxed transition - 700ms (0.7s)
   * Best for: View transitions, circle blur effects
   */
  relaxed: 'transition-all duration-[var(--duration-relaxed)] ease-out',
  
  /**
   * Long transition - 800ms (0.8s)
   * Best for: Loading spinners, rotation animations
   */
  long: 'transition-all duration-[var(--duration-long)] ease-out',
  
  /**
   * Very long transition - 1000ms (1.0s)
   * Best for: Complex animations, rotation loops
   */
  veryLong: 'transition-all duration-[var(--duration-very-long)] ease-out',
  
  /**
   * Color-only transition (no duration specified, uses default)
   * Best for: Color changes only
   */
  colors: 'transition-colors',
  
  /**
   * Transform-only transition
   * Best for: Transform animations only
   */
  transform: 'transition-transform',
  
  /**
   * Opacity-only transition
   * Best for: Fade in/out animations
   */
  opacity: 'transition-opacity',
  
  /**
   * All properties with custom easing
   * Best for: Smooth, natural animations
   */
  smooth: 'transition-all duration-[var(--duration-default)] ease-in-out',
} as const;

export const interactive = 'cursor-pointer select-none';

export const link = 'text-primary underline-offset-4 hover:underline';
