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

import { cn } from '../../utils.ts';
import { SPRING } from '../../../design-system/index.ts';
import { useReducedMotion, usePageInView } from '../../../hooks/motion/index.ts';
import { useSpring } from '../../../hooks/motion/index.ts';
import { useTimeout } from '../../../hooks/use-timeout.ts';
import * as React from 'react';
import { memo, useEffect, useRef, useState } from 'react';

interface NumberTickerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * Target value to animate to
   */
  value: number;

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
  style,
  ...props
}: NumberTickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const isPageInView = usePageInView();

  // For reduced motion, display value instantly without animation
  const [displayValue, setDisplayValue] = useState(
    `${prefix}${value.toFixed(decimalPlaces)}${suffix}`
  );

  // Create spring-animated value only if not reducing motion and page is in view
  const spring = useSpring(shouldReduceMotion || !isPageInView ? value : 0, SPRING.smooth);

  // Store spring in ref to access stable reference in effects
  const springRef = useRef(spring);
  springRef.current = spring;

  useEffect(() => {
    // For reduced motion or when page not in view, update display value directly
    if (shouldReduceMotion || !isPageInView) {
      setDisplayValue(`${prefix}${value.toFixed(decimalPlaces)}${suffix}`);
      return;
    }

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
  }, [decimalPlaces, prefix, suffix, shouldReduceMotion, isPageInView, value]);

  // Animate to target value on mount or when value changes
  // For reduced motion or when page not in view, set value instantly
  useEffect(() => {
    if (shouldReduceMotion || !isPageInView) {
      setDisplayValue(`${prefix}${value.toFixed(decimalPlaces)}${suffix}`);
    }
  }, [value, shouldReduceMotion, isPageInView, prefix, suffix, decimalPlaces]);

  // Use useTimeout for animation delay (handles delay === 0 as immediate execution)
  useTimeout(
    () => {
      if (!shouldReduceMotion && isPageInView) {
        springRef.current.set(value);
      }
    },
    !shouldReduceMotion && isPageInView && delay >= 0 ? delay : null
  );

  return (
    <span
      className={cn('inline-block tabular-nums will-change-transform', className)}
      aria-live="polite"
      style={{
        // Prevent CLS by reserving space for final value
        minWidth: `${String(value).length + prefix.length + suffix.length}ch`,
        ...style,
      }}
      {...props}
    >
      {displayValue}
    </span>
  );
}

export const NumberTicker = memo(NumberTickerComponent);
NumberTicker.displayName = 'NumberTicker';
