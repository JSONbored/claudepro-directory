/**
 * Animation CSS Class Utilities
 * Semantic animation class patterns using Tailwind/CSS classes
 * 
 * Maps existing CSS animation classes from globals.css to semantic utilities.
 * These are CSS class names (not Motion.dev configs) for use in className.
 * 
 * @example
 * ```tsx
 * import { animations } from '@heyclaude/web-runtime/design-system';
 * 
 * <div className={animations.fadeIn}>Content</div>
 * <div className={cn(animations.pulse, animations.duration.long, animations.delay.short)}>Pulsing</div>
 * ```
 */

export const animations = {
  /**
   * Fade in animation
   * Uses: animation: fadeIn var(--duration-quick) var(--ease-out) both;
   */
  fadeIn: 'animate-fade-in',
  
  /**
   * Slide up animation
   * Uses: animation: slideUp var(--duration-default) var(--ease-out) both;
   */
  slideUp: 'animate-slide-up',
  
  /**
   * Scale in animation
   * Uses: animation: scale-in var(--duration-quick) var(--ease-out) both;
   */
  scaleIn: 'animate-scale-in',
  
  /**
   * Pulse animation (accent color)
   * Uses: animation: pulse-accent var(--duration-very-long) var(--ease-in-out) infinite;
   */
  pulse: 'animate-pulse',
  
  /**
   * Ping animation (Tailwind built-in)
   * Uses: animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
   */
  ping: 'animate-ping',
  
  /**
   * Shimmer animation
   * Uses: animation: shimmer var(--duration-maximum) linear infinite;
   */
  shimmer: 'animate-shimmer',
  
  /**
   * Grid move animation
   * Uses: animation: gridMove var(--duration-morphing) linear infinite;
   */
  gridMove: 'animate-gridMove',
  
  /**
   * Border beam animation
   * Uses: animation: border-beam linear infinite;
   */
  borderBeam: 'animate-border-beam',
  
  /**
   * Animation Duration Utilities
   * Uses Tailwind arbitrary values for animation-duration CSS property
   * 
   * @example
   * ```tsx
   * <div className={cn(animations.ping, animations.duration.long)}>Pulsing</div>
   * ```
   */
  duration: {
    /**
     * 3 seconds - For decorative particle animations
     */
    '3s': '[animation-duration:3s]',
    /**
     * 4 seconds - For decorative particle animations
     */
    '4s': '[animation-duration:4s]',
    /**
     * 5 seconds - For decorative particle animations
     */
    '5s': '[animation-duration:5s]',
  } as const,
  
  /**
   * Animation Delay Utilities
   * Uses Tailwind arbitrary values for animation-delay CSS property
   * 
   * @example
   * ```tsx
   * <div className={cn(animations.ping, animations.delay.zero)}>Pulsing</div>
   * ```
   */
  delay: {
    /**
     * 0 seconds - No delay
     */
    zero: '[animation-delay:0s]',
    /**
     * 1 second delay - For staggered decorative animations
     */
    '1s': '[animation-delay:1s]',
    /**
     * 2 seconds delay - For staggered decorative animations
     */
    '2s': '[animation-delay:2s]',
  } as const,
} as const;
