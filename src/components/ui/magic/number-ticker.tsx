'use client';

/**
 * Animated Number Counter Component
 *
 * Performance-optimized number ticker with smooth easing animation.
 * Uses requestAnimationFrame for 60fps animation aligned with browser render cycle.
 *
 * @module components/ui/magic/number-ticker
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface NumberTickerProps {
  /**
   * Target value to count to
   */
  value: number;

  /**
   * Animation duration in milliseconds
   * @default 2000
   */
  duration?: number;

  /**
   * Optional prefix (e.g., "$", "+")
   */
  prefix?: string;

  /**
   * Optional suffix (e.g., "%", "+", "K")
   */
  suffix?: string;

  /**
   * Number of decimal places
   * @default 0
   */
  decimalPlaces?: number;

  /**
   * Use locale formatting (adds commas)
   * @default true
   */
  useLocale?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Delay before animation starts (in ms)
   * @default 0
   */
  delay?: number;
}

/**
 * Easing function for smooth animation
 * Uses easeOutExpo for snappy deceleration
 */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

/**
 * NumberTicker Component
 *
 * Animates a number from 0 to target value with smooth easing.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <NumberTicker value={150} suffix="+" />
 * <NumberTicker value={2500} prefix="$" decimalPlaces={2} />
 * ```
 */
export function NumberTicker({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimalPlaces = 0,
  useLocale = true,
  className,
  delay = 0,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current - delay;

      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = easedProgress * value;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimatedRef.current = true;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, delay]);

  const formattedValue = useLocale
    ? displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : displayValue.toFixed(decimalPlaces);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
