import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle } from './use-toggle.ts';

describe('useToggle', () => {
  it('should initialize with default value (false)', () => {
    const [value] = renderHook(() => useToggle()).result.current;

    expect(value).toBe(false);
  });

  it('should initialize with custom default value', () => {
    const [value] = renderHook(() => useToggle(true)).result.current;

    expect(value).toBe(true);
  });

  it('should throw error for non-boolean defaultValue', () => {
    expect(() => {
      renderHook(() => useToggle('invalid' as any));
    }).toThrow('useToggle: defaultValue must be a boolean');
  });

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false));
    const [, toggle] = result.current;

    act(() => {
      toggle();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      toggle();
    });

    expect(result.current[0]).toBe(false);
  });

  it('should use setValue directly', () => {
    const { result } = renderHook(() => useToggle(false));
    const [, , setValue] = result.current;

    act(() => {
      setValue(true);
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      setValue((prev) => !prev);
    });

    expect(result.current[0]).toBe(false);
  });

  it('should maintain stable toggle function reference', () => {
    const { result, rerender } = renderHook(() => useToggle());
    const [, firstToggle] = result.current;

    rerender();

    expect(result.current[1]).toBe(firstToggle);
  });
});
