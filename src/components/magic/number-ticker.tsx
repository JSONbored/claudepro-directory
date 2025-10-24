'use client';

/**
 * Number Ticker Component
 * Animated counter with Motion.dev spring physics
 *
 * Enhanced with Motion.dev (Phase 1.5 - October 2025):
 * - useSpring for physically accurate motion (replaces cubic easing)
 * - Natural deceleration with configurable stiffness/damping
 * - Smoother transitions than RAF + cubic easing
 * - Still GPU-accelerated and 60fps
 *
 * Performance optimizations:
 * - Memoized to prevent unnecessary re-renders
 * - GPU-accelerated with will-change
 * - Intersection observer for on-scroll animation
 *
 * @module components/ui/magic/number-ticker
 */

import { useSpring } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface NumberTickerProps {
  /**
   * Target value to animate to
   */
  value: number;

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
  className,
  delay = 0,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
}: NumberTickerProps) {
  // Create spring-animated value - called at top level
  const spring = useSpring(0, { stiffness: 100, damping: 30 });

  // Subscribe to spring value changes and format to string
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);

  // Store spring in ref to access stable reference in effects
  const springRef = useRef(spring);
  springRef.current = spring;

  useEffect(() => {
    // Subscribe to spring value changes
    // Use springRef.current to get stable reference
    const currentSpring = springRef.current;
    const unsubscribe = currentSpring.on('change', (latest) => {
      const formattedValue = latest.toFixed(decimalPlaces);
      setDisplayValue(`${prefix}${formattedValue}${suffix}`);
    });

    return () => {
      unsubscribe();
    };
  }, [decimalPlaces, prefix, suffix]);

  // Animate to target value on mount or when value changes
  useEffect(() => {
    const timer = setTimeout(() => {
      springRef.current.set(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return (
    <span
      className={cn('inline-block tabular-nums will-change-transform', className)}
      aria-live="polite"
      style={{
        // Prevent CLS by reserving space for final value
        minWidth: `${String(value).length + prefix.length + suffix.length}ch`,
      }}
    >
      {displayValue}
    </span>
  );
}

export const NumberTicker = memo(NumberTickerComponent);
NumberTicker.displayName = 'NumberTicker';
