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
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        className
      )}
    >
      {/* Top border beam */}
      <motion.div
        className="absolute h-[2px]"
        style={{
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${borderWidth}px`,
          background: `linear-gradient(to right, ${colorFrom}, ${colorTo}, transparent)`,
        }}
        initial={{ x: 0 }}
        animate={{ x: '100vw' }}
        transition={{
          duration,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {/* Right border beam */}
      <motion.div
        className="absolute w-[2px]"
        style={{
          top: 0,
          right: 0,
          width: `${borderWidth}px`,
          height: `${size}px`,
          background: `linear-gradient(to bottom, ${colorFrom}, ${colorTo}, transparent)`,
        }}
        initial={{ y: 0 }}
        animate={{ y: '100vh' }}
        transition={{
          duration,
          delay: delay + duration / 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {/* Bottom border beam */}
      <motion.div
        className="absolute h-[2px]"
        style={{
          bottom: 0,
          right: 0,
          width: `${size}px`,
          height: `${borderWidth}px`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
        }}
        initial={{ x: 0 }}
        animate={{ x: '-100vw' }}
        transition={{
          duration,
          delay: delay + duration / 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {/* Left border beam */}
      <motion.div
        className="absolute w-[2px]"
        style={{
          bottom: 0,
          left: 0,
          width: `${borderWidth}px`,
          height: `${size}px`,
          background: `linear-gradient(to top, ${colorFrom}, ${colorTo}, transparent)`,
        }}
        initial={{ y: 0 }}
        animate={{ y: '-100vh' }}
        transition={{
          duration,
          delay: delay + (duration * 3) / 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />
    </div>
  );
}
