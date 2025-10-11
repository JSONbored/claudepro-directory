/**
 * Intersection Observer Hook Tests (Simplified)
 *
 * Tests for useIntersectionObserver hook focusing on core functionality.
 * Uses component rendering to properly test ref attachment.
 *
 * Coverage:
 * - Observer creation and configuration
 * - Options passing (threshold, rootMargin, root)
 * - Cleanup on unmount
 * - Browser compatibility fallback
 *
 * @see src/hooks/use-intersection-observer.ts
 */

import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIntersectionObserver } from '../use-intersection-observer';

// Test component wrapper
function TestComponent({
  options = {},
}: {
  options?: Parameters<typeof useIntersectionObserver>[0];
}): ReactElement {
  const { ref, isIntersecting } = useIntersectionObserver(options);

  return (
    <div ref={ref} data-testid="observed" data-intersecting={isIntersecting}>
      Test Element
    </div>
  );
}

// Mock IntersectionObserver
let mockDisconnect: ReturnType<typeof vi.fn>;
let mockObserve: ReturnType<typeof vi.fn>;
let capturedOptions: IntersectionObserverInit | undefined;

describe('useIntersectionObserver', () => {
  beforeEach(() => {
    mockDisconnect = vi.fn();
    mockObserve = vi.fn();
    capturedOptions = undefined;

    global.IntersectionObserver = vi.fn().mockImplementation((_callback, options) => {
      capturedOptions = options;
      return {
        observe: mockObserve,
        unobserve: vi.fn(),
        disconnect: mockDisconnect,
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('creates IntersectionObserver when element is attached', () => {
      render(<TestComponent />);

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();
    });

    it('renders element with initial not-intersecting state', () => {
      const { getByTestId } = render(<TestComponent />);
      const element = getByTestId('observed');

      expect(element.getAttribute('data-intersecting')).toBe('false');
    });

    it('attaches ref to correct element', () => {
      const { getByTestId } = render(<TestComponent />);
      const element = getByTestId('observed');

      expect(element).toBeInTheDocument();
      expect(mockObserve).toHaveBeenCalledWith(element);
    });
  });

  describe('Options Configuration', () => {
    it('passes threshold option to IntersectionObserver', () => {
      render(<TestComponent options={{ threshold: 0.5 }} />);

      expect(capturedOptions?.threshold).toBe(0.5);
    });

    it('passes rootMargin option to IntersectionObserver', () => {
      render(<TestComponent options={{ rootMargin: '50px' }} />);

      expect(capturedOptions?.rootMargin).toBe('50px');
    });

    it('passes root option to IntersectionObserver', () => {
      const rootElement = document.createElement('div');
      render(<TestComponent options={{ root: rootElement }} />);

      expect(capturedOptions?.root).toBe(rootElement);
    });

    it('passes multiple threshold values', () => {
      render(<TestComponent options={{ threshold: [0, 0.5, 1] }} />);

      expect(capturedOptions?.threshold).toEqual([0, 0.5, 1]);
    });

    it('uses default threshold when not specified', () => {
      render(<TestComponent />);

      expect(capturedOptions?.threshold).toBe(0.1);
    });

    it('uses default rootMargin when not specified', () => {
      render(<TestComponent />);

      expect(capturedOptions?.rootMargin).toBe('0px');
    });
  });

  describe('Cleanup', () => {
    it('disconnects observer on unmount', () => {
      const { unmount } = render(<TestComponent />);

      expect(mockDisconnect).not.toHaveBeenCalled();

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('creates new observer when options change', () => {
      const { rerender } = render(<TestComponent options={{ threshold: 0.1 }} />);

      const firstCallCount = (global.IntersectionObserver as unknown as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      rerender(<TestComponent options={{ threshold: 0.5 }} />);

      const secondCallCount = (global.IntersectionObserver as unknown as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });
  });

  describe('Browser Compatibility', () => {
    it('handles missing IntersectionObserver gracefully', () => {
      // Remove IntersectionObserver
      const originalIO = global.IntersectionObserver;
      // @ts-expect-error - Testing unsupported environment
      global.IntersectionObserver = undefined;

      // Should not throw
      expect(() => render(<TestComponent />)).not.toThrow();

      // Restore
      global.IntersectionObserver = originalIO;
    });
  });

  describe('Edge Cases', () => {
    it('handles zero threshold', () => {
      render(<TestComponent options={{ threshold: 0 }} />);

      expect(capturedOptions?.threshold).toBe(0);
    });

    it('handles full threshold', () => {
      render(<TestComponent options={{ threshold: 1 }} />);

      expect(capturedOptions?.threshold).toBe(1);
    });

    it('handles negative rootMargin', () => {
      render(<TestComponent options={{ rootMargin: '-50px' }} />);

      expect(capturedOptions?.rootMargin).toBe('-50px');
    });

    it('handles complex rootMargin values', () => {
      render(<TestComponent options={{ rootMargin: '10px 20px 30px 40px' }} />);

      expect(capturedOptions?.rootMargin).toBe('10px 20px 30px 40px');
    });
  });
});
