/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useTransform } from './use-transform';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockMotionValue = {
    get: jest.fn(() => 0),
    on: jest.fn(),
  };
  const mockUseTransform = jest.fn(() => mockMotionValue);
  return {
    useTransform: mockUseTransform,
    __mockMotionValue: mockMotionValue,
    __mockUseTransform: mockUseTransform,
  };
});

// Get mocks for use in tests
const {
  useTransform: mockUseTransform,
  __mockMotionValue,
  __mockUseTransform,
} = jest.requireMock('motion/react');
const mockMotionValue = __mockMotionValue;
const mockUseTransformFn = __mockUseTransform || mockUseTransform;

describe('useTransform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseTransform to return mockMotionValue
    mockUseTransformFn.mockReturnValue(mockMotionValue);
  });

  it('should be a re-export of motion/react useTransform', () => {
    const source = { get: () => 0, on: jest.fn() };
    const { result } = renderHook(() => useTransform(source, [0, 100], [0, 1]));

    expect(mockUseTransformFn).toHaveBeenCalledWith(source, [0, 100], [0, 1]);
    expect(result.current).toBe(mockMotionValue);
  });

  it('should accept transform function', () => {
    const source = { get: () => 50, on: jest.fn() };
    const transform = (value: number) => value * 2;

    renderHook(() => useTransform(source, transform));

    expect(mockUseTransformFn).toHaveBeenCalledWith(source, transform);
  });
});
