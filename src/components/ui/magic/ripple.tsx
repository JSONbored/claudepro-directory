'use client';

/**
 * Ripple Component
 * Material Design ripple effect wrapper
 *
 * Performance optimizations:
 * - Pure CSS animations
 * - GPU acceleration with transform and scale
 * - Event-driven ripple creation
 * - Auto-cleanup of ripple elements
 *
 * Accessibility:
 * - Wrapper passes through interactive semantics from children
 * - Ripple effects are decorative (pointer-events-none)
 * - Works with any interactive child element (button, link, etc.)
 *
 * @module components/ui/magic/ripple
 */

import {
  cloneElement,
  type MouseEvent,
  memo,
  type ReactElement,
  useCallback,
  useState,
} from 'react';
import { cn } from '@/src/lib/utils';

interface ChildProps {
  className?: string;
  onMouseDown?: (e: MouseEvent<HTMLElement>) => void;
}

interface RippleProps {
  /**
   * Ripple color
   * @default 'rgba(255, 255, 255, 0.3)'
   */
  color?: string;

  /**
   * Ripple duration in milliseconds
   * @default 600
   */
  duration?: number;

  /**
   * Custom class name for wrapper
   */
  className?: string;

  /**
   * Single interactive child element (button, link, etc.)
   * The child element provides the semantics and interactivity
   */
  children: ReactElement<ChildProps>;
}

interface RippleElement {
  id: number;
  x: number;
  y: number;
  size: number;
}

function RippleComponent({
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 600,
  className,
  children,
}: RippleProps) {
  const [ripples, setRipples] = useState<RippleElement[]>([]);

  const addRipple = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const rippleContainer = event.currentTarget.getBoundingClientRect();
      const size = Math.max(rippleContainer.width, rippleContainer.height);
      const x = event.clientX - rippleContainer.left - size / 2;
      const y = event.clientY - rippleContainer.top - size / 2;

      const newRipple: RippleElement = {
        id: Date.now(),
        x,
        y,
        size,
      };

      setRipples((prevRipples) => [...prevRipples, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prevRipples) => prevRipples.filter((ripple) => ripple.id !== newRipple.id));
      }, duration);
    },
    [duration]
  );

  // Clone the child element and add ripple effect handler
  // The child element provides all interactive semantics (role, tabIndex, etc.)
  const originalOnMouseDown = children.props.onMouseDown;
  const originalClassName = children.props.className;

  const childWithRipple = cloneElement<ChildProps>(children, {
    className: cn('relative overflow-hidden', originalClassName, className),
    onMouseDown: (e: MouseEvent<HTMLElement>) => {
      // Call original onMouseDown if it exists
      originalOnMouseDown?.(e);
      // Add ripple effect
      addRipple(e);
    },
  });

  return (
    <>
      {childWithRipple}
      {/* Render ripples as siblings using portal-like positioning */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full will-change-transform"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            transform: 'scale(0)',
            opacity: 1,
            animation: `rippleEffect ${duration}ms ease-out`,
          }}
        />
      ))}
    </>
  );
}

export const Ripple = memo(RippleComponent);
Ripple.displayName = 'Ripple';
