/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useMotionValue } from './use-motion-value';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockMotionValue = {
    get: jest.fn(() => 0),
    set: jest.fn(),
    on: jest.fn(),
  };
  const mockUseMotionValue = jest.fn((initial: number) => mockMotionValue);
  return {
    useMotionValue: mockUseMotionValue,
    __mockMotionValue: mockMotionValue,
    __mockUseMotionValue: mockUseMotionValue,
  };
});

// Get mocks for use in tests
const {
  useMotionValue: mockUseMotionValue,
  __mockMotionValue,
  __mockUseMotionValue,
} = jest.requireMock('motion/react');
const mockMotionValue = __mockMotionValue;
const mockUseMotionValueFn = __mockUseMotionValue || mockUseMotionValue;

describe('useMotionValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseMotionValue to return mockMotionValue
    mockUseMotionValueFn.mockReturnValue(mockMotionValue);
  });

  it('should be a re-export of motion/react useMotionValue', () => {
    const { result } = renderHook(() => useMotionValue(0));

    expect(mockUseMotionValueFn).toHaveBeenCalledWith(0);
    expect(result.current).toBe(mockMotionValue);
  });

  it('should accept initial value', () => {
    renderHook(() => useMotionValue(100));

    expect(mockUseMotionValueFn).toHaveBeenCalledWith(100);
  });
});
