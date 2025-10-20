'use client';

/**
 * ScrollReveal Component - Declarative Scroll Animations
 * 
 * Drop-in wrapper for scroll-triggered animations.
 * Uses useScrollReveal hook internally.
 * 
 * Usage:
 * ```tsx
 * <ScrollReveal animation="slide-up">
 *   <YourContent />
 * </ScrollReveal>
 * ```
 * 
 * @module components/shared/scroll-reveal
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useScrollReveal, type ScrollRevealConfig } from '@/src/hooks/use-scroll-animation';

export interface ScrollRevealProps extends ScrollRevealConfig {
  /**
   * Content to animate
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * HTML element type
   * @default 'div'
   */
  as?: keyof Pick<typeof motion, 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer'>;
}

/**
 * ScrollReveal component
 * Wraps content with scroll-triggered animation
 * 
 * @example
 * ```tsx
 * // Fade in
 * <ScrollReveal animation="fade">
 *   <Card />
 * </ScrollReveal>
 * 
 * // Slide up
 * <ScrollReveal animation="slide-up" distance={100}>
 *   <Hero />
 * </ScrollReveal>
 * 
 * // Scale up
 * <ScrollReveal animation="scale" threshold={0.5}>
 *   <Image />
 * </ScrollReveal>
 * ```
 */
export function ScrollReveal({
  children,
  className,
  as = 'div',
  ...config
}: ScrollRevealProps) {
  const { ref, style } = useScrollReveal(config);

  const Component = motion[as] as typeof motion.div;

  return (
    <Component ref={ref} style={style} className={className}>
      {children}
    </Component>
  );
}

/**
 * Preset variants for common use cases
 */
export const ScrollRevealPresets = {
  /**
   * Fade in gently
   */
  FadeIn: ({ children, className }: { children: ReactNode; className?: string }) => (
    <ScrollReveal animation="fade" threshold={0.8} className={className}>
      {children}
    </ScrollReveal>
  ),

  /**
   * Slide up from bottom
   */
  SlideUp: ({ children, className }: { children: ReactNode; className?: string }) => (
    <ScrollReveal animation="slide-up" distance={50} threshold={0.8} className={className}>
      {children}
    </ScrollReveal>
  ),

  /**
   * Scale up from small
   */
  ScaleUp: ({ children, className }: { children: ReactNode; className?: string }) => (
    <ScrollReveal animation="scale" threshold={0.8} className={className}>
      {children}
    </ScrollReveal>
  ),

  /**
   * Dramatic entrance (large slide)
   */
  Dramatic: ({ children, className }: { children: ReactNode; className?: string }) => (
    <ScrollReveal animation="slide-up" distance={100} threshold={0.9} className={className}>
      {children}
    </ScrollReveal>
  ),

  /**
   * Subtle (small movement)
   */
  Subtle: ({ children, className }: { children: ReactNode; className?: string }) => (
    <ScrollReveal animation="slide-up" distance={20} threshold={0.7} className={className}>
      {children}
    </ScrollReveal>
  ),
} as const;
