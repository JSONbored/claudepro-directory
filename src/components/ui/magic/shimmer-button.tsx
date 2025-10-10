'use client';

/**
 * Shimmer Button Component
 *
 * Button with animated shimmer/shine effect for drawing attention to CTAs.
 * Uses CSS-only animation for optimal performance.
 *
 * @module components/ui/magic/shimmer-button
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button content
   */
  children: ReactNode;

  /**
   * Shimmer color (CSS color value)
   * @default 'rgba(255, 255, 255, 0.5)'
   */
  shimmerColor?: string;

  /**
   * Shimmer animation duration in seconds
   * @default 3
   */
  shimmerDuration?: number;

  /**
   * Button variant
   * @default 'default'
   */
  variant?: 'default' | 'accent' | 'ghost';

  /**
   * Button size
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ShimmerButton Component
 *
 * Draws attention to important CTAs with a subtle animated shimmer effect.
 * GPU-accelerated and respects prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * <ShimmerButton variant="accent">
 *   Star on GitHub
 * </ShimmerButton>
 * ```
 */
export function ShimmerButton({
  children,
  shimmerColor = 'rgba(255, 255, 255, 0.5)',
  shimmerDuration = 3,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: ShimmerButtonProps) {
  const variantClasses = {
    default: 'bg-card border-border text-foreground hover:bg-accent/10',
    accent: 'bg-accent/5 border-accent/20 text-accent hover:bg-accent/10',
    ghost: 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md border font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>

      {/* Shimmer Effect */}
      <span
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent motion-reduce:animate-none"
        style={
          {
            '--shimmer-color': shimmerColor,
            '--shimmer-duration': `${shimmerDuration}s`,
            animationDuration: `${shimmerDuration}s`,
          } as React.CSSProperties & Record<string, string>
        }
        aria-hidden="true"
      />
    </button>
  );
}
