/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useEventCallback } from './use-event-callback';

describe('useEventCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a stable callback reference', () => {
    const fn = jest.fn((value: string) => value.toUpperCase());

    const { result, rerender } = renderHook(() => useEventCallback(fn));

    const firstCallback = result.current;

    rerender();

    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it('should call the function with arguments', () => {
    const fn = jest.fn((a: string, b: number) => `${a}-${b}`);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current('test', 123);
      expect(returnValue).toBe('test-123');
    });

    expect(fn).toHaveBeenCalledWith('test', 123);
  });

  it('should always use latest function version', () => {
    const fn1 = jest.fn(() => 'first');
    const fn2 = jest.fn(() => 'second');

    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: fn1 },
    });

    act(() => {
      result.current();
    });

    expect(fn1).toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();

    rerender({ fn: fn2 });

    act(() => {
      result.current();
    });

    expect(fn2).toHaveBeenCalled();
  });

  it('should preserve function return type', () => {
    const fn = jest.fn((x: number) => x * 2);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current(5);
      expect(returnValue).toBe(10);
      expect(typeof returnValue).toBe('number');
    });
  });

  it('should handle functions with no arguments', () => {
    const fn = jest.fn(() => 'result');

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current();
      expect(returnValue).toBe('result');
    });

    expect(fn).toHaveBeenCalled();
  });

  it('should handle functions with multiple arguments', () => {
    const fn = jest.fn((a: string, b: number, c: boolean) => `${a}-${b}-${c}`);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current('a', 1, true);
      expect(returnValue).toBe('a-1-true');
    });

    expect(fn).toHaveBeenCalledWith('a', 1, true);
  });

  it('should handle async functions', async () => {
    const fn = jest.fn(async (value: string) => {
      return Promise.resolve(value.toUpperCase());
    });

    const { result } = renderHook(() => useEventCallback(fn));

    await act(async () => {
      const returnValue = await result.current('test');
      expect(returnValue).toBe('TEST');
    });

    expect(fn).toHaveBeenCalledWith('test');
  });

  it('should handle functions that throw', () => {
    const fn = jest.fn(() => {
      throw new Error('Test error');
    });

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      expect(() => result.current()).toThrow('Test error');
    });
  });

  it('should work in SSR environment', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const fn = jest.fn((value: string) => value);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      result.current('test');
    });

    expect(fn).toHaveBeenCalledWith('test');

    // Restore
    global.window = originalWindow;
  });

  it('should maintain closure access to latest values', () => {
    let externalValue = 'initial';

    const fn = jest.fn(() => externalValue);

    const { result, rerender } = renderHook(() => useEventCallback(fn));

    act(() => {
      expect(result.current()).toBe('initial');
    });

    externalValue = 'updated';

    // Callback should use latest value even though reference didn't change
    act(() => {
      expect(result.current()).toBe('updated');
    });
  });

  it('should handle function reference changes without changing callback identity', () => {
    const fn1 = jest.fn((x: number) => x * 2);
    const fn2 = jest.fn((x: number) => x * 3);

    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: fn1 },
    });

    const firstCallback = result.current;

    act(() => {
      const value1 = result.current(5);
      expect(value1).toBe(10);
    });

    rerender({ fn: fn2 });

    const secondCallback = result.current;

    // Callback reference should remain stable
    expect(firstCallback).toBe(secondCallback);

    // But should use new function
    act(() => {
      const value2 = result.current(5);
      expect(value2).toBe(15);
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should handle null and undefined arguments', () => {
    const fn = jest.fn((a: string | null, b: number | undefined) => `${a}-${b}`);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current(null, undefined);
      expect(returnValue).toBe('null-undefined');
    });

    expect(fn).toHaveBeenCalledWith(null, undefined);
  });

  it('should handle object and array arguments', () => {
    const fn = jest.fn((obj: { id: number }, arr: number[]) => `${obj.id}-${arr.join(',')}`);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current({ id: 1 }, [1, 2, 3]);
      expect(returnValue).toBe('1-1,2,3');
    });

    expect(fn).toHaveBeenCalledWith({ id: 1 }, [1, 2, 3]);
  });

  it('should handle multiple rerenders without changing callback identity', () => {
    const fn = jest.fn((x: string) => x.toUpperCase());

    const { result, rerender } = renderHook(() => useEventCallback(fn));

    const initialCallback = result.current;

    // Multiple rerenders
    rerender();
    rerender();
    rerender();

    const finalCallback = result.current;

    expect(initialCallback).toBe(finalCallback);
  });

  it('should handle cleanup on unmount', () => {
    const fn = jest.fn((x: string) => x);

    const { result, unmount } = renderHook(() => useEventCallback(fn));

    act(() => {
      result.current('test');
    });

    unmount();

    // Callback should still work after unmount (refs persist)
    act(() => {
      result.current('after-unmount');
    });

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
