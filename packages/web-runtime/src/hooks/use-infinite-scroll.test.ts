/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from './use-infinite-scroll';
import type { UseInfiniteScrollOptions } from './use-infinite-scroll';

// Mock dependencies
let mockSetTrue: ReturnType<typeof jest.fn>;
let mockSetFalse: ReturnType<typeof jest.fn>;
let mockIsLoading = false;

jest.mock('./use-boolean', () => ({
  useBoolean: jest.fn(() => {
    // Return object with getter for value to get current mockIsLoading
    const mockBoolean = {
      get value() {
        return mockIsLoading;
      },
      setTrue: mockSetTrue,
      setFalse: mockSetFalse,
      toggle: jest.fn(),
    };
    return mockBoolean;
  }),
}));

let mockIsIntersecting = false;
let mockOnChange: ((isIntersecting: boolean) => void) | null = null;

jest.mock('./use-intersection-observer', () => ({
  useIntersectionObserver: jest.fn((options: any) => {
    mockOnChange = options.onChange;
    return {
      ref: jest.fn((node: HTMLElement | null) => {}),
      isIntersecting: mockIsIntersecting,
    };
  }),
}));

jest.mock('../config/static-configs', () => ({
  getHomepageConfigBundle: jest.fn(() => ({
    appSettings: {
      'hooks.infinite_scroll.batch_size': 30,
      'hooks.infinite_scroll.threshold': 0.1,
    },
  })),
  getTimeoutConfig: jest.fn(() => ({
    'timeout.ui.transition_ms': 200,
  })),
}));

jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIsLoading = false;
    mockIsIntersecting = false;
    mockOnChange = null;
    mockSetTrue = jest.fn(() => {
      mockIsLoading = true;
    });
    mockSetFalse = jest.fn(() => {
      mockIsLoading = false;
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize with batchSize items', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({ totalItems: 100 } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30); // Default batchSize
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it('should use custom batchSize', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 20,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(20);
  });

  it('should set hasMore to false when all items are displayed', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 30,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.hasMore).toBe(false);
  });

  it('should load more when sentinel becomes visible', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30);

    // Simulate sentinel becoming visible
    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200); // transition_ms delay
    });

    expect(result.current.displayCount).toBe(60);
  });

  it('should not load more when already loading', () => {
    mockIsLoading = true;

    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    const initialCount = result.current.displayCount;

    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should not have increased
    expect(result.current.displayCount).toBe(initialCount);
  });

  it('should not load more when hasMore is false', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 30,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.hasMore).toBe(false);

    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.displayCount).toBe(30);
  });

  it('should not exceed totalItems', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 50,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30);

    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should be 50 (totalItems), not 60
    expect(result.current.displayCount).toBe(50);
  });

  it('should reset to initial batchSize', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.displayCount).toBe(60);

    act(() => {
      result.current.reset();
    });

    expect(result.current.displayCount).toBe(30);
  });

  it('should set isLoading during load', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    expect(mockSetTrue).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockSetFalse).toHaveBeenCalled();
  });

  it('should use custom rootMargin', () => {
    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        rootMargin: '1000px',
      } as UseInfiniteScrollOptions)
    );

    const { useIntersectionObserver } = jest.requireMock('./use-intersection-observer');
    expect(useIntersectionObserver).toHaveBeenCalledWith(
      expect.objectContaining({
        rootMargin: '1000px',
      })
    );
  });

  it('should use custom threshold', () => {
    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        threshold: 0.5,
      } as UseInfiniteScrollOptions)
    );

    const { useIntersectionObserver } = jest.requireMock('./use-intersection-observer');
    expect(useIntersectionObserver).toHaveBeenCalledWith(
      expect.objectContaining({
        threshold: 0.5,
      })
    );
  });

  it('should validate threshold and use default if invalid', () => {
    const { logger } = jest.requireMock('../logger');

    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        threshold: 1.5, // Invalid (> 1)
      } as UseInfiniteScrollOptions)
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'useInfiniteScroll',
        receivedThreshold: 1.5,
        usingDefault: 0.1,
      }),
      'Invalid threshold for infinite scroll'
    );
  });

  it('should validate threshold and use default if negative', () => {
    const { logger } = jest.requireMock('../logger');

    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        threshold: -0.5, // Invalid (< 0)
      } as UseInfiniteScrollOptions)
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'useInfiniteScroll',
        receivedThreshold: -0.5,
        usingDefault: 0.1,
      }),
      'Invalid threshold for infinite scroll'
    );
  });

  it('should return sentinelRef function', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({ totalItems: 100 } as UseInfiniteScrollOptions)
    );

    expect(typeof result.current.sentinelRef).toBe('function');
  });

  it('should load multiple batches sequentially', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30);

    // First load
    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.displayCount).toBe(60);

    // Second load
    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.displayCount).toBe(90);
  });

  it('should handle zero totalItems', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 0,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30);
    expect(result.current.hasMore).toBe(false);
  });

  it('should handle totalItems less than batchSize', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 10,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30);
    expect(result.current.hasMore).toBe(false);
  });

  it('should use config default batchSize when not provided', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        // batchSize not provided - should use config default (30)
      } as UseInfiniteScrollOptions)
    );

    expect(result.current.displayCount).toBe(30);
  });

  it('should use config default threshold when not provided', () => {
    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        // threshold not provided - should use config default (0.1)
      } as UseInfiniteScrollOptions)
    );

    const { useIntersectionObserver } = jest.requireMock('./use-intersection-observer');
    expect(useIntersectionObserver).toHaveBeenCalledWith(
      expect.objectContaining({
        threshold: 0.1,
      })
    );
  });

  it('should use default rootMargin when not provided', () => {
    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        // rootMargin not provided - should use default ('600px')
      } as UseInfiniteScrollOptions)
    );

    const { useIntersectionObserver } = jest.requireMock('./use-intersection-observer');
    expect(useIntersectionObserver).toHaveBeenCalledWith(
      expect.objectContaining({
        rootMargin: '600px',
      })
    );
  });

  it('should handle custom root element', () => {
    const customRoot = document.createElement('div');

    renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        root: customRoot,
      } as UseInfiniteScrollOptions)
    );

    const { useIntersectionObserver } = jest.requireMock('./use-intersection-observer');
    expect(useIntersectionObserver).toHaveBeenCalledWith(
      expect.objectContaining({
        root: customRoot,
      })
    );
  });

  it('should not load more when sentinel becomes invisible', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    const initialCount = result.current.displayCount;

    act(() => {
      if (mockOnChange) {
        mockOnChange(false); // Sentinel becomes invisible
      }
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should not have increased
    expect(result.current.displayCount).toBe(initialCount);
  });

  it('should handle intersection becoming invisible', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    // Intersection becomes visible, triggers load
    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    // Intersection becomes invisible (should not trigger load)
    act(() => {
      if (mockOnChange) {
        mockOnChange(false);
      }
    });

    // Complete the load
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should have loaded once
    expect(result.current.displayCount).toBe(60);
  });

  it('should reset isLoading state after load', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    act(() => {
      if (mockOnChange) {
        mockOnChange(true);
      }
    });

    expect(mockSetTrue).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockSetFalse).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle reset when already at initial state', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    const initialCount = result.current.displayCount;

    act(() => {
      result.current.reset();
    });

    expect(result.current.displayCount).toBe(initialCount);
    expect(mockSetFalse).toHaveBeenCalled();
  });

  it('should handle reset after multiple loads', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        totalItems: 100,
        batchSize: 30,
      } as UseInfiniteScrollOptions)
    );

    // Load multiple batches
    for (let i = 0; i < 3; i++) {
      act(() => {
        if (mockOnChange) {
          mockOnChange(true);
        }
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });
    }

    expect(result.current.displayCount).toBeGreaterThan(30);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.displayCount).toBe(30);
  });
});
