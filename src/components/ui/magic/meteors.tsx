'use client';

/**
 * Meteors Component
 * Animated shooting stars background effect
 *
 * Performance optimizations:
 * - Pure CSS animations (no JavaScript for animation)
 * - GPU acceleration with transform
 * - Client-side only rendering to avoid hydration mismatches
 * - Uses absolute positioning for layout containment
 *
 * @module components/ui/magic/meteors
 */

import { memo, useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface MeteorsProps {
  /**
   * Number of meteors to display
   * Optimal range: 10-50 (higher values impact performance)
   * @default 20
   */
  number?: number;

  /**
   * Minimum animation delay in seconds
   * @default 0
   */
  minDelay?: number;

  /**
   * Maximum animation delay in seconds
   * @default 5
   */
  maxDelay?: number;

  /**
   * Minimum animation duration in seconds
   * @default 3
   */
  minDuration?: number;

  /**
   * Maximum animation duration in seconds
   * @default 8
   */
  maxDuration?: number;

  /**
   * Meteor trajectory angle in degrees
   * @default 215
   */
  angle?: number;

  /**
   * Custom class name for container
   */
  className?: string;
}

function MeteorsComponent({
  number = 20,
  minDelay = 0,
  maxDelay = 5,
  minDuration = 3,
  maxDuration = 8,
  angle = 215,
  className,
}: MeteorsProps) {
  const [meteors, setMeteors] = useState<
    Array<{
      id: number;
      left: string;
      top: string;
      animationDelay: string;
      animationDuration: string;
    }>
  >([]);

  // Generate meteors on client-side only to avoid hydration mismatch
  useEffect(() => {
    const generatedMeteors = Array.from({ length: number }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`, // Distribute across entire height
      animationDelay: `${minDelay + Math.random() * (maxDelay - minDelay)}s`,
      animationDuration: `${minDuration + Math.random() * (maxDuration - minDuration)}s`,
    }));
    setMeteors(generatedMeteors);
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  // Don't render anything on server
  if (meteors.length === 0) {
    return null;
  }

  return (
    <>
      {/* Global keyframes styles - only render once per angle */}
      <style>{`
        @keyframes meteor-${angle} {
          0% {
            transform: translateY(-200%) translateX(-200%) rotate(${angle}deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100vh) rotate(${angle}deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        className={cn('pointer-events-none absolute inset-0 overflow-hidden z-[1]', className)}
        aria-hidden="true"
      >
        {meteors.map((meteor) => (
          <span
            key={meteor.id}
            className="absolute"
            style={{
              left: meteor.left,
              top: meteor.top,
              animation: `meteor-${angle} ${meteor.animationDuration} linear infinite`,
              animationDelay: meteor.animationDelay,
            }}
          >
            {/* Meteor comet with tail */}
            <span
              className="block relative h-[1.5px] w-[80px]"
              style={{
                transform: `rotate(${angle}deg)`,
              }}
            >
              {/* Bright head (leading edge) */}
              <span className="absolute right-0 h-full w-[30%] rounded-full bg-accent shadow-[0_0_8px_2px_hsl(var(--accent)/0.5)]" />
              {/* Fading tail (trailing behind) */}
              <span className="absolute right-[25%] h-full w-[75%] rounded-full bg-gradient-to-l from-accent/80 via-accent/40 to-transparent" />
            </span>
          </span>
        ))}
      </div>
    </>
  );
}

export const Meteors = memo(MeteorsComponent);
Meteors.displayName = 'Meteors';
