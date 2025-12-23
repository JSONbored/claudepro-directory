/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useBoolean } from './use-boolean.ts';

describe('useBoolean', () => {
  it('should initialize with default value (false)', () => {
    const { result } = renderHook(() => useBoolean());

    expect(result.current.value).toBe(false);
  });

  it('should initialize with custom default value', () => {
    const { result } = renderHook(() => useBoolean(true));

    expect(result.current.value).toBe(true);
  });

  it('should throw error for non-boolean defaultValue', () => {
    expect(() => {
      renderHook(() => useBoolean('invalid' as any));
    }).toThrow('useBoolean: defaultValue must be a boolean');
  });

  it('should set value to true with setTrue', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current.setTrue();
    });

    expect(result.current.value).toBe(true);
  });

  it('should set value to false with setFalse', () => {
    const { result } = renderHook(() => useBoolean(true));

    act(() => {
      result.current.setFalse();
    });

    expect(result.current.value).toBe(false);
  });

  it('should toggle value with toggle', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(false);
  });

  it('should use setValue directly', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current.setValue(true);
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.setValue((prev) => !prev);
    });

    expect(result.current.value).toBe(false);
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useBoolean());

    const firstSetTrue = result.current.setTrue;
    const firstSetFalse = result.current.setFalse;
    const firstToggle = result.current.toggle;

    rerender();

    expect(result.current.setTrue).toBe(firstSetTrue);
    expect(result.current.setFalse).toBe(firstSetFalse);
    expect(result.current.toggle).toBe(firstToggle);
  });
});
