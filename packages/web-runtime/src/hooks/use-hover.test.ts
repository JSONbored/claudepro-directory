import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHover } from './use-hover.ts';

describe('useHover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false initially', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useHover(ref));

    expect(result.current).toBe(false);
  });

  it('should return true when element is hovered', () => {
    const element = document.createElement('div');
    const ref = { current: element };
    const { result } = renderHook(() => useHover(ref));

    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(result.current).toBe(true);
  });

  it('should return false when mouse leaves', () => {
    const element = document.createElement('div');
    const ref = { current: element };
    const { result } = renderHook(() => useHover(ref));

    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(result.current).toBe(true);

    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(result.current).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const element = document.createElement('div');
    const ref = { current: element };
    const removeEventListener = vi.spyOn(element, 'removeEventListener');

    const { unmount } = renderHook(() => useHover(ref));

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });
});
