/**
 * Grid Pattern Component
 * Animated SVG grid background
 *
 * Performance optimizations:
 * - Server-side component (SVG is static)
 * - CSS animations for movement
 * - GPU-accelerated with transform
 * - Minimal DOM nodes (single SVG element)
 *
 * @module components/ui/magic/grid-pattern
 */

'use client';

import { type HTMLAttributes, useId } from 'react';
import { cn } from '@/src/lib/utils';

interface GridPatternProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Grid cell width
   * @default 40
   */
  width?: number;

  /**
   * Grid cell height
   * @default 40
   */
  height?: number;

  /**
   * Position X offset
   * @default 0
   */
  x?: number;

  /**
   * Position Y offset
   * @default 0
   */
  y?: number;

  /**
   * Stroke color
   * @default 'currentColor'
   */
  strokeColor?: string;

  /**
   * Stroke opacity
   * @default 0.2
   */
  strokeOpacity?: number;

  /**
   * Stroke width
   * @default 1
   */
  strokeWidth?: number;

  /**
   * Enable animation
   * @default false
   */
  animated?: boolean;
}

export function GridPattern({
  className,
  width = 40,
  height = 40,
  x = 0,
  y = 0,
  strokeColor = 'currentColor',
  strokeOpacity = 0.2,
  strokeWidth = 1,
  animated = false,
  ...props
}: GridPatternProps) {
  const patternId = useId();

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
      {...props}
    >
      <svg
        className={cn('h-full w-full', animated && 'animate-gridMove will-change-transform')}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={patternId}
            width={width}
            height={height}
            x={x}
            y={y}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

GridPattern.displayName = 'GridPattern';
