'use client';

/**
 * Intersection Observer Hook
 * Detects when an element enters/exits viewport
 *
 * Performance optimizations:
 * - Uses native IntersectionObserver API
 * - Automatic cleanup on unmount
 * - Configurable threshold and root margin
 * - Type-safe with TypeScript
 *
 * @module hooks/use-intersection-observer
 */

import { type RefObject, useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  /**
   * Root element for intersection detection
   * @default null (viewport)
   */
  root?: Element | null;

  /**
   * Margin around root element
   * @default '0px'
   */
  rootMargin?: string;

  /**
   * Threshold(s) for triggering intersection
   * @default 0.1
   */
  threshold?: number | number[];

  /**
   * Run only once (disconnect after first intersection)
   * @default false
   */
  once?: boolean;
}

interface UseIntersectionObserverReturn {
  /**
   * Ref to attach to the observed element
   */
  ref: RefObject<HTMLElement | null>;

  /**
   * Current intersection status
   */
  isIntersecting: boolean;

  /**
   * Current IntersectionObserver entry
   */
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook to observe element intersection with viewport
 *
 * @example
 * ```tsx
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.5,
 *   once: true,
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isIntersecting && <AnimatedComponent />}
 *   </div>
 * );
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { root = null, rootMargin = '0px', threshold = 0.1, once = false } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: assume element is visible if API not supported
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        // Guard against undefined entries
        if (!observerEntry) return;

        setIsIntersecting(observerEntry.isIntersecting);
        setEntry(observerEntry);

        // Disconnect after first intersection if 'once' is true
        if (observerEntry.isIntersecting && once && observerRef.current) {
          observerRef.current.disconnect();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [root, rootMargin, threshold, once]);

  return { ref, isIntersecting, entry };
}
