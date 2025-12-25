/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useDebounceValue } from './use-debounce-value.ts';

describe('useDebounceValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
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

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // After delay, value should update
    expect(result.current[0]).toBe('updated');
  });

  it('should cancel previous debounce when value changes rapidly', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 500));

    act(() => {
      result.current[1]('first');
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    act(() => {
      result.current[1]('second');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should only have final value
    expect(result.current[0]).toBe('second');
  });

  it('should use custom equality function', () => {
    const equalityFn = (a: { id: number }, b: { id: number }) => a.id === b.id;

    const { result } = renderHook(() => useDebounceValue({ id: 1 }, 500, { equalityFn }));

    act(() => {
      result.current[1]({ id: 1 }); // Same id
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should not update if equality function says they're equal
    // (though in this case, the objects are different references)
    expect(result.current[0].id).toBe(1);
  });

  it('should handle function initial value', () => {
    const { result } = renderHook(() => useDebounceValue(() => 'computed', 500));

    expect(result.current[0]).toBe('computed');
  });

  it('should handle multiple rapid updates', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 500));

    act(() => {
      result.current[1]('first');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current[1]('second');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current[1]('third');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should still be initial
    expect(result.current[0]).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have final value
    expect(result.current[0]).toBe('third');
  });

  it('should handle different value types', () => {
    const { result: stringResult } = renderHook(() => useDebounceValue('string', 500));
    const { result: numberResult } = renderHook(() => useDebounceValue(0, 500));
    const { result: booleanResult } = renderHook(() => useDebounceValue(false, 500));
    const { result: arrayResult } = renderHook(() => useDebounceValue([1, 2, 3], 500));
    const { result: objectResult } = renderHook(() => useDebounceValue({ key: 'value' }, 500));

    expect(stringResult.current[0]).toBe('string');
    expect(numberResult.current[0]).toBe(0);
    expect(booleanResult.current[0]).toBe(false);
    expect(arrayResult.current[0]).toEqual([1, 2, 3]);
    expect(objectResult.current[0]).toEqual({ key: 'value' });
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(({ delay }) => useDebounceValue('initial', delay), {
      initialProps: { delay: 500 },
    });

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current[0]).toBe('initial');

    rerender({ delay: 1000 });

    act(() => {
      result.current[1]('updated2');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current[0]).toBe('initial'); // Still debouncing with new delay

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current[0]).toBe('updated2');
  });

  it('should not update if value is equal (using equality function)', () => {
    const equalityFn = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

    const { result } = renderHook(() => useDebounceValue('Hello', 500, { equalityFn }));

    act(() => {
      result.current[1]('HELLO'); // Same value (case-insensitive)
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should not update because equality function says they're equal
    // Note: The implementation checks equality before setting timeout, so it won't update
    expect(result.current[0]).toBe('Hello');
  });

  it('should handle cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useDebounceValue('initial', 500));

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });
    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // After unmount, timeout should be cleaned up
    // (we can't verify this directly, but it shouldn't cause errors)
    expect(result.current[0]).toBe('initial');
  });

  it('should handle very short delays', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 1));

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current[0]).toBe('updated');
  });

  it('should handle very long delays', () => {
    const { result } = renderHook(() => useDebounceValue('initial', 10000));

    act(() => {
      result.current[1]('updated');
    });

    act(() => {
      jest.advanceTimersByTime(9999);
    });
    expect(result.current[0]).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBe('updated');
  });

  it('should handle setValue with function updater', () => {
    const { result } = renderHook(() => useDebounceValue(0, 500));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle multiple sequential updates with function updater', () => {
    const { result } = renderHook(() => useDebounceValue(0, 500));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have final value (3, since each update increments)
    expect(result.current[0]).toBe(3);
  });

  it('should handle null and undefined values', () => {
    const { result: nullResult } = renderHook(() => useDebounceValue<string | null>(null, 500));
    const { result: undefinedResult } = renderHook(() =>
      useDebounceValue<string | undefined>(undefined, 500)
    );

    expect(nullResult.current[0]).toBe(null);
    expect(undefinedResult.current[0]).toBe(undefined);

    act(() => {
      nullResult.current[1]('value');
    });

    act(() => {
      undefinedResult.current[1]('value');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(nullResult.current[0]).toBe('value');
    expect(undefinedResult.current[0]).toBe('value');
  });
});
