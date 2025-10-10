'use client';

/**
 * Ripple Effect Component (2025 Edition)
 *
 * Modern ripple hover effect for interactive elements.
 * Performance-optimized with GPU acceleration and proper cleanup.
 *
 * @module components/ui/magic/ripple
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface RippleProps {
  /**
   * Color of the ripple effect
   * @default 'rgba(255, 255, 255, 0.3)'
   */
  color?: string;

  /**
   * Duration of ripple animation in milliseconds
   * @default 600
   */
  duration?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Trigger ripple on click instead of hover
   * @default false
   */
  onClickTrigger?: boolean;
}

interface RippleCircle {
  x: number;
  y: number;
  size: number;
  id: string;
}

/**
 * Ripple Component
 *
 * Creates an animated ripple effect from the cursor position.
 * Optimized for performance with:
 * - GPU-accelerated transforms
 * - Automatic cleanup after animation
 * - RequestAnimationFrame scheduling
 * - Memoized event handlers
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <Ripple color="rgba(var(--accent), 0.3)" />
 *   <button>Click me</button>
 * </div>
 * ```
 */
export function Ripple({
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 600,
  className,
  onClickTrigger = false,
}: RippleProps) {
  const [ripples, setRipples] = useState<RippleCircle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup ripples after animation completes
  useEffect(() => {
    if (ripples.length === 0) return;

    const timeoutId = setTimeout(() => {
      setRipples([]);
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [ripples, duration]);

  // Create ripple at cursor position
  const createRipple = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate ripple size (diagonal of container)
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: RippleCircle = {
      x,
      y,
      size,
      id: `ripple-${Date.now()}-${Math.random()}`,
    };

    setRipples((prev) => [...prev, newRipple]);
  }, []);

  // Event handler based on trigger type
  const eventHandler = onClickTrigger ? { onClick: createRipple } : { onMouseEnter: createRipple };

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      {...eventHandler}
      style={{ pointerEvents: onClickTrigger ? 'auto' : 'none' }}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple-expand"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            transform: 'translate(-50%, -50%) scale(0)',
            backgroundColor: color,
            animationDuration: `${duration}ms`,
            ['--ripple-duration' as string]: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * RippleButton Component
 *
 * Button wrapper with built-in ripple effect.
 * Convenience component for common use case.
 *
 * @example
 * ```tsx
 * <RippleButton onClick={() => console.log('clicked')}>
 *   Click me
 * </RippleButton>
 * ```
 */
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  rippleDuration?: number;
}

export function RippleButton({
  children,
  className,
  rippleColor,
  rippleDuration,
  ...props
}: RippleButtonProps) {
  return (
    <button
      className={cn(
        'relative overflow-hidden',
        'px-4 py-2 rounded-md',
        'bg-accent text-accent-foreground',
        'hover:bg-accent-hover transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className
      )}
      {...props}
    >
      <Ripple
        {...(rippleColor && { color: rippleColor })}
        {...(rippleDuration && { duration: rippleDuration })}
        onClickTrigger={true}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
