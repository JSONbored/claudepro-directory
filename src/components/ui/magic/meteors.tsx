'use client';

/**
 * Meteors Component
 * Animated shooting stars background effect
 *
 * Performance optimizations:
 * - Pure CSS animations (no JavaScript for animation)
 * - GPU acceleration with transform
 * - Randomized delays and durations via CSS variables
 * - Uses absolute positioning for layout containment
 *
 * @module components/ui/magic/meteors
 */

import { memo, useMemo } from 'react';
import { cn } from '@/src/lib/utils';

interface MeteorsProps {
  /**
   * Number of meteors to display
   * @default 20
   */
  number?: number;

  /**
   * Custom class name for container
   */
  className?: string;
}

function MeteorsComponent({ number = 20, className }: MeteorsProps) {
  // Generate meteor configurations once using useMemo
  const meteors = useMemo(() => {
    return Array.from({ length: number }, (_, i) => ({
      id: i,
      // Random left position (0-100%)
      left: `${Math.random() * 100}%`,
      // Random animation delay (0-5s)
      animationDelay: `${Math.random() * 5}s`,
      // Random animation duration (3-8s)
      animationDuration: `${3 + Math.random() * 5}s`,
    }));
  }, [number]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="meteor absolute top-0 h-px w-px rotate-[215deg] animate-meteor bg-gradient-to-r from-accent to-transparent will-change-transform"
          style={{
            left: meteor.left,
            animationDelay: meteor.animationDelay,
            animationDuration: meteor.animationDuration,
          }}
        >
          {/* Meteor tail */}
          <span className="absolute top-1/2 h-px w-12 -translate-y-1/2 bg-gradient-to-r from-accent to-transparent" />
        </span>
      ))}
    </div>
  );
}

export const Meteors = memo(MeteorsComponent);
Meteors.displayName = 'Meteors';
