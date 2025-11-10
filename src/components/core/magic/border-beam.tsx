/**
 * Border Beam Component
 * Animated beam of light that travels along the border of its container
 *
 * Rewritten with Motion.dev for universal browser compatibility
 * Previous CSS offset-path implementation had limited browser support
 */

'use client';

import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface BorderBeamProps {
  /**
   * CSS class name for additional styling
   */
  className?: string;
  /**
   * Size of the beam in pixels
   * @default 200
   */
  size?: number;
  /**
   * Animation duration in seconds
   * @default 8
   */
  duration?: number;
  /**
   * Delay before animation starts in seconds
   * @default 0
   */
  delay?: number;
  /**
   * Start color of the gradient (hex)
   * @default '#ffaa40'
   */
  colorFrom?: string;
  /**
   * End color of the gradient (hex)
   * @default '#9c40ff'
   */
  colorTo?: string;
  /**
   * Border width in pixels
   * @default 1.5
   */
  borderWidth?: number;
}

export function BorderBeam({
  className,
  duration = 8,
  delay = 0,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  borderWidth = 1.5,
}: Omit<BorderBeamProps, 'size'>) {
  // Animated gradient border that traces the full perimeter
  // Using Motion.dev for universal browser compatibility
  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        className
      )}
      style={{
        padding: borderWidth,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <motion.div
        className="h-full w-full"
        style={
          {
            background: `conic-gradient(from var(--angle), transparent 0%, ${colorFrom} 5%, ${colorTo} 10%, ${colorFrom} 15%, transparent 20%, transparent 100%)`,
            ['--angle' as string]: '0deg',
          } satisfies Record<string, string>
        }
        animate={
          {
            ['--angle' as string]: '360deg',
          } satisfies Record<string, string>
        }
        transition={{
          duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      >
        <div className="h-full w-full rounded-[inherit] bg-background" />
      </motion.div>
    </motion.div>
  );
}
