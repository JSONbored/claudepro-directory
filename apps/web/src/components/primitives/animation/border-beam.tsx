/**
 * Border Beam Component
 * Animated beam of light that travels along the border of its container
 * Based on Magic UI / shadcn implementation
 */

'use client';

import { cn } from '@heyclaude/web-runtime';
import { motion } from 'motion/react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
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
      <motion.div
        className="absolute inset-0"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: `linear-gradient(to right, ${colorFrom}, ${colorTo}, transparent)`,
          borderRadius: '999px',
          filter: 'blur(20px)',
          opacity: 0.8,
        }}
        initial={{
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          x: ['-50%', '150%', '150%', '-50%', '-50%'],
          y: ['-50%', '-50%', '150%', '150%', '-50%'],
        }}
        transition={{
          duration,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      />
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          padding: `${borderWidth}px`,
          background: 'transparent',
        }}
      >
        <div className="h-full w-full rounded-[inherit] bg-background" />
      </div>
    </div>
  );
}
