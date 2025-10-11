/**
 * Infinite Scroll Hook Tests
 *
 * Tests for useInfiniteScroll hook which powers all content lists in the app.
 * This is CRITICAL infrastructure - every category page and the homepage "All" section
 * depend on this working correctly.
 *
 * Coverage:
 * - Intersection Observer setup and configuration
 * - Load more triggering (sync and async)
 * - hasMore and loading flags
 * - Cleanup and observer recreation
 * - Browser compatibility fallback
 * - Edge cases (rapid scrolling, empty lists, errors)
 *
 * @see src/hooks/use-infinite-scroll.ts
 */

import { render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInfiniteScroll } from '../use-infinite-scroll';

// Test component wrapper
function TestComponent({
  onLoadMore,
  hasMore = true,
  loading = false,
  threshold = 0.1,
  rootMargin = '100px',
}: {
  onLoadMore: () => void | Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  threshold?: number;
  rootMargin?: string;
}): ReactElement {
  const observerTarget = useInfiniteScroll(onLoadMore, {
    hasMore,
    loading,
    threshold,
    rootMargin,
  });

  return (
    <div>
      <div data-testid="content">Content</div>
      <div ref={observerTarget} data-testid="sentinel">
        Sentinel
      </div>
    </div>
  );
}

// Mock IntersectionObserver
let mockDisconnect: ReturnType<typeof vi.fn>;
let mockObserve: ReturnType<typeof vi.fn>;
let mockUnobserve: ReturnType<typeof vi.fn>;
let capturedCallback: IntersectionObserverCallback | undefined;
let capturedOptions: IntersectionObserverInit | undefined;

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    mockDisconnect = vi.fn();
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    capturedCallback = undefined;
    capturedOptions = undefined;

    global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
      capturedCallback = callback;
      capturedOptions = options;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('creates IntersectionObserver when sentinel is mounted', () => {
      const onLoadMore = vi.fn();
      render(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />);

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();
    });

    it('attaches observer to sentinel element', () => {
      const onLoadMore = vi.fn();
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );
      const sentinel = getByTestId('sentinel');

      expect(mockObserve).toHaveBeenCalledWith(sentinel);
    });

    it('does not create observer when hasMore is false', () => {
      const onLoadMore = vi.fn();
      render(<TestComponent onLoadMore={onLoadMore} hasMore={false} loading={false} />);

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
      expect(mockObserve).not.toHaveBeenCalled();
    });

    it('does not create observer when loading is true', () => {
      const onLoadMore = vi.fn();
      render(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={true} />);

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
      expect(mockObserve).not.toHaveBeenCalled();
    });
  });

  describe('Load More Triggering', () => {
    it('calls onLoadMore when sentinel becomes visible', async () => {
      const onLoadMore = vi.fn();
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      expect(onLoadMore).not.toHaveBeenCalled();

      // Simulate intersection
      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('handles async onLoadMore callback', async () => {
      const onLoadMore = vi.fn().mockResolvedValue(undefined);
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      // Simulate intersection
      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onLoadMore when hasMore is false', async () => {
      const onLoadMore = vi.fn();
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={false} loading={false} />
      );

      // Try to simulate intersection (but observer shouldn't be created)
      if (capturedCallback) {
        const sentinel = getByTestId('sentinel');
        const entries: IntersectionObserverEntry[] = [
          {
            isIntersecting: true,
            target: sentinel,
            intersectionRatio: 0.5,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now(),
          },
        ];

        capturedCallback(entries, {} as IntersectionObserver);
      }

      // Wait a bit to ensure callback is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('does not call onLoadMore when loading is true', async () => {
      const onLoadMore = vi.fn();
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={true} />
      );

      // Try to simulate intersection (but observer shouldn't be created)
      if (capturedCallback) {
        const sentinel = getByTestId('sentinel');
        const entries: IntersectionObserverEntry[] = [
          {
            isIntersecting: true,
            target: sentinel,
            intersectionRatio: 0.5,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now(),
          },
        ];

        capturedCallback(entries, {} as IntersectionObserver);
      }

      // Wait a bit to ensure callback is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('does not call onLoadMore when sentinel is not intersecting', () => {
      const onLoadMore = vi.fn();
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      // Simulate NOT intersecting
      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: false,
          target: sentinel,
          intersectionRatio: 0,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('handles promise rejection from onLoadMore', async () => {
      const onLoadMore = vi.fn().mockRejectedValue(new Error('Load failed'));
      const { getByTestId } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      // Simulate intersection
      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalledTimes(1);
      });

      // Should not throw - error is swallowed
      expect(() => capturedCallback?.(entries, {} as IntersectionObserver)).not.toThrow();
    });
  });

  describe('Options Configuration', () => {
    it('passes threshold option to IntersectionObserver', () => {
      const onLoadMore = vi.fn();
      render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} threshold={0.5} />
      );

      expect(capturedOptions?.threshold).toBe(0.5);
    });

    it('passes rootMargin option to IntersectionObserver', () => {
      const onLoadMore = vi.fn();
      render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} rootMargin="200px" />
      );

      expect(capturedOptions?.rootMargin).toBe('200px');
    });

    it('uses default threshold when not specified', () => {
      const onLoadMore = vi.fn();
      render(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />);

      expect(capturedOptions?.threshold).toBe(0.1);
    });

    it('uses default rootMargin when not specified', () => {
      const onLoadMore = vi.fn();
      render(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />);

      expect(capturedOptions?.rootMargin).toBe('100px');
    });
  });

  describe('Observer Recreation', () => {
    it('recreates observer when hasMore changes from false to true', () => {
      const onLoadMore = vi.fn();
      const { rerender } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={false} loading={false} />
      );

      expect(global.IntersectionObserver).not.toHaveBeenCalled();

      // Change hasMore to true
      rerender(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />);

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();
    });

    it('disconnects observer when hasMore changes from true to false', () => {
      const onLoadMore = vi.fn();
      const { rerender } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      expect(mockObserve).toHaveBeenCalled();

      // Change hasMore to false
      rerender(<TestComponent onLoadMore={onLoadMore} hasMore={false} loading={false} />);

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('disconnects observer when loading changes from false to true', () => {
      const onLoadMore = vi.fn();
      const { rerender } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      expect(mockObserve).toHaveBeenCalled();

      // Change loading to true
      rerender(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={true} />);

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('recreates observer when loading changes from true to false', () => {
      const onLoadMore = vi.fn();
      const { rerender } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={true} />
      );

      const firstCallCount = (global.IntersectionObserver as unknown as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      // Change loading to false
      rerender(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />);

      const secondCallCount = (global.IntersectionObserver as unknown as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });
  });

  describe('Cleanup', () => {
    it('disconnects observer on unmount', () => {
      const onLoadMore = vi.fn();
      const { unmount } = render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />
      );

      expect(mockDisconnect).not.toHaveBeenCalled();

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('cleans up observer when options change', () => {
      const onLoadMore = vi.fn();
      const { rerender } = render(
        <TestComponent
          onLoadMore={onLoadMore}
          hasMore={true}
          loading={false}
          threshold={0.1}
          rootMargin="100px"
        />
      );

      const firstDisconnectCount = mockDisconnect.mock.calls.length;

      // Change options
      rerender(
        <TestComponent
          onLoadMore={onLoadMore}
          hasMore={true}
          loading={false}
          threshold={0.5}
          rootMargin="200px"
        />
      );

      expect(mockDisconnect.mock.calls.length).toBeGreaterThan(firstDisconnectCount);
    });
  });

  describe('Browser Compatibility', () => {
    it('throws when IntersectionObserver is not available', () => {
      // Remove IntersectionObserver
      const originalIO = global.IntersectionObserver;
      // @ts-expect-error - Testing unsupported environment
      global.IntersectionObserver = undefined;

      const onLoadMore = vi.fn();

      // Should throw - hook requires IntersectionObserver
      expect(() =>
        render(<TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} />)
      ).toThrow();

      // Restore
      global.IntersectionObserver = originalIO;
    });
  });

  describe('Real-World Scenarios', () => {
    it('simulates loading first page of content', async () => {
      const items: string[] = [];
      const loadMore = vi.fn().mockImplementation(() => {
        // Simulate loading 20 items
        for (let i = 0; i < 20; i++) {
          items.push(`Item ${items.length + 1}`);
        }
      });

      const { getByTestId } = render(
        <TestComponent onLoadMore={loadMore} hasMore={true} loading={false} />
      );

      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledTimes(1);
        expect(items).toHaveLength(20);
      });
    });

    it('simulates reaching end of content (no more pages)', async () => {
      const loadMore = vi.fn();
      const { rerender, getByTestId } = render(
        <TestComponent onLoadMore={loadMore} hasMore={true} loading={false} />
      );

      // First load
      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledTimes(1);
      });

      // Simulate reaching end - hasMore becomes false
      rerender(<TestComponent onLoadMore={loadMore} hasMore={false} loading={false} />);

      // Try to trigger again (should not call loadMore)
      if (capturedCallback) {
        capturedCallback(entries, {} as IntersectionObserver);
      }

      // Wait a bit to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(loadMore).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('simulates loading while scrolling (prevents duplicate loads)', async () => {
      const loadMore = vi.fn();
      const { rerender, getByTestId } = render(
        <TestComponent onLoadMore={loadMore} hasMore={true} loading={false} />
      );

      // Start loading
      const sentinel = getByTestId('sentinel');
      const entries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(entries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledTimes(1);
      });

      // Simulate loading state
      rerender(<TestComponent onLoadMore={loadMore} hasMore={true} loading={true} />);

      // Try to trigger again while loading (should not call loadMore)
      if (capturedCallback) {
        capturedCallback(entries, {} as IntersectionObserver);
      }

      // Wait a bit to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(loadMore).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('simulates scrolling back up (sentinel no longer visible)', async () => {
      const loadMore = vi.fn();
      const { getByTestId } = render(
        <TestComponent onLoadMore={loadMore} hasMore={true} loading={false} />
      );

      const sentinel = getByTestId('sentinel');

      // Sentinel becomes visible
      const visibleEntries: IntersectionObserverEntry[] = [
        {
          isIntersecting: true,
          target: sentinel,
          intersectionRatio: 0.5,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(visibleEntries, {} as IntersectionObserver);

      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledTimes(1);
      });

      // Sentinel becomes hidden (user scrolled back up)
      const hiddenEntries: IntersectionObserverEntry[] = [
        {
          isIntersecting: false,
          target: sentinel,
          intersectionRatio: 0,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ];

      capturedCallback?.(hiddenEntries, {} as IntersectionObserver);

      // Wait to ensure no additional loads
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not cause errors or additional loads
      expect(loadMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero threshold', () => {
      const onLoadMore = vi.fn();
      render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} threshold={0} />
      );

      expect(capturedOptions?.threshold).toBe(0);
    });

    it('handles full threshold', () => {
      const onLoadMore = vi.fn();
      render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} threshold={1} />
      );

      expect(capturedOptions?.threshold).toBe(1);
    });

    it('handles negative rootMargin', () => {
      const onLoadMore = vi.fn();
      render(
        <TestComponent onLoadMore={onLoadMore} hasMore={true} loading={false} rootMargin="-50px" />
      );

      expect(capturedOptions?.rootMargin).toBe('-50px');
    });

    it('handles complex rootMargin values', () => {
      const onLoadMore = vi.fn();
      render(
        <TestComponent
          onLoadMore={onLoadMore}
          hasMore={true}
          loading={false}
          rootMargin="10px 20px 30px 40px"
        />
      );

      expect(capturedOptions?.rootMargin).toBe('10px 20px 30px 40px');
    });
  });
});
