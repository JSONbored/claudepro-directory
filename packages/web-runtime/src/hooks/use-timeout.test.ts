/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useTimeout } from './use-timeout.ts';

describe('useTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should call callback after delay', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when delay is null', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, null));

    jest.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should use latest callback version', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(({ callback, delay }) => useTimeout(callback, delay), {
      initialProps: { callback: callback1, delay: 2000 },
    });

    // Change callback while timeout is still pending
    jest.advanceTimersByTime(500);
    rerender({ callback: callback2, delay: 2000 });

    // Advance to when timeout should fire
    jest.advanceTimersByTime(1500);

    // Should use latest callback (callback2), not the original (callback1)
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart timeout when delay changes', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 500 });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timeout on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    jest.advanceTimersByTime(500);
    unmount();

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should cancel timeout when delay changes to null', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    rerender({ delay: null });

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle zero delay', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 0));

    jest.advanceTimersByTime(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle very short delays', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 1));

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle very long delays', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 100000));

    jest.advanceTimersByTime(99999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback before delay completes', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 1000));

    jest.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple timeout instances independently', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    renderHook(() => useTimeout(callback1, 500));
    renderHook(() => useTimeout(callback2, 1000));

    jest.advanceTimersByTime(500);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart timeout when delay changes to shorter value', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 2000 },
    });

    jest.advanceTimersByTime(1500);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 500 });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should restart timeout when delay changes to longer value', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 500 },
    });

    jest.advanceTimersByTime(400);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 2000 });

    jest.advanceTimersByTime(1999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle delay changing from null to number', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: null },
    });

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 1000 });

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle delay changing from number to null and back', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    rerender({ delay: null });

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 1000 });

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should use latest callback even if callback changes after timeout starts', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(({ callback }) => useTimeout(callback, 1000), {
      initialProps: { callback: callback1 },
    });

    jest.advanceTimersByTime(500);
    rerender({ callback: callback2 });

    jest.advanceTimersByTime(500);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid delay changes', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 1000 },
    });

    // Rapidly change delay
    rerender({ delay: 500 });
    jest.advanceTimersByTime(200);
    rerender({ delay: 1000 });
    jest.advanceTimersByTime(300);
    rerender({ delay: 500 });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle callback that throws error', () => {
    const errorCallback = jest.fn(() => {
      throw new Error('Test error');
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Wrap in try-catch to prevent test failure
    try {
      renderHook(() => useTimeout(errorCallback, 1000));

      jest.advanceTimersByTime(1000);
      expect(errorCallback).toHaveBeenCalledTimes(1);
    } catch (error) {
      // Error is expected - callback throws
      expect(errorCallback).toHaveBeenCalledTimes(1);
    }

    consoleErrorSpy.mockRestore();
  });

  it('should cleanup and restart when delay changes multiple times', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    rerender({ delay: 2000 });
    jest.advanceTimersByTime(1000);
    rerender({ delay: 500 });
    jest.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback if unmounted before delay completes', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    jest.advanceTimersByTime(500);
    unmount();
    jest.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle callback with parameters via closure', () => {
    const capturedValue = 'test-value';
    const callback = jest.fn((value: string) => {
      expect(value).toBe(capturedValue);
    });

    renderHook(() => {
      useTimeout(() => callback(capturedValue), 1000);
    });

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(capturedValue);
  });
});
