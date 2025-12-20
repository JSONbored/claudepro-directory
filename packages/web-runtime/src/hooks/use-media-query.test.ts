import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './use-media-query';
import type { UseMediaQueryOptions } from './use-media-query';

describe('useMediaQuery', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };

    mockMatchMedia = vi.fn((query: string) => {
      return mockMediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 768px)', {
        initializeWithValue: false,
        defaultValue: true,
      } as UseMediaQueryOptions)
    );

    expect(result.current).toBe(true);
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
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0]?.[1];
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
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(newMediaQueryList);

    rerender({ query: '(min-width: 1024px)' });

    expect(result.current).toBe(true);
  });

  it('should handle multiple media queries', () => {
    const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    const { result: result2 } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));

    expect(mockMatchMedia).toHaveBeenCalledTimes(2);
    expect(result1.current).toBeDefined();
    expect(result2.current).toBeDefined();
  });
});
