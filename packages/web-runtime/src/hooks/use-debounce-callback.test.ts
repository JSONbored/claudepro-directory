import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebounceCallback } from './use-debounce-callback.ts';

describe('useDebounceCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    result.current('arg1');
    result.current('arg2');
    result.current('arg3');

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });

  it('should cancel pending calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    result.current('arg1');
    result.current.cancel();

    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should flush pending calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    result.current('arg1');
    result.current.flush();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('should check if pending', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    expect(result.current.isPending()).toBe(false);

    result.current('arg1');

    expect(result.current.isPending()).toBe(true);

    vi.advanceTimersByTime(500);

    expect(result.current.isPending()).toBe(false);
  });

  it('should handle leading edge execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500, { leading: true }));

    result.current('arg1');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('should handle maxWait option', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 1000, { maxWait: 2000 }));

    result.current('arg1');

    vi.advanceTimersByTime(2000);

    expect(callback).toHaveBeenCalled();
  });
});
