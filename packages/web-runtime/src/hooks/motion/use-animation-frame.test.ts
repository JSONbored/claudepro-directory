/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useAnimationFrame } from './use-animation-frame';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockUseAnimationFrame = jest.fn();
  return {
    useAnimationFrame: mockUseAnimationFrame,
    __mockUseAnimationFrame: mockUseAnimationFrame,
  };
});

// Get mock for use in tests
const {
  useAnimationFrame: mockUseAnimationFrame,
  __mockUseAnimationFrame,
} = jest.requireMock('motion/react');
const mockUseAnimationFrameFn = __mockUseAnimationFrame || mockUseAnimationFrame;

describe('useAnimationFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should call motion/react useAnimationFrame when callback is provided', () => {
    const callback = jest.fn();

    renderHook(() => useAnimationFrame(callback));

    expect(mockUseAnimationFrameFn).toHaveBeenCalledWith(callback);
  });

  it('should not call motion/react useAnimationFrame when callback is undefined', () => {
    renderHook(() => useAnimationFrame(undefined));

    expect(mockUseAnimationFrameFn).not.toHaveBeenCalled();
  });

  it('should handle callback changes', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(({ cb }) => useAnimationFrame(cb), {
      initialProps: { cb: callback1 },
    });

    expect(mockUseAnimationFrameFn).toHaveBeenCalledWith(callback1);

    rerender({ cb: callback2 });

    expect(mockUseAnimationFrameFn).toHaveBeenCalledWith(callback2);
  });
});
