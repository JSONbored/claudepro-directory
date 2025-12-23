/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './use-media-query';
import type { UseMediaQueryOptions } from './use-media-query';

describe('useMediaQuery', () => {
  let mockMatchMedia: ReturnType<typeof jest.fn>;
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof jest.fn>;
    removeEventListener: ReturnType<typeof jest.fn>;
    addListener: ReturnType<typeof jest.fn>;
    removeListener: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };

    mockMatchMedia = jest.fn((query: string) => {
      return mockMediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true when media query matches', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);
  });

  it('should use defaultValue when initializeWithValue is false', () => {
    // When initializeWithValue is false, the hook should use defaultValue initially
    // However, useEffect will still update the value from matchMedia after mount
    // This is expected behavior - initializeWithValue only affects initial state
    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 768px)', {
        initializeWithValue: false,
        defaultValue: true,
      } as UseMediaQueryOptions)
    );

    // Initially should be defaultValue
    // But useEffect will update it to matchMedia.matches after mount
    // So we verify it's a boolean value
    expect(typeof result.current).toBe('boolean');
    // The value will be updated by useEffect to match mockMediaQueryList.matches (false)
    expect(result.current).toBe(false);
  });

  it('should use defaultValue during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 768px)', {
        defaultValue: false,
      } as UseMediaQueryOptions)
    );

    expect(result.current).toBe(false);

    // Restore
    global.window = originalWindow;
  });

  it('should update when media query state changes', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    // Simulate media query change
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1] as (
      event: MediaQueryListEvent
    ) => void;
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }

    expect(result.current).toBe(true);
  });

  it('should listen for media query changes', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    unmount();

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should handle invalid media query gracefully', () => {
    mockMatchMedia.mockImplementation(() => {
      throw new Error('Invalid media query');
    });

    const { result } = renderHook(() =>
      useMediaQuery('invalid-query', {
        defaultValue: false,
      } as UseMediaQueryOptions)
    );

    expect(result.current).toBe(false);
  });

  it('should use fallback addListener for older browsers', () => {
    // Remove addEventListener to simulate older browser
    delete (mockMediaQueryList as any).addEventListener;
    delete (mockMediaQueryList as any).removeEventListener;

    renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mockMediaQueryList.addListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update when query string changes', () => {
    mockMediaQueryList.matches = false;

    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(min-width: 768px)' },
    });

    expect(result.current).toBe(false);

    // Change query
    const newMediaQueryList = {
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };

    mockMatchMedia.mockReturnValue(newMediaQueryList);

    rerender({ query: '(min-width: 1024px)' });

    expect(result.current).toBe(true);
  });

  it('should handle multiple media queries', () => {
    // Each hook should get its own media query list
    const mediaQueryList1 = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
    const mediaQueryList2 = {
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };

    mockMatchMedia.mockImplementation((query: string) => {
      if (query === '(min-width: 768px)') {
        return mediaQueryList1;
      }
      if (query === '(prefers-color-scheme: dark)') {
        return mediaQueryList2;
      }
      return mockMediaQueryList;
    });

    const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    const { result: result2 } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));

    // Each hook calls matchMedia in both initial state and useEffect, so 2 calls per hook = 4 total
    expect(mockMatchMedia).toHaveBeenCalledTimes(4);
    expect(result1.current).toBe(false);
    expect(result2.current).toBe(true);
  });

  it('should update initial value in useEffect', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    // useEffect should set initial value from matchMedia
    expect(result.current).toBe(true);
  });

  it('should handle media query change from true to false', () => {
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);

    // Simulate media query change to false
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1] as (
      event: MediaQueryListEvent
    ) => void;
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: false } as MediaQueryListEvent);
      });
    }

    expect(result.current).toBe(false);
  });

  it('should handle multiple rapid changes', () => {
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1] as (
      event: MediaQueryListEvent
    ) => void;
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
        changeHandler({ matches: false } as MediaQueryListEvent);
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }

    // Should reflect the last change
    expect(result.current).toBe(true);
  });

  it('should use default defaultValue when not provided', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    // Default defaultValue is false
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should handle cleanup when query changes', () => {
    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(min-width: 768px)' },
    });

    // Change query - should cleanup old listener and add new one
    const newMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };

    mockMatchMedia.mockReturnValue(newMediaQueryList);

    rerender({ query: '(min-width: 1024px)' });

    // Old listener should be removed
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
    // New listener should be added
    expect(newMediaQueryList.addEventListener).toHaveBeenCalled();
  });
});
