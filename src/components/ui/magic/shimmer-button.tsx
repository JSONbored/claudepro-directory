'use client';

/**
 * Shimmer Button Component
 * GPU-accelerated shimmer effect using CSS animations
 *
 * Performance optimizations:
 * - Pure CSS animations (no JavaScript runtime cost)
 * - GPU acceleration with transform and will-change
 * - Uses background gradients for shimmer effect
 * - Minimal bundle size impact
 *
 * @module components/ui/magic/shimmer-button
 */

import { type ButtonHTMLAttributes, memo, type RefObject } from 'react';
import { cn } from '@/src/lib/utils';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Shimmer animation speed
   * @default 'normal'
   */
  shimmerSpeed?: 'slow' | 'normal' | 'fast';

  /**
   * Shimmer color (CSS color value)
   * @default 'rgba(255, 255, 255, 0.3)'
   */
  shimmerColor?: string;

  /**
   * Background color or gradient
   * @default 'var(--color-accent)'
   */
  background?: string;

  /**
   * Ref to the button element
   */
  ref?: RefObject<HTMLButtonElement | null>;
}

const ShimmerButtonComponent = ({
  className,
  children,
  shimmerSpeed = 'normal',
  shimmerColor = 'rgba(255, 255, 255, 0.3)',
  background = 'var(--color-accent)',
  ref,
  ...props
}: ShimmerButtonProps) => {
  const speedMap = {
    slow: '3s',
    normal: '2s',
    fast: '1s',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden',
        'rounded-lg px-6 py-3',
        'font-medium text-white',
        'transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'will-change-transform',
        className
      )}
      style={{
        background,
      }}
      {...props}
    >
      {/* Shimmer effect */}
      <span
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(
              110deg,
              transparent 20%,
              ${shimmerColor} 50%,
              transparent 80%
            )`,
          backgroundSize: '200% 100%',
          animation: `shimmer ${speedMap[shimmerSpeed]} infinite linear`,
          willChange: 'background-position',
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

ShimmerButtonComponent.displayName = 'ShimmerButton';

export const ShimmerButton = memo(ShimmerButtonComponent);
