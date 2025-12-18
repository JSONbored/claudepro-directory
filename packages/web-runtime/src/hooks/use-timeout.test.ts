import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimeout } from './use-timeout.ts';

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should call callback after delay', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, null));

    vi.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should use latest callback version', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ callback }) => useTimeout(callback, 1000),
      { initialProps: { callback: callback1 } }
    );

    vi.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    // Reset and test with new callback
    vi.clearAllTimers();
    rerender({ callback: callback2 });

    vi.advanceTimersByTime(1000);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart timeout when delay changes', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ delay }) => useTimeout(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    rerender({ delay: 500 });

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    vi.advanceTimersByTime(500);
    unmount();

    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should cancel timeout when delay changes to null', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ delay }) => useTimeout(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    vi.advanceTimersByTime(500);
    rerender({ delay: null });

    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });
});
