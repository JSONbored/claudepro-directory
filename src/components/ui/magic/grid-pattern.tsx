'use client';

/**
 * Animated Grid Pattern Component
 *
 * Subtle animated grid background pattern for hero sections.
 * Uses CSS Grid with opacity animations for modern aesthetic.
 *
 * @module components/ui/magic/grid-pattern
 */

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface GridPatternProps {
  /**
   * Grid cell width (in px)
   * @default 40
   */
  width?: number;

  /**
   * Grid cell height (in px)
   * @default 40
   */
  height?: number;

  /**
   * Pattern stroke width (in px)
   * @default 1
   */
  strokeWidth?: number;

  /**
   * Number of cells in X direction
   * @default 40
   */
  numSquaresX?: number;

  /**
   * Number of cells in Y direction
   * @default 40
   */
  numSquaresY?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Maximum opacity for animated cells
   * @default 0.5
   */
  maxOpacity?: number;

  /**
   * Animation duration (in seconds)
   * @default 4
   */
  duration?: number;
}

/**
 * AnimatedGridPattern Component
 *
 * Creates a grid background with randomly animated cells.
 * Performance optimized with CSS opacity animations.
 *
 * @example
 * ```tsx
 * <div className="relative h-screen">
 *   <AnimatedGridPattern />
 *   <div className="relative z-10">Your content</div>
 * </div>
 * ```
 */
export function AnimatedGridPattern({
  width = 40,
  height = 40,
  strokeWidth = 1,
  numSquaresX = 40,
  numSquaresY = 40,
  className,
  maxOpacity = 0.5,
  duration = 4,
}: GridPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate random squares to animate
  const [squares, setSquares] = useState<Array<[number, number]>>([]);

  useEffect(() => {
    // Generate random squares (10% of total)
    const totalSquares = numSquaresX * numSquaresY;
    const numAnimatedSquares = Math.floor(totalSquares * 0.1);

    const randomSquares: Array<[number, number]> = [];
    for (let i = 0; i < numAnimatedSquares; i++) {
      const x = Math.floor(Math.random() * numSquaresX);
      const y = Math.floor(Math.random() * numSquaresY);
      randomSquares.push([x, y]);
    }
    setSquares(randomSquares);
  }, [numSquaresX, numSquaresY]);

  useEffect(() => {
    // Update dimensions on mount/resize
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 size-full fill-muted/20 stroke-muted/20',
        className
      )}
      {...(dimensions.width && dimensions.height
        ? {
            width: dimensions.width,
            height: dimensions.height,
          }
        : { width: '100%', height: '100%' })}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={0} y={0}>
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeWidth={strokeWidth}
            className="motion-reduce:opacity-0"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      <svg x={0} y={0} className="overflow-visible">
        {squares.map(([x, y], index) => (
          <rect
            key={`${x}-${y}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: Static positions, no reordering
              index
            }`}
            width={width - 1}
            height={height - 1}
            x={x * width + 1}
            y={y * height + 1}
            fill="currentColor"
            strokeWidth={0}
            className="motion-reduce:hidden"
            style={
              {
                opacity: 0,
                animation: `grid-pulse ${duration}s ease-in-out infinite`,
                animationDelay: `${index * 0.1}s`,
                '--max-opacity': maxOpacity,
              } as React.CSSProperties & Record<string, string | number>
            }
          />
        ))}
      </svg>
    </svg>
  );
}
