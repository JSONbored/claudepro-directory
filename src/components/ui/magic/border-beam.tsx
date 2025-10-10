'use client';

/**
 * Border Beam Component
 * Animated border with traveling light effect
 *
 * Performance optimizations:
 * - Pure CSS animations for border effect
 * - GPU acceleration with transform
 * - Uses conic-gradient for circular motion
 * - Minimal JavaScript (only for setup)
 *
 * @module components/ui/magic/border-beam
 */

import { type HTMLAttributes, memo } from 'react';
import { cn } from '@/src/lib/utils';

interface BorderBeamProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Animation duration in seconds
   * @default 4
   */
  duration?: number;

  /**
   * Delay before animation starts in seconds
   * @default 0
   */
  delay?: number;

  /**
   * Border beam size (width of the beam)
   * @default 200
   */
  size?: number;

  /**
   * Border beam color
   * @default 'var(--color-accent)'
   */
  color?: string;
}

function BorderBeamComponent({
  className,
  children,
  duration = 4,
  delay = 0,
  size = 200,
  color = 'var(--color-accent)',
  ...props
}: BorderBeamProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)} {...props}>
      {/* Border beam effect */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          maskImage: 'linear-gradient(white, transparent), linear-gradient(white, transparent)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          maskSize: `${size}px ${size}px`,
        }}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${color} 10%, transparent 30%)`,
            animation: `borderBeamSpin ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}

export const BorderBeam = memo(BorderBeamComponent);
BorderBeam.displayName = 'BorderBeam';
