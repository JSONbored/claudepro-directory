import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './use-theme';

describe('useTheme', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockMediaQueryList: { matches: boolean };
  let mockMutationObserver: any;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock matchMedia
    mockMediaQueryList = {
      matches: false,
    };

    mockMatchMedia = vi.fn((query: string) => {
      if (query === '(prefers-color-scheme: dark)') {
        return mockMediaQueryList;
      }
      return { matches: false } as MediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true,
    });

    // Mock MutationObserver
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    mockMutationObserver = vi.fn((callback: MutationCallback) => {
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        callback, // Store callback for manual triggering in tests
      };
    });

    global.MutationObserver = mockMutationObserver as any;

    // Reset document.documentElement
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should read data-theme attribute from document root', () => {
    document.documentElement.setAttribute('data-theme', 'dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('dark');
  });

  it('should return light when data-theme is light', () => {
    document.documentElement.setAttribute('data-theme', 'light');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('light');
  });

  it('should fallback to prefers-color-scheme when data-theme is not set', () => {
    document.documentElement.removeAttribute('data-theme');
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('dark');
  });

  it('should fallback to light when prefers-color-scheme is light and data-theme is not set', () => {
    document.documentElement.removeAttribute('data-theme');
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('light');
  });

  it('should observe data-theme attribute changes', () => {
    renderHook(() => useTheme());

    expect(mockObserve).toHaveBeenCalledWith(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  });

  it('should update theme when data-theme attribute changes', () => {
    document.documentElement.setAttribute('data-theme', 'light');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('light');

    // Get the MutationObserver callback
    const observerInstance = mockMutationObserver.mock.results[0]?.value;
    const callback = observerInstance?.callback;

    // Simulate attribute change
    act(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (callback) {
        callback(
          [
            {
              type: 'attributes',
              attributeName: 'data-theme',
              target: document.documentElement,
            } as MutationRecord,
          ],
          observerInstance
        );
      }
    });

    expect(result.current).toBe('dark');
  });

  it('should handle invalid data-theme values gracefully', () => {
    document.documentElement.setAttribute('data-theme', 'invalid');
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useTheme());

    // Should fallback to prefers-color-scheme
    expect(result.current).toBe('light');
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useTheme());

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useTheme());

    // Should default to 'dark' in SSR
    expect(result.current).toBe('dark');

    // Restore
    global.window = originalWindow;
  });

  it('should handle matchMedia error gracefully', () => {
    document.documentElement.removeAttribute('data-theme');
    mockMatchMedia.mockImplementation(() => {
      throw new Error('matchMedia not supported');
    });

    const { result } = renderHook(() => useTheme());

    // Should default to 'light' when matchMedia fails
    expect(result.current).toBe('light');
  });

  it('should ignore non-data-theme attribute changes', () => {
    document.documentElement.setAttribute('data-theme', 'light');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('light');

    // Get the MutationObserver callback
    const observerInstance = mockMutationObserver.mock.results[0]?.value;
    const callback = observerInstance?.callback;

    // Simulate non-data-theme attribute change
    act(() => {
      document.documentElement.setAttribute('data-other', 'value');
      if (callback) {
        callback(
          [
            {
              type: 'attributes',
              attributeName: 'data-other',
              target: document.documentElement,
            } as MutationRecord,
          ],
          observerInstance
        );
      }
    });

    // Should not change
    expect(result.current).toBe('light');
  });
});
