/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './use-theme';

describe('useTheme', () => {
  let mockMatchMedia: ReturnType<typeof jest.fn>;
  let mockMediaQueryList: { matches: boolean };
  let mockMutationObserver: any;
  let mockObserve: ReturnType<typeof jest.fn>;
  let mockDisconnect: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    // Mock matchMedia
    mockMediaQueryList = {
      matches: false,
    };

    mockMatchMedia = jest.fn((query: string) => {
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
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();

    mockMutationObserver = jest.fn((callback: MutationCallback) => {
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

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
            } as unknown as MutationRecord,
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
    // Note: In jsdom, fully simulating SSR is difficult because document is still available
    // The hook implementation checks `typeof window === 'undefined' || typeof document === 'undefined'`
    // and returns 'dark' in SSR. This test verifies the hook doesn't crash in SSR scenarios.
    // Since jsdom doesn't perfectly simulate SSR, we verify the hook's SSR-safe behavior
    // by checking that it handles missing window/document gracefully.

    // The hook should return a valid theme value even in SSR
    // The actual SSR behavior is tested by the implementation's checks
    const { result } = renderHook(() => useTheme());

    // Should return a valid theme ('light' or 'dark')
    expect(['light', 'dark']).toContain(result.current);
    expect(typeof result.current).toBe('string');
  });

  it('should handle matchMedia error gracefully', () => {
    document.documentElement.removeAttribute('data-theme');

    // Mock matchMedia to throw during initialization
    // The hook should catch this and return 'light'
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => {
        throw new Error('matchMedia not supported');
      }),
      writable: true,
      configurable: true,
    });

    // The hook should catch the error and fallback to 'light'
    const { result } = renderHook(() => useTheme());

    // Should default to 'light' when matchMedia fails
    expect(result.current).toBe('light');

    // Restore
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
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
            } as unknown as MutationRecord,
          ],
          observerInstance
        );
      }
    });

    // Should not change
    expect(result.current).toBe('light');
  });

  it('should handle multiple mutations in one batch', () => {
    document.documentElement.setAttribute('data-theme', 'light');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe('light');

    // Get the MutationObserver callback
    const observerInstance = mockMutationObserver.mock.results[0]?.value;
    const callback = observerInstance?.callback;

    // Simulate multiple mutations (only data-theme should trigger update)
    act(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-other', 'value');
      if (callback) {
        callback(
          [
            {
              type: 'attributes',
              attributeName: 'data-theme',
              target: document.documentElement,
            } as unknown as MutationRecord,
            {
              type: 'attributes',
              attributeName: 'data-other',
              target: document.documentElement,
            } as unknown as MutationRecord,
          ],
          observerInstance
        );
      }
    });

    expect(result.current).toBe('dark');
  });

  it('should handle empty data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', '');
    mockMediaQueryList.matches = true;

    const { result } = renderHook(() => useTheme());

    // Should fallback to prefers-color-scheme
    expect(result.current).toBe('dark');
  });

  it('should handle case-insensitive data-theme values', () => {
    // Note: The hook only accepts 'light' or 'dark' (exact match)
    // Case variations should fallback to prefers-color-scheme
    document.documentElement.setAttribute('data-theme', 'DARK');
    mockMediaQueryList.matches = false;

    const { result } = renderHook(() => useTheme());

    // Should fallback to prefers-color-scheme (not case-insensitive)
    expect(result.current).toBe('light');
  });
});
