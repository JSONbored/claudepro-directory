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
import { useScrollReveal } from '@/src/hooks/use-scroll-animation';

export interface ScrollRevealProps {
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

  /**
   * Start reveal when element is this far in viewport (0-1)
   * @default 0.8
   */
  threshold?: number;

  /**
   * Animation type
   * @default 'fade'
   */
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'rotate';

  /**
   * Distance for slide animations (pixels)
   * @default 50
   */
  distance?: number;
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
  threshold,
  animation,
  distance,
}: ScrollRevealProps) {
  const { ref, style } = useScrollReveal({ 
    ...(threshold !== undefined && { threshold }),
    ...(animation !== undefined && { animation }),
    ...(distance !== undefined && { distance }),
  });

  const Component = motion[as] as typeof motion.div;

  return (
    <Component ref={ref} style={style} className={className}>
      {children}
    </Component>
  );
}

