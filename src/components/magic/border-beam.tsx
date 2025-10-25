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
  size = 200,
  duration = 8,
  delay = 0,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  borderWidth = 1.5,
}: BorderBeamProps) {
  // Create a single beam that travels around the entire perimeter
  // Using CSS offset-path for smooth, continuous animation
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 rounded-[inherit]', className)}
      style={{
        padding: `${borderWidth}px`,
      }}
    >
      <motion.div
        className="absolute"
        style={{
          width: `${size}px`,
          height: `${borderWidth}px`,
          background: `linear-gradient(to right, transparent, ${colorFrom}, ${colorTo}, ${colorFrom}, transparent)`,
          offsetPath: 'rect(0 100% 100% 0 round 0.5rem)',
          offsetRotate: '0deg',
        }}
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{
          duration,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />
    </div>
  );
}
