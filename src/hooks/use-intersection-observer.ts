'use client';

/**
 * Intersection Observer Hook (2025 Edition)
 *
 * Modern, performance-optimized hook for viewport intersection detection.
 * Uses React 19 patterns, proper cleanup, and memoization.
 *
 * @module hooks/use-intersection-observer
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  /**
   * Root element for intersection (null = viewport)
   * @default null
   */
  root?: Element | null;

  /**
   * Margin around root element
   * @default '50px'
   */
  rootMargin?: string;

  /**
   * Percentage of element that must be visible
   * @default 0.1
   */
  threshold?: number | number[];

  /**
   * Only trigger once (unobserve after first intersection)
   * @default true
   */
  triggerOnce?: boolean;

  /**
   * Enable observer (useful for conditional observation)
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback fired when intersection state changes
   */
  onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

interface UseIntersectionObserverResult<T extends Element> {
  ref: React.RefCallback<T>;
  isIntersecting: boolean;
  hasIntersected: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * useIntersectionObserver Hook
 *
 * Tracks when an element enters the viewport using Intersection Observer API.
 * Performance-optimized with:
 * - Memoized observer instance (doesn't recreate on re-renders)
 * - Proper cleanup preventing memory leaks and race conditions
 * - Callback ref pattern for dynamic element changes
 * - TypeScript strict null safety
 *
 * @example
 * ```tsx
 * function AnimatedCard() {
 *   const { ref, isIntersecting } = useIntersectionObserver({
 *     threshold: 0.1,
 *     triggerOnce: true,
 *   });
 *
 *   return (
 *     <div ref={ref} className={isIntersecting ? 'animate-fade-in' : 'opacity-0'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverResult<T> {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
    enabled = true,
    onChange,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  // Use ref to track mounted state to prevent race conditions
  const isMountedRef = useRef(true);
  const elementRef = useRef<T | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange callback in sync without triggering re-observation
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Memoize observer options to prevent unnecessary observer recreation
  const observerOptions = useMemo(
    () => ({
      root,
      rootMargin,
      threshold,
    }),
    [root, rootMargin, threshold]
  );

  // Memoized observer instance - only recreates when options change
  const observer = useMemo(() => {
    // Browser support check
    if (typeof IntersectionObserver === 'undefined') {
      return null;
    }

    return new IntersectionObserver((entries) => {
      const observerEntry = entries[0];

      // Guard against undefined entry
      if (!observerEntry) return;

      // Prevent state updates after unmount
      if (!isMountedRef.current) return;

      const intersecting = observerEntry.isIntersecting;

      setIsIntersecting(intersecting);
      setEntry(observerEntry);

      if (intersecting && !hasIntersected) {
        setHasIntersected(true);
      }

      // Fire onChange callback if provided
      onChangeRef.current?.(intersecting, observerEntry);

      // Unobserve after first intersection if triggerOnce
      if (triggerOnce && intersecting && elementRef.current) {
        observer?.unobserve(elementRef.current);
      }
    }, observerOptions);
  }, [observerOptions, triggerOnce, hasIntersected]);

  // Callback ref pattern - handles dynamic element mounting/unmounting
  const ref = useCallback(
    (element: T | null) => {
      // Cleanup previous observation
      if (elementRef.current && observer) {
        observer.unobserve(elementRef.current);
      }

      elementRef.current = element;

      // Skip if disabled or already triggered once
      if (!enabled || (triggerOnce && hasIntersected)) {
        return;
      }

      // Fallback for browsers without IntersectionObserver
      if (!observer) {
        if (isMountedRef.current) {
          setIsIntersecting(true);
          setHasIntersected(true);
        }
        return;
      }

      // Start observing new element
      if (element) {
        observer.observe(element);
      }
    },
    [observer, enabled, triggerOnce, hasIntersected]
  );

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Disconnect observer on unmount
      if (observer) {
        observer.disconnect();
      }
    };
  }, [observer]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
    entry,
  };
}
