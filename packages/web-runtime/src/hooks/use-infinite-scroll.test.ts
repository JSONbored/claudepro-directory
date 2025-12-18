import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from './use-infinite-scroll';
import type { UseInfiniteScrollOptions } from './use-infinite-scroll';

// Mock dependencies
const mockSetTrue = vi.fn();
const mockSetFalse = vi.fn();
let mockIsLoading = false;

vi.mock('./use-boolean', () => ({
  useBoolean: vi.fn(() => ({
    value: () => mockIsLoading,
    setTrue: mockSetTrue,
    setFalse: mockSetFalse,
    toggle: vi.fn(),
  })),
}));

let mockIsIntersecting = false;
let mockOnChange: ((isIntersecting: boolean) => void) | null = null;

vi.mock('./use-intersection-observer', () => ({
  useIntersectionObserver: vi.fn((options: any) => {
    mockOnChange = options.onChange;
    return {
      ref: vi.fn((node: HTMLElement | null) => {}),
      isIntersecting: mockIsIntersecting,
    };
  }),
}));

vi.mock('../config/static-configs', () => ({
  getHomepageConfigBundle: vi.fn(() => ({
    appSettings: {
      'hooks.infinite_scroll.batch_size': 30,
      'hooks.infinite_scroll.threshold': 0.1,
    },
  })),
  getTimeoutConfig: vi.fn(() => ({
    'timeout.ui.transition_ms': 200,
  })),
}));

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsLoading = false;
    mockIsIntersecting = false;
    mockOnChange = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      vi.advanceTimersByTime(200); // transition_ms delay
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
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(200);
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
      vi.advanceTimersByTime(200);
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

    const { useIntersectionObserver } = require('./use-intersection-observer');
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

    const { useIntersectionObserver } = require('./use-intersection-observer');
    expect(useIntersectionObserver).toHaveBeenCalledWith(
      expect.objectContaining({
        threshold: 0.5,
      })
    );
  });

  it('should validate threshold and use default if invalid', () => {
    const { logger } = require('../logger');

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

  it('should return sentinelRef function', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({ totalItems: 100 } as UseInfiniteScrollOptions)
    );

    expect(typeof result.current.sentinelRef).toBe('function');
  });
});
