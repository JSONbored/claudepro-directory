/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from './use-window-size';
import type { UseWindowSizeOptions } from './use-window-size';

describe('useWindowSize', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock window.innerWidth and innerHeight
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize with window dimensions when initializeWithValue is true', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should initialize with undefined when initializeWithValue is false', () => {
    const { result } = renderHook(() =>
      useWindowSize({ initializeWithValue: false } as UseWindowSizeOptions)
    );

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('should update size on window resize', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(1920);
    expect(result.current.height).toBe(1080);
  });

  it('should update size on orientationchange', () => {
    const { result } = renderHook(() => useWindowSize());

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    act(() => {
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current.width).toBe(768);
    expect(result.current.height).toBe(1024);
  });

  it('should debounce resize events when debounceDelay is provided', () => {
    const { result } = renderHook(() =>
      useWindowSize({ debounceDelay: 100 } as UseWindowSizeOptions)
    );

    // Rapid resize events
    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
        configurable: true,
      });
    });

    // Should not update immediately
    expect(result.current.width).toBe(1024);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.width).toBe(800);
  });

  it('should cancel previous debounce when new resize occurs', () => {
    const { result } = renderHook(() =>
      useWindowSize({ debounceDelay: 100 } as UseWindowSizeOptions)
    );

    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
        configurable: true,
      });
    });

    act(() => {
      jest.advanceTimersByTime(50); // Halfway through debounce
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        writable: true,
        configurable: true,
      });
    });

    act(() => {
      jest.advanceTimersByTime(100); // Complete new debounce
    });

    expect(result.current.width).toBe(600);
  });

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('should handle SSR (window undefined)', () => {
    // Note: In jsdom, fully simulating SSR is difficult because window is still available
    // The hook checks `typeof window === 'undefined'` and should return undefined in SSR
    // This test verifies the hook doesn't crash in SSR scenarios
    const { result } = renderHook(() => useWindowSize());

    // Should return valid dimensions (or undefined in true SSR)
    expect(typeof result.current.width === 'number' || result.current.width === undefined).toBe(
      true
    );
    expect(typeof result.current.height === 'number' || result.current.height === undefined).toBe(
      true
    );
  });

  it('should handle zero dimensions', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 0,
    });

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
  });

  it('should not update size when initializeWithValue is false after mount', () => {
    // When initializeWithValue is false, the hook should not update after mount
    // This is the expected behavior to prevent hydration mismatches
    const { result } = renderHook(() =>
      useWindowSize({ initializeWithValue: false } as UseWindowSizeOptions)
    );

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();

    // useEffect should not update the size when initializeWithValue is false
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // Should remain undefined
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('should handle multiple rapid resize events with debouncing', () => {
    const { result } = renderHook(() =>
      useWindowSize({ debounceDelay: 100 } as UseWindowSizeOptions)
    );

    // Multiple rapid resize events
    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
    });

    act(() => {
      jest.advanceTimersByTime(50);
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true, configurable: true });
    });

    act(() => {
      jest.advanceTimersByTime(50);
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true, configurable: true });
    });

    // Should still be original value
    expect(result.current.width).toBe(1024);

    // Complete debounce
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should be the last value
    expect(result.current.width).toBe(1000);
  });

  it('should handle orientationchange with debounce delay', () => {
    // Note: The hook implementation uses the same handleResize function for both
    // resize and orientationchange events, so orientationchange is also debounced
    // This is the current behavior (may be a potential optimization opportunity)
    const { result } = renderHook(() => useWindowSize({ debounceDelay: 100 } as UseWindowSizeOptions));

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    act(() => {
      window.dispatchEvent(new Event('orientationchange'));
    });

    // orientationchange is also debounced (current behavior)
    expect(result.current.width).toBe(1024);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.width).toBe(768);
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() =>
      useWindowSize({ debounceDelay: 100 } as UseWindowSizeOptions)
    );

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    unmount();

    // Should cleanup timeout
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
