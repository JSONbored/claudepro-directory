/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useDebounceCallback } from './use-debounce-callback.ts';

describe('useDebounceCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });

  it('should cancel pending calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('arg1');
      result.current.cancel();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should flush pending calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('arg1');
      result.current.flush();
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('should check if pending', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    expect(result.current.isPending()).toBe(false);

    act(() => {
      result.current('arg1');
    });

    expect(result.current.isPending()).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isPending()).toBe(false);
  });

  it('should handle leading edge execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500, { leading: true }));

    act(() => {
      result.current('arg1');
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('should handle maxWait option', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 1000, { maxWait: 2000 }));

    act(() => {
      result.current('arg1');
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(callback).toHaveBeenCalled();
  });

  it('should handle multiple rapid calls with only last one executing', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('call1');
      result.current('call2');
      result.current('call3');
      result.current('call4');
      result.current('call5');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call5');
  });

  it('should handle trailing edge execution (default)', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500, { trailing: true }));

    act(() => {
      result.current('arg1');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('should handle leading and trailing edge execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useDebounceCallback(callback, 500, { leading: true, trailing: true })
    );

    act(() => {
      result.current('arg1');
    });

    // Leading edge should execute immediately
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');

    act(() => {
      result.current('arg2');
    });

    // Should not call again immediately (leading already executed)
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Trailing edge should execute
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('arg2');
  });

  it('should handle cancel after multiple calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('call1');
      result.current('call2');
      result.current('call3');
      result.current.cancel();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
    expect(result.current.isPending()).toBe(false);
  });

  it('should handle isPending state correctly', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    expect(result.current.isPending()).toBe(false);

    act(() => {
      result.current('arg1');
    });
    expect(result.current.isPending()).toBe(true);

    act(() => {
      result.current('arg2');
    });
    expect(result.current.isPending()).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.isPending()).toBe(false);
  });

  it('should handle function with multiple arguments', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('arg1', 'arg2', 'arg3');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should handle function with return value', () => {
    const callback = jest.fn((x: number) => x * 2);
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      const returnValue = result.current(5);
      // Debounced function returns undefined until executed
      expect(returnValue).toBeUndefined();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveReturnedWith(10);
  });

  it('should handle cleanup on unmount', () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current('arg1');
    });

    expect(result.current.isPending()).toBe(true);

    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle very short delays', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 1));

    act(() => {
      result.current('arg1');
    });

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle very long delays', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 10000));

    act(() => {
      result.current('arg1');
    });

    act(() => {
      jest.advanceTimersByTime(9999);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle maxWait with rapid calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 1000, { maxWait: 2000 }));

    act(() => {
      result.current('call1');
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    act(() => {
      result.current('call2');
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    act(() => {
      result.current('call3');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // maxWait should trigger after 2000ms total
    expect(callback).toHaveBeenCalled();
  });

  it('should handle leading edge with multiple calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500, { leading: true }));

    act(() => {
      result.current('call1');
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      result.current('call2');
    });
    // Leading already executed, should not call again immediately
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    // Trailing should execute
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('call2');
  });

  it('should handle function reference changes', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { result, rerender } = renderHook(({ callback }) => useDebounceCallback(callback, 500), {
      initialProps: { callback: callback1 },
    });

    act(() => {
      result.current('arg1');
    });

    rerender({ callback: callback2 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should use latest callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith('arg1');
  });

  it('should handle delay changes', () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(({ delay }) => useDebounceCallback(callback, delay), {
      initialProps: { delay: 500 },
    });

    act(() => {
      result.current('arg1');
    });

    rerender({ delay: 1000 });

    act(() => {
      result.current('arg2');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg2');
  });
});
