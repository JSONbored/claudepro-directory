'use client';

/**
 * Animated Gradient Text Component
 *
 * Creates text with an animated gradient effect that flows smoothly.
 * Perfect for hero headings and emphasis text.
 *
 * Features:
 * - Smooth gradient animation (5s loop)
 * - Orange to amber brand colors
 * - GPU-accelerated with CSS
 * - Respects prefers-reduced-motion
 * - Zero JavaScript overhead
 *
 * Usage:
 * ```tsx
 * <AnimatedGradientText>
 *   The Ultimate Directory
 * </AnimatedGradientText>
 * ```
 */

import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface AnimatedGradientTextProps {
  children: ReactNode;
  /** Custom className */
  className?: string;
  /** Animation duration in seconds (default: 5) */
  duration?: number;
  /** Gradient colors (default: orange → amber → orange) */
  colors?: string[];
  /** Disable animation */
  noAnimation?: boolean;
}

export function AnimatedGradientText({
  children,
  className,
  duration = 5,
  colors = ['#F97316', '#FBBF24', '#F97316'], // orange → amber → orange
  noAnimation = false,
}: AnimatedGradientTextProps) {
  const gradientStyle = {
    background: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  };

  if (noAnimation) {
    return (
      <span className={cn('inline-block', className)} style={gradientStyle}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      style={gradientStyle}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}

/**
 * Shimmering gradient text with additional glow effect
 */
export function ShimmeringGradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={cn('inline-block', className)}
      style={{
        background: 'linear-gradient(90deg, #F97316, #FBBF24, #F97316)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'linear',
      }}
    >
      <motion.span
        animate={{
          textShadow: [
            '0 0 20px rgba(251, 191, 36, 0.5)',
            '0 0 40px rgba(251, 191, 36, 0.8)',
            '0 0 20px rgba(251, 191, 36, 0.5)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

/**
 * CSS-only gradient text (no animation, better performance)
 */
export function StaticGradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-block', className)}
      style={{
        background: 'linear-gradient(135deg, #F97316, #FBBF24)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

/**
 * Preset configurations
 */
export const GradientTextPresets = {
  hero: {
    colors: ['#F97316', '#FBBF24', '#F97316'],
    duration: 5,
  },
  fast: {
    colors: ['#F97316', '#FB923C', '#FDBA74', '#FB923C', '#F97316'],
    duration: 3,
  },
  subtle: {
    colors: ['#F97316', '#FB923C', '#F97316'],
    duration: 8,
  },
} as const;
