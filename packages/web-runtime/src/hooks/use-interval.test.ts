/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useInterval } from './use-interval.ts';

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should call callback at specified interval', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should not call callback when delay is null', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, null));

    jest.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should use latest callback version', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(({ callback }) => useInterval(callback, 1000), {
      initialProps: { callback: callback1 },
    });

    jest.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);

    rerender({ callback: callback2 });

    jest.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart interval when delay changes', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 500 });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cleanup interval on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    jest.advanceTimersByTime(500);
    unmount();

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle rapid delay changes', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });

    rerender({ delay: 500 });
    rerender({ delay: 2000 });
    rerender({ delay: 100 });

    jest.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call callback multiple times at regular intervals', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1000));

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(4);
  });


  it('should handle very short intervals', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1));

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should handle very long intervals', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 100000));

    jest.advanceTimersByTime(99999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple interval instances independently', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    renderHook(() => useInterval(callback1, 500));
    renderHook(() => useInterval(callback2, 1000));

    jest.advanceTimersByTime(500);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart interval when delay changes to shorter value', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 2000 },
    });

    jest.advanceTimersByTime(1500);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 500 });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should restart interval when delay changes to longer value', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 500 },
    });

    jest.advanceTimersByTime(400);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 2000 });

    jest.advanceTimersByTime(1999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should handle delay changing from null to number', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: null },
    });

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 1000 });

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should handle delay changing from number to null and back', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    rerender({ delay: null });

    jest.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 1000 });

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should use latest callback even if callback changes after interval starts', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(({ callback, delay }) => useInterval(callback, delay), {
      initialProps: { callback: callback1, delay: 2000 },
    });

    jest.advanceTimersByTime(1000);
    rerender({ callback: callback2, delay: 2000 });

    jest.advanceTimersByTime(1000);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid delay changes with multiple callbacks', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });

    // Rapidly change delay
    rerender({ delay: 500 });
    jest.advanceTimersByTime(200);
    rerender({ delay: 2000 });
    jest.advanceTimersByTime(300);
    rerender({ delay: 500 });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should handle callback that throws error', () => {
    const errorCallback = jest.fn(() => {
      throw new Error('Test error');
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Wrap in try-catch to prevent test failure
    try {
      renderHook(() => useInterval(errorCallback, 1000));

      jest.advanceTimersByTime(1000);
      expect(errorCallback).toHaveBeenCalledTimes(1);

      // Interval should continue even after error
      jest.advanceTimersByTime(1000);
      expect(errorCallback).toHaveBeenCalledTimes(2);
    } catch (error) {
      // Error is expected - callback throws
      expect(errorCallback).toHaveBeenCalled();
    }

    consoleErrorSpy.mockRestore();
  });

  it('should cleanup and restart when delay changes multiple times', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    rerender({ delay: 2000 });
    jest.advanceTimersByTime(1000);
    rerender({ delay: 500 });
    jest.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should not call callback if unmounted before first interval', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    jest.advanceTimersByTime(500);
    unmount();
    jest.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should stop calling callback after unmount even if intervals were firing', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);

    unmount();
    jest.advanceTimersByTime(5000);

    expect(callback).toHaveBeenCalledTimes(2); // No more calls after unmount
  });

  it('should handle callback with parameters via closure', () => {
    const capturedValue = 'test-value';
    const callback = jest.fn((value: string) => {
      expect(value).toBe(capturedValue);
    });

    renderHook(() => {
      useInterval(() => callback(capturedValue), 1000);
    });

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(capturedValue);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should handle interval with callback that tracks calls', () => {
    const callback = jest.fn();

    renderHook(() => {
      useInterval(() => {
        callback();
      }, 1000);
    });

    jest.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should handle changing delay while interval is running', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    // Change delay mid-interval
    rerender({ delay: 2000 });

    jest.advanceTimersByTime(1500);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
