/**
 * Gradient CSS Class Utilities
 * Gradient class patterns
 * 
 * Maps existing CSS gradient classes from globals.css to semantic utilities.
 * These classes use CSS variables for gradient definitions.
 * 
 * @example
 * ```tsx
 * import { gradient } from '@heyclaude/web-runtime/design-system';
 * 
 * <div className={gradient.hero}>Hero section</div>
 * <div className={gradient.card}>Card</div>
 * ```
 */

export const gradient = {
  /**
   * Primary gradient
   * Uses CSS variable: --gradient-primary
   * Note: Currently no CSS class exists, but CSS variable is defined
   * This utility can be used when a class is created or for future use
   */
  primary: 'bg-[var(--gradient-primary)]',
  
  /**
   * Hero section gradient
   * Uses CSS class: .hero-gradient
   * Background: var(--gradient-hero)
   */
  hero: 'hero-gradient',
  
  /**
   * Card gradient
   * Uses CSS class: .card-gradient
   * Background: var(--card) with border and hover effects
   */
  card: 'card-gradient',
  
  /**
   * Border gradient
   * Uses CSS variable: --gradient-border
   * Note: Currently no CSS class exists, but CSS variable is defined
   */
  border: 'bg-[var(--gradient-border)]',
  
  /**
   * Hero background texture (radial gradients)
   * Subtle decorative background with radial gradients at specific positions
   * Uses Tailwind arbitrary values for complex multi-gradient background
   */
  heroTexture: 'bg-[radial-gradient(circle_at_20%_50%,var(--claude-orange)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,var(--claude-orange)_0%,transparent_50%)] bg-[length:100%_100%] bg-center',
} as const;
