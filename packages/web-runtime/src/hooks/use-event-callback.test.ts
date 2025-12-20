import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventCallback } from './use-event-callback';

describe('useEventCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a stable callback reference', () => {
    const fn = vi.fn((value: string) => value.toUpperCase());

    const { result, rerender } = renderHook(() => useEventCallback(fn));

    const firstCallback = result.current;

    rerender();

    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it('should call the function with arguments', () => {
    const fn = vi.fn((a: string, b: number) => `${a}-${b}`);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const result = result.current('test', 123);
      expect(result).toBe('test-123');
    });

    expect(fn).toHaveBeenCalledWith('test', 123);
  });

  it('should always use latest function version', () => {
    const fn1 = vi.fn(() => 'first');
    const fn2 = vi.fn(() => 'second');

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
    const fn = vi.fn((x: number) => x * 2);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current(5);
      expect(returnValue).toBe(10);
      expect(typeof returnValue).toBe('number');
    });
  });

  it('should handle functions with no arguments', () => {
    const fn = vi.fn(() => 'result');

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current();
      expect(returnValue).toBe('result');
    });

    expect(fn).toHaveBeenCalled();
  });

  it('should handle functions with multiple arguments', () => {
    const fn = vi.fn((a: string, b: number, c: boolean) => `${a}-${b}-${c}`);

    const { result } = renderHook(() => useEventCallback(fn));

    act(() => {
      const returnValue = result.current('a', 1, true);
      expect(returnValue).toBe('a-1-true');
    });

    expect(fn).toHaveBeenCalledWith('a', 1, true);
  });

  it('should handle async functions', async () => {
    const fn = vi.fn(async (value: string) => {
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
    const fn = vi.fn(() => {
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

    const fn = vi.fn((value: string) => value);

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

    const fn = vi.fn(() => externalValue);

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
});
