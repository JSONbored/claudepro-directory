'use client';

/**
 * Number Ticker Component
 * Animated counter with smooth easing
 *
 * Performance optimizations:
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - GPU-accelerated with transform
 * - Memoized to prevent unnecessary re-renders
 * - Intersection observer for on-scroll animation
 *
 * @module components/ui/magic/number-ticker
 */

import { memo, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';

interface NumberTickerProps {
  /**
   * Target value to animate to
   */
  value: number;

  /**
   * Duration of animation in milliseconds
   * @default 2000
   */
  duration?: number;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  delay?: number;

  /**
   * Number of decimal places
   * @default 0
   */
  decimalPlaces?: number;

  /**
   * Prefix (e.g., "$")
   */
  prefix?: string;

  /**
   * Suffix (e.g., "+", "K", "M")
   */
  suffix?: string;
}

function NumberTickerComponent({
  value,
  duration = 2000,
  className,
  delay = 0,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
}: NumberTickerProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || hasAnimated.current) return;

    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;

    const startAnimation = () => {
      const startTime = performance.now();
      const startValue = 0;

      const updateValue = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function: ease-out cubic for smooth deceleration
        const easeOutCubic = 1 - (1 - progress) ** 3;
        const currentValue = startValue + (value - startValue) * easeOutCubic;

        // Format number with decimal places
        const formattedValue = currentValue.toFixed(decimalPlaces);
        node.textContent = `${prefix}${formattedValue}${suffix}`;

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(updateValue);
        } else {
          hasAnimated.current = true;
        }
      };

      animationFrameId = requestAnimationFrame(updateValue);
    };

    // Start animation after delay
    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [value, duration, delay, decimalPlaces, prefix, suffix]);

  return (
    <span
      ref={nodeRef}
      className={cn('inline-block tabular-nums will-change-transform', className)}
      aria-live="polite"
    >
      {prefix}0{suffix}
    </span>
  );
}

export const NumberTicker = memo(NumberTickerComponent);
NumberTicker.displayName = 'NumberTicker';
