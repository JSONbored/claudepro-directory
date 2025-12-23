/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { usePrefetchOnHover, useBatchPrefetch } from './use-prefetch-on-hover';
import type { UsePrefetchOnHoverOptions } from './use-prefetch-on-hover';

// Mock Next.js router
const mockPrefetch = jest.fn();
const mockRouter = {
  prefetch: mockPrefetch,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock config
jest.mock('../config/static-configs', () => ({
  getTimeoutConfig: jest.fn(() => ({
    'timeout.ui.prefetch_delay_ms': 300,
  })),
}));

// Mock logger
jest.mock('../errors', () => ({
  logClientWarning: jest.fn(),
}));

describe('usePrefetchOnHover', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPrefetch.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should return event handlers', () => {
    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    expect(typeof result.current.handleMouseEnter).toBe('function');
    expect(typeof result.current.handleMouseLeave).toBe('function');
    expect(typeof result.current.handleTouchStart).toBe('function');
  });

  it('should prefetch after delay on mouse enter', () => {
    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleMouseEnter();
    });

    expect(mockPrefetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockPrefetch).toHaveBeenCalledWith('/test');
  });

  it('should cancel prefetch on mouse leave before delay', () => {
    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      jest.advanceTimersByTime(150); // Halfway through delay
    });

    act(() => {
      result.current.handleMouseLeave();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('should prefetch immediately on touch start', () => {
    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleTouchStart();
    });

    expect(mockPrefetch).toHaveBeenCalledWith('/test');
  });

  it('should not prefetch twice', () => {
    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockPrefetch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleMouseEnter(); // Try again
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not prefetch again
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
  });

  it('should not prefetch when disabled', () => {
    const { result } = renderHook(() =>
      usePrefetchOnHover('/test', { disabled: true } as UsePrefetchOnHoverOptions)
    );

    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('should use custom delay', () => {
    const { result } = renderHook(() =>
      usePrefetchOnHover('/test', { delay: 500 } as UsePrefetchOnHoverOptions)
    );

    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200); // Complete 500ms delay
    });

    expect(mockPrefetch).toHaveBeenCalledWith('/test');
  });

  it('should handle prefetch errors gracefully', async () => {
    const { logClientWarning } = await import('../errors');
    mockPrefetch.mockImplementation(() => {
      throw new Error('Prefetch failed');
    });

    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(logClientWarning).toHaveBeenCalledWith(
      'usePrefetchOnHover: prefetch failed',
      expect.any(Error)
    );
  });

  it('should cancel previous timeout on new mouse enter', () => {
    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    act(() => {
      result.current.handleMouseEnter(); // New enter
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should only prefetch once (after second enter completes)
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
  });

  it('should handle touch start errors gracefully', async () => {
    const { logClientWarning } = await import('../errors');
    mockPrefetch.mockImplementation(() => {
      throw new Error('Touch prefetch failed');
    });

    const { result } = renderHook(() => usePrefetchOnHover('/test'));

    act(() => {
      result.current.handleTouchStart();
    });

    expect(logClientWarning).toHaveBeenCalledWith(
      'usePrefetchOnHover: touch prefetch failed',
      expect.any(Error)
    );
  });
});

describe('useBatchPrefetch', () => {
  beforeEach(() => {
    mockPrefetch.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should prefetch multiple URLs', () => {
    const { result } = renderHook(() => useBatchPrefetch());

    act(() => {
      result.current(['/page1', '/page2', '/page3']);
    });

    expect(mockPrefetch).toHaveBeenCalledTimes(3);
    expect(mockPrefetch).toHaveBeenCalledWith('/page1');
    expect(mockPrefetch).toHaveBeenCalledWith('/page2');
    expect(mockPrefetch).toHaveBeenCalledWith('/page3');
  });

  it('should handle prefetch errors for individual URLs', async () => {
    const { logClientWarning } = await import('../errors');
    mockPrefetch
      .mockImplementationOnce(() => {}) // First succeeds
      .mockImplementationOnce(() => {
        throw new Error('Prefetch failed');
      }) // Second fails
      .mockImplementationOnce(() => {}); // Third succeeds

    const { result } = renderHook(() => useBatchPrefetch());

    act(() => {
      result.current(['/page1', '/page2', '/page3']);
    });

    expect(mockPrefetch).toHaveBeenCalledTimes(3);
    expect(logClientWarning).toHaveBeenCalledWith(
      'useBatchPrefetch: prefetch failed for URL',
      expect.any(Error),
      { url: '/page2' }
    );
  });

  it('should handle empty array', () => {
    const { result } = renderHook(() => useBatchPrefetch());

    act(() => {
      result.current([]);
    });

    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('should return stable function reference', () => {
    const { result, rerender } = renderHook(() => useBatchPrefetch());

    const firstBatchPrefetch = result.current;

    rerender();

    const secondBatchPrefetch = result.current;

    expect(firstBatchPrefetch).toBe(secondBatchPrefetch);
  });
});
