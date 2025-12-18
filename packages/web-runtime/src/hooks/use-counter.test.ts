import { describe, it, expect } from 'vitest';
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
});
