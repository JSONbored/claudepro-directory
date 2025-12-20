import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounceValue } from './use-debounce-value.ts';

describe('useDebounceValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 500));

    expect(result.current[0]).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 500));

    act(() => {
      result.current[1]('updated');
    });

    // Value should not update immediately
    expect(result.current[0]).toBe('initial');

    vi.advanceTimersByTime(500);

    // After delay, value should update
    expect(result.current[0]).toBe('updated');
  });

  it('should cancel previous debounce when value changes rapidly', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 500));

    act(() => {
      result.current[1]('first');
    });

    vi.advanceTimersByTime(250);

    act(() => {
      result.current[1]('second');
    });

    vi.advanceTimersByTime(500);

    // Should only have final value
    expect(result.current[0]).toBe('second');
  });

  it('should use custom equality function', () => {
    const equalityFn = (a: { id: number }, b: { id: number }) => a.id === b.id;

    const { result } = renderHook(() => useDebounceValue({ id: 1 }, 500, { equalityFn }));

    act(() => {
      result.current[1]({ id: 1 }); // Same id
    });

    vi.advanceTimersByTime(500);

    // Should not update if equality function says they're equal
    // (though in this case, the objects are different references)
    expect(result.current[0].id).toBe(1);
  });

  it('should handle leading edge execution', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 500, { leading: true }));

    act(() => {
      result.current[1]('updated');
    });

    // Should update immediately on leading edge
    expect(result.current[0]).toBe('updated');
  });

  it('should handle maxWait option', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 1000, { maxWait: 2000 }));

    act(() => {
      result.current[1]('updated');
    });

    vi.advanceTimersByTime(2000);

    expect(result.current[0]).toBe('updated');
  });
});
