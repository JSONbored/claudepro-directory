'use client';

/**
 * Marquee Component
 *
 * Infinite scrolling marquee for displaying logos, testimonials, or featured items.
 * CSS-only animation with duplicate content for seamless looping.
 *
 * @module components/ui/magic/marquee
 */

import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

interface MarqueeProps {
  /**
   * Content to scroll
   */
  children: ReactNode;

  /**
   * Animation speed in seconds
   * @default 30
   */
  duration?: number;

  /**
   * Scroll direction
   * @default 'left'
   */
  direction?: 'left' | 'right';

  /**
   * Pause animation on hover
   * @default true
   */
  pauseOnHover?: boolean;

  /**
   * Reverse scroll direction
   * @default false
   */
  reverse?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Gap between items (in px)
   * @default 16
   */
  gap?: number;
}

/**
 * Marquee Component
 *
 * Creates an infinite scrolling effect with seamless looping.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <Marquee duration={40} pauseOnHover>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Marquee>
 * ```
 */
export function Marquee({
  children,
  duration = 30,
  direction = 'left',
  pauseOnHover = true,
  reverse = false,
  className,
  gap = 16,
}: MarqueeProps) {
  const animationDirection = reverse ? (direction === 'left' ? 'right' : 'left') : direction;

  return (
    <div
      className={cn(
        'group flex overflow-hidden [--gap:1rem]',
        pauseOnHover && 'hover:[animation-play-state:paused]',
        className
      )}
      style={
        {
          '--gap': `${gap}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-around gap-[--gap]',
          animationDirection === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
          'motion-reduce:animate-none'
        )}
        style={
          {
            animationDuration: `${duration}s`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
      {/* Duplicate for seamless loop */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-around gap-[--gap]',
          animationDirection === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
          'motion-reduce:animate-none'
        )}
        aria-hidden="true"
        style={
          {
            animationDuration: `${duration}s`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
