import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for configuring the infinite scroll behavior
 *
 * @property {number} [threshold=0.1] - Percentage of target visibility to trigger loading (0.0 to 1.0)
 * @property {string} [rootMargin='100px'] - Margin around the root element for early triggering
 * @property {boolean} [hasMore] - Whether more content is available to load
 * @property {boolean} [loading] - Whether content is currently being loaded
 */
interface InfiniteScrollHookOptions {
  threshold?: number;
  rootMargin?: string;
  hasMore?: boolean;
  loading?: boolean;
}

/**
 * Custom hook for implementing infinite scroll functionality using Intersection Observer API
 *
 * This hook automatically triggers the `onLoadMore` callback when a sentinel element
 * becomes visible in the viewport, enabling seamless infinite scrolling experiences.
 *
 * @param {() => void | Promise<void>} onLoadMore - Callback function to load more content
 * @param {InfiniteScrollHookOptions} options - Configuration options for scroll behavior
 * @param {number} [options.threshold=0.1] - Visibility threshold (0.0 to 1.0) to trigger loading
 * @param {string} [options.rootMargin='100px'] - Margin around root to trigger early loading
 * @param {boolean} [options.hasMore] - Flag indicating if more content is available
 * @param {boolean} [options.loading] - Flag indicating if content is currently loading
 *
 * @returns {React.RefObject<HTMLDivElement>} Ref object to attach to the sentinel element
 *
 * @example
 * ```tsx
 * function ContentList() {
 *   const [items, setItems] = useState([]);
 *   const [hasMore, setHasMore] = useState(true);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadMore = async () => {
 *     setLoading(true);
 *     const newItems = await fetchMoreItems();
 *     setItems(prev => [...prev, ...newItems]);
 *     setHasMore(newItems.length > 0);
 *     setLoading(false);
 *   };
 *
 *   const observerTarget = useInfiniteScroll(loadMore, {
 *     threshold: 0.5,
 *     rootMargin: '200px',
 *     hasMore,
 *     loading,
 *   });
 *
 *   return (
 *     <div>
 *       {items.map(item => <Item key={item.id} {...item} />)}
 *       {hasMore && <div ref={observerTarget} />}
 *       {loading && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteScroll(
  onLoadMore: () => void | Promise<void>,
  options: InfiniteScrollHookOptions
) {
  const { threshold = 0.1, rootMargin = '100px', hasMore, loading } = options;
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target) {
      setIsIntersecting(target.isIntersecting);
    }
  }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      const result = onLoadMore();
      if (result instanceof Promise) {
        result.catch(() => {
          // Error already handled by parent component
        });
      }
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  // Set up observer whenever hasMore or loading changes (indicates element may have been remounted)
  useEffect(() => {
    const element = observerTarget.current;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Set up new observer if element exists and conditions are right
    if (element && hasMore && !loading) {
      const observer = new IntersectionObserver(handleObserver, {
        threshold,
        rootMargin,
      });

      observer.observe(element);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleObserver, threshold, rootMargin, hasMore, loading]);

  return observerTarget;
}
