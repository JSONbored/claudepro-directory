/**
 * Border Beam Component
 * Animated beam of light that travels along the border of its container
 *
 * Inspired by Magic UI - simplified implementation without framer-motion
 * Uses pure CSS animations for performance
 */

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
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--delay': `${delay}s`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--border-width': `${borderWidth}px`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]',
        // Mask for beam effect
        '[mask-clip:padding-box,border-box] [mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        // Animated gradient that travels around the border
        'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]',
        // Position beam to start from top
        'after:[offset-anchor:90%_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]',
        className
      )}
    />
  );
}
