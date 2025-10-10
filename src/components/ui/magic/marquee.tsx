/**
 * Marquee Component
 * Infinite scroll animation
 *
 * Performance optimizations:
 * - Pure CSS animations (no JavaScript runtime cost)
 * - GPU acceleration with transform
 * - Duplicated content for seamless loop
 * - Pause on hover for accessibility
 *
 * @module components/ui/magic/marquee
 */

'use client';

import { type HTMLAttributes, type ReactNode, useId, useMemo } from 'react';
import { cn } from '@/src/lib/utils';

interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Content to scroll
   */
  children: ReactNode;

  /**
   * Animation speed (1 = normal, 2 = 2x faster, 0.5 = half speed)
   * @default 1
   */
  speed?: number;

  /**
   * Direction of scroll
   * @default 'left'
   */
  direction?: 'left' | 'right' | 'up' | 'down';

  /**
   * Pause animation on hover
   * @default true
   */
  pauseOnHover?: boolean;

  /**
   * Enable vertical mode
   * @default false
   */
  vertical?: boolean;

  /**
   * Number of times to repeat content
   * @default 2
   */
  repeat?: number;
}

export function Marquee({
  className,
  children,
  speed = 1,
  direction = 'left',
  pauseOnHover = true,
  vertical = false,
  repeat = 2,
  ...props
}: MarqueeProps) {
  const baseId = useId();

  // Calculate animation duration (slower for vertical)
  const baseDuration = vertical ? 30 : 20;
  const duration = baseDuration / speed;

  // Determine animation direction
  const animationDirection = {
    left: 'marqueeLeft',
    right: 'marqueeRight',
    up: 'marqueeUp',
    down: 'marqueeDown',
  }[direction];

  // Generate stable unique keys using useId - only regenerate when repeat count changes
  const repeatKeys = useMemo(
    () => Array.from({ length: repeat }, (_, i) => `${baseId}-repeat-${i}`),
    [baseId, repeat]
  );

  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        vertical ? 'flex flex-col' : 'flex',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex gap-4',
          vertical ? 'flex-col' : 'flex-row',
          'will-change-transform',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          animation: `${animationDirection} ${duration}s linear infinite`,
        }}
      >
        {/* Repeat content for seamless loop */}
        {repeatKeys.map((key) => (
          <div key={key} className={cn('flex shrink-0 gap-4', vertical ? 'flex-col' : 'flex-row')}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

Marquee.displayName = 'Marquee';
