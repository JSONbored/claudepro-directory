'use client';

/**
 * Border Beam Component
 *
 * Animated border effect that travels around an element's perimeter.
 * Perfect for highlighting featured or premium content.
 *
 * @module components/ui/magic/border-beam
 */

import { cn } from '@/src/lib/utils';

interface BorderBeamProps {
  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Border beam width (in px)
   * @default 200
   */
  size?: number;

  /**
   * Animation duration (in seconds)
   * @default 15
   */
  duration?: number;

  /**
   * Border beam color offset (hue rotation)
   * @default 0
   */
  colorOffset?: number;

  /**
   * Animation delay (in seconds)
   * @default 0
   */
  delay?: number;
}

/**
 * BorderBeam Component
 *
 * Creates an animated border beam that travels around the element.
 * Uses conic gradient and rotation for smooth animation.
 *
 * @example
 * ```tsx
 * <div className="relative rounded-lg border">
 *   <BorderBeam />
 *   <div className="p-6">Your content</div>
 * </div>
 * ```
 */
export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  colorOffset = 0,
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        'motion-reduce:hidden', // Hide for reduced motion preference
        className
      )}
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--delay': `-${delay}s`,
          '--color-offset': `${colorOffset}deg`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          'absolute inset-0 rounded-[inherit]',
          'animate-border-beam',
          '[background:conic-gradient(from_calc(270deg+var(--color-offset,0deg)),transparent_0%,hsl(var(--accent))_50%,transparent_100%)]',
          '[mask:radial-gradient(var(--size)_circle_at_var(--x)_var(--y),black_99%,transparent_100%)]'
        )}
        style={{
          animationDuration: 'var(--duration)',
          animationDelay: 'var(--delay)',
        }}
      />
    </div>
  );
}
