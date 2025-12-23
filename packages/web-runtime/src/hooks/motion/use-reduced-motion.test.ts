/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from './use-reduced-motion';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockUseReducedMotion = jest.fn(() => false);
  return {
    useReducedMotion: mockUseReducedMotion,
    __mockUseReducedMotion: mockUseReducedMotion,
  };
});

// Get mock for use in tests
const { useReducedMotion: mockUseReducedMotion } = jest.requireMock('motion/react');
const mockUseReducedMotionFn = mockUseReducedMotion.__mockUseReducedMotion || mockUseReducedMotion;

describe('useReducedMotion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return false when reduced motion is not enabled', () => {
    mockUseReducedMotionFn.mockReturnValue(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should return true when reduced motion is enabled', () => {
    mockUseReducedMotionFn.mockReturnValue(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('should return false when motion/react returns null/undefined', () => {
    mockUseReducedMotionFn.mockReturnValue(null);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should call motion/react useReducedMotion', () => {
    renderHook(() => useReducedMotion());

    expect(mockUseReducedMotionFn).toHaveBeenCalled();
  });
});
