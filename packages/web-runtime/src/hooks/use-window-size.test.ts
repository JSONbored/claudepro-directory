import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from './use-window-size';
import type { UseWindowSizeOptions } from './use-window-size';

describe('useWindowSize', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
    });

    // Should not update immediately
    expect(result.current.width).toBe(1024);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.width).toBe(800);
  });

  it('should cancel previous debounce when new resize occurs', () => {
    const { result } = renderHook(() =>
      useWindowSize({ debounceDelay: 100 } as UseWindowSizeOptions)
    );

    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
    });

    act(() => {
      vi.advanceTimersByTime(50); // Halfway through debounce
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true, configurable: true });
    });

    act(() => {
      vi.advanceTimersByTime(100); // Complete new debounce
    });

    expect(result.current.width).toBe(600);
  });

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();

    // Restore
    global.window = originalWindow;
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
});
