'use client';

/**
 * Meteors Background Component
 *
 * Animated shooting star/meteor effect for backgrounds.
 * Lightweight CSS animation with randomized positions and delays.
 *
 * @module components/ui/magic/meteors
 */

import { useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface MeteorsProps {
  /**
   * Number of meteors to render
   * @default 20
   */
  number?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Meteors Component
 *
 * Creates an animated meteor shower effect.
 * Optimized with CSS transforms and respects prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * <div className="relative h-screen">
 *   <Meteors number={30} />
 *   <div className="relative z-10">Your content</div>
 * </div>
 * ```
 */
export function Meteors({ number = 20, className }: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([]);

  useEffect(() => {
    const styles = [...new Array(number)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${Math.random() * 2 + 2}s`,
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={`meteor-${
            // biome-ignore lint/suspicious/noArrayIndexKey: Static array, no reordering
            idx
          }`}
          className={cn(
            'pointer-events-none absolute size-0.5 rotate-[215deg] animate-meteor rounded-full bg-accent/50 shadow-[0_0_0_1px_#ffffff10] motion-reduce:animate-none',
            'before:absolute before:top-1/2 before:h-px before:w-[50px] before:-translate-y-1/2 before:transform before:bg-gradient-to-r before:from-accent/50 before:to-transparent before:content-[""]',
            className
          )}
          style={style}
        />
      ))}
    </>
  );
}
