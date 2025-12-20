import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnimationFrame } from './use-animation-frame';

// Mock motion/react - use vi.hoisted() for variables used in vi.mock()
const mockUseAnimationFrame = vi.hoisted(() => vi.fn());

vi.mock('motion/react', () => ({
  useAnimationFrame: mockUseAnimationFrame,
}));

describe('useAnimationFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call motion/react useAnimationFrame when callback is provided', () => {
    const callback = vi.fn();

    renderHook(() => useAnimationFrame(callback));

    expect(mockUseAnimationFrame).toHaveBeenCalledWith(callback);
  });

  it('should not call motion/react useAnimationFrame when callback is undefined', () => {
    renderHook(() => useAnimationFrame(undefined));

    expect(mockUseAnimationFrame).not.toHaveBeenCalled();
  });

  it('should handle callback changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(({ cb }) => useAnimationFrame(cb), {
      initialProps: { cb: callback1 },
    });

    expect(mockUseAnimationFrame).toHaveBeenCalledWith(callback1);

    rerender({ cb: callback2 });

    expect(mockUseAnimationFrame).toHaveBeenCalledWith(callback2);
  });
});
