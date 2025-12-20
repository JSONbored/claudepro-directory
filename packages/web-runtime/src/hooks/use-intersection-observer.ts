'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// BoxModel type moved to use-resize-observer.ts to avoid duplicate export

/**
 * Options for useIntersectionObserver hook
 */
export interface UseIntersectionObserverOptions {
  /**
   * Visibility percentage needed to trigger (0-1)
   * @default 0
   */
  threshold?: number | number[];
  /**
   * Container element for intersection calculation
   * @default null (viewport)
   */
  root?: Element | Document | null;
  /**
   * Margin around root element for intersection area
   * @default "0%"
   */
  rootMargin?: string;
  /**
   * Lock intersection state once element becomes visible
   * @default false
   */
  freezeOnceVisible?: boolean;
  /**
   * Initial intersection state before observation
   * @default false
   */
  initialIsIntersecting?: boolean;
  /**
   * Callback fired when intersection state changes
   */
  onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

/**
 * React hook for element visibility detection using Intersection Observer API.
 *
 * Efficiently tracks when elements enter or leave the viewport (or a container) using
 * the native browser API. Much better performance than scroll listeners with manual
 * calculations.
 *
 * **When to use:**
 * - ✅ Lazy loading - Images, videos, and content that loads when visible
 * - ✅ Scroll animations - Trigger effects when elements enter the viewport
 * - ✅ Analytics tracking - Monitor content exposure and engagement metrics
 * - ✅ Infinite scroll - Detect when users reach the bottom of lists
 * - ✅ Performance optimization - Defer expensive operations until needed
 * - ✅ Progress indicators - Track reading progress and section visibility
 * - ❌ For simple show/hide logic - CSS or basic state is usually fine
 *
 * **Features:**
 * - Uses native Intersection Observer API (browser-optimized)
 * - Configurable thresholds (single value or array for multiple levels)
 * - Freeze-on-visible option to lock state once element becomes visible
 * - Custom root elements for container-relative observation
 * - Automatic cleanup on unmount
 * - SSR compatible with proper fallbacks
 *
 * **Performance:**
 * - Intersection Observer is optimized by browsers
 * - Only fires when visibility actually changes (not on every scroll)
 * - Much better than scroll listeners with getBoundingClientRect()
 *
 * @param options - Configuration options
 * @returns Object with `ref` callback and `isIntersecting` boolean
 *
 * @example
 * ```tsx
 * // Lazy loading images
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 * });
 *
 * <div ref={ref}>
 *   {isIntersecting ? <img src={src} /> : <div>Loading...</div>}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Scroll animations
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.5,
 *   freezeOnceVisible: true,
 * });
 *
 * <div ref={ref} className={isIntersecting ? 'animate-in' : 'opacity-0'}>
 *   Content
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Multiple thresholds
 * const { ref, isIntersecting, entry } = useIntersectionObserver({
 *   threshold: [0, 0.25, 0.5, 0.75, 1],
 *   onChange: (isIntersecting, entry) => {
 *     console.log(`Visible: ${entry.intersectionRatio * 100}%`);
 *   },
 * });
 * ```
 */
export function useIntersectionObserver(options: UseIntersectionObserverOptions = {}): {
  ref: (node?: Element | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | undefined;
} {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
    initialIsIntersecting = false,
    onChange,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>(undefined);
  const elementRef = useRef<Element | null>(null);
  const frozen = useRef(initialIsIntersecting);

  const setRef = useCallback((node?: Element | null) => {
    elementRef.current = node ?? null;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // Skip if frozen and already visible
    if (freezeOnceVisible && frozen.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        const isElementIntersecting = entry.isIntersecting;

        if (freezeOnceVisible && isElementIntersecting) {
          frozen.current = true;
        }

        setIsIntersecting(isElementIntersecting);
        setEntry(entry);
        onChange?.(isElementIntersecting, entry);
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, onChange]);

  return {
    ref: setRef,
    isIntersecting: frozen.current || isIntersecting,
    entry,
  };
}
