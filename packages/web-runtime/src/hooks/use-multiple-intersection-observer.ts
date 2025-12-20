'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for useMultipleIntersectionObserver hook
 */
export interface UseMultipleIntersectionObserverOptions {
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
   * Callback fired when intersection states change
   */
  onChange?: (entries: Map<string, IntersectionObserverEntry>) => void;
}

/**
 * React hook for observing multiple elements with Intersection Observer API.
 *
 * Uniform implementation using the same pattern as useIntersectionObserver,
 * but observes multiple elements and tracks which is most visible.
 *
 * **When to use:**
 * - ✅ Table of contents - Track which heading is currently visible
 * - ✅ Scroll-linked navigation - Highlight active section
 * - ✅ Multiple element visibility tracking
 * - ✅ Determining most visible element from a set
 *
 * **Features:**
 * - Uses native Intersection Observer API (browser-optimized)
 * - Tracks all observed elements' intersection states
 * - Provides helper to get most visible element
 * - Automatic cleanup on unmount
 * - SSR compatible with proper fallbacks
 *
 * @param elementIds - Array of element IDs to observe
 * @param options - Configuration options
 * @returns Object with `observeElements` function and `entries` map
 *
 * @example
 * ```tsx
 * // Table of contents
 * const { observeElements, entries, getMostVisibleId } = useMultipleIntersectionObserver({
 *   rootMargin: '-20% 0px -60% 0px',
 *   threshold: [0, 0.25, 0.5, 0.75, 1],
 * });
 *
 * useEffect(() => {
 *   observeElements(['heading-1', 'heading-2', 'heading-3']);
 * }, [observeElements]);
 *
 * const activeId = getMostVisibleId();
 * ```
 */
export function useMultipleIntersectionObserver(
  options: UseMultipleIntersectionObserverOptions = {}
): {
  observeElements: (elementIds: string[]) => void;
  entries: Map<string, IntersectionObserverEntry>;
  getMostVisibleId: () => string | null;
} {
  const { threshold = 0, root = null, rootMargin = '0%', onChange } = options;

  const [entries, setEntries] = useState<Map<string, IntersectionObserverEntry>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Map<string, Element>>(new Map());

  // Create observer
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (observerEntries) => {
        setEntries((prev) => {
          const newEntries = new Map(prev);

          observerEntries.forEach((entry) => {
            const elementId = entry.target.id;
            if (elementId) {
              newEntries.set(elementId, entry);
            }
          });

          return newEntries;
        });
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observedElementsRef.current.clear();
    };
  }, [threshold, root, rootMargin]);

  // Call onChange when entries change
  useEffect(() => {
    if (onChange && entries.size > 0) {
      onChange(entries);
    }
  }, [entries, onChange]);

  // Function to observe elements by ID
  const observeElements = useCallback((elementIds: string[]) => {
    if (typeof document === 'undefined' || !observerRef.current) {
      return;
    }

    const observer = observerRef.current;
    const observedElements = observedElementsRef.current;

    // Unobserve elements that are no longer in the list
    observedElements.forEach((element, id) => {
      if (!elementIds.includes(id)) {
        observer.unobserve(element);
        observedElements.delete(id);
      }
    });

    // Observe new elements
    elementIds.forEach((id) => {
      if (observedElements.has(id)) {
        return; // Already observing
      }

      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
        observedElements.set(id, element);
      }
    });
  }, []);

  // Helper to get most visible element ID
  const getMostVisibleId = useCallback((): string | null => {
    if (entries.size === 0) {
      return null;
    }

    const visibleEntries = Array.from(entries.values())
      .filter((entry) => entry.isIntersecting || entry.intersectionRatio > 0)
      .sort(
        (a, b) =>
          b.intersectionRatio - a.intersectionRatio ||
          a.boundingClientRect.top - b.boundingClientRect.top
      );

    if (visibleEntries.length > 0) {
      const firstEntry = visibleEntries[0];
      if (firstEntry) {
        return firstEntry.target.id || null;
      }
    }

    return null;
  }, [entries]);

  return {
    observeElements,
    entries,
    getMostVisibleId,
  };
}
