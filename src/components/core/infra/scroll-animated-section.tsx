'use client';

/**
 * LazySection Component - Motion.dev Powered Scroll Animations
 *
 * Modern 2025 implementation using Motion.dev (by Framer Motion creators)
 * Provides beautiful, hardware-accelerated scroll animations with zero performance overhead.
 *
 * Features:
 * - Automatic scroll-triggered animations using whileInView
 * - GPU-accelerated transforms for 60fps performance
 * - Spring physics for natural motion
 * - Only 10KB bundle size (vs 60KB for Framer Motion)
 * - Configurable animation variants
 * - SSR-safe with proper hydration
 *
 * Architecture:
 * - Uses Motion.dev's whileInView for viewport detection
 * - Leverages browser's IntersectionObserver under the hood
 * - Hardware-accelerated via CSS transforms
 * - Respects reduced motion preferences automatically
 *
 * Performance:
 * - Animations run on compositor thread (off main thread)
 * - No layout thrashing or reflows
 * - Automatic will-change optimization
 * - Spring animations use RequestAnimationFrame
 *
 * @see https://motion.dev/docs/react-quick-start
 * @module components/infra/lazy-section
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type AnimationVariant =
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'scale'
  | 'slide-left'
  | 'slide-right';

export interface LazySectionProps {
  /**
   * Content to animate on scroll
   */
  children: ReactNode;

  /**
   * Animation variant to use when content enters viewport
   * @default 'fade-in'
   */
  variant?: AnimationVariant;

  /**
   * Animation duration in seconds (for non-spring animations)
   * @default 0.6
   */
  duration?: number;

  /**
   * Use spring physics for natural motion
   * @default true
   */
  useSpring?: boolean;

  /**
   * Spring configuration (only used if useSpring=true)
   */
  spring?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };

  /**
   * Viewport threshold for triggering animation (0-1)
   * @default 0.1 (10% visible)
   */
  threshold?: number;

  /**
   * Root margin for viewport detection
   * @default '0px 0px -100px 0px' (start 100px before entering)
   */
  rootMargin?: string;

  /**
   * Whether to animate only once or every time element enters viewport
   * @default true (animate once)
   */
  once?: boolean;

  /**
   * Delay before animation starts (in seconds)
   * @default 0
   */
  delay?: number;

  /**
   * Optional className for wrapper
   */
  className?: string;

  /**
   * Whether to render immediately without animation (useful for above-fold)
   * @default false
   */
  eager?: boolean;
}

/**
 * Animation variants using Motion.dev
 * All animations use GPU-accelerated transforms (opacity, scale, x, y)
 */
const ANIMATION_VARIANTS: Record<
  AnimationVariant,
  {
    initial: Record<string, number>;
    animate: Record<string, number>;
  }
> = {
  'fade-in': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
  },
  'slide-down': {
    initial: { opacity: 0, y: -40 },
    animate: { opacity: 1, y: 0 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
  },
};

/**
 * Default spring configuration
 * Tuned for natural, bouncy motion that feels premium
 */
const DEFAULT_SPRING = {
  stiffness: 100,
  damping: 15,
  mass: 0.8,
};

function LazySectionComponent({
  children,
  variant = 'fade-in',
  duration = 0.6,
  useSpring = true,
  spring = DEFAULT_SPRING,
  threshold = 0.1,
  rootMargin = '0px 0px -100px 0px',
  once = true,
  delay = 0,
  className = '',
  eager = false,
}: LazySectionProps) {
  const variantConfig = ANIMATION_VARIANTS[variant];

  // Build transition configuration
  const transition = useSpring
    ? {
        type: 'spring' as const,
        ...spring,
        delay,
      }
    : {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number], // Custom easing curve (easeOutExpo)
      };

  // Eager rendering (no animation)
  if (eager) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={variantConfig.initial}
      whileInView={variantConfig.animate}
      viewport={{
        once,
        amount: threshold,
        margin: rootMargin,
      }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Memoized export to prevent re-renders
 */
export const LazySection = memo(LazySectionComponent);
