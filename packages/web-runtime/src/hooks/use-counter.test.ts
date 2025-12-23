/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './use-counter.ts';

describe('useCounter', () => {
  it('should initialize with default value (0)', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(6);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(12);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });

  it('should use setCount directly', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.setCount(42);
    });

    expect(result.current.count).toBe(42);

    act(() => {
      result.current.setCount((prev) => prev * 2);
    });

    expect(result.current.count).toBe(84);
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useCounter());

    const firstIncrement = result.current.increment;
    const firstDecrement = result.current.decrement;
    const firstReset = result.current.reset;

    rerender();

    expect(result.current.increment).toBe(firstIncrement);
    expect(result.current.decrement).toBe(firstDecrement);
    expect(result.current.reset).toBe(firstReset);
  });

  it('should handle negative initial values', () => {
    const { result } = renderHook(() => useCounter(-5));

    expect(result.current.count).toBe(-5);
  });

  it('should handle decimal/float initial values', () => {
    const { result } = renderHook(() => useCounter(3.14));

    expect(result.current.count).toBe(3.14);
  });

  it('should handle multiple increments in sequence', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(3);
  });

  it('should handle multiple decrements in sequence', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.decrement();
      result.current.decrement();
      result.current.decrement();
    });

    expect(result.current.count).toBe(7);
  });

  it('should handle increment and decrement together', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.decrement();
    });

    expect(result.current.count).toBe(6);
  });

  it('should handle negative values after decrement', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(-1);
  });

  it('should handle increment from negative values', () => {
    const { result } = renderHook(() => useCounter(-5));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(-4);
  });

  it('should reset to negative initial value', () => {
    const { result } = renderHook(() => useCounter(-10));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(-8);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(-10);
  });

  it('should handle setCount with negative values', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.setCount(-42);
    });

    expect(result.current.count).toBe(-42);
  });

  it('should handle setCount with zero', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.setCount(0);
    });

    expect(result.current.count).toBe(0);
  });

  it('should handle setCount with decimal values', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.setCount(3.14159);
    });

    expect(result.current.count).toBe(3.14159);
  });

  it('should handle setCount function with complex calculations', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.setCount((prev) => prev * 2 + 5);
    });

    expect(result.current.count).toBe(25);
  });

  it('should handle reset after setCount', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.setCount(100);
    });

    expect(result.current.count).toBe(100);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });

  it('should handle rapid operations', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.increment();
      }
    });

    expect(result.current.count).toBe(10);

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.decrement();
      }
    });

    expect(result.current.count).toBe(5);
  });
});
