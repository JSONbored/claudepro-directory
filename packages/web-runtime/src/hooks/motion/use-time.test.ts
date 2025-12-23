/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useTime } from './use-time';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockMotionValue = {
    get: jest.fn(() => 0),
    on: jest.fn(),
  };
  const mockUseTime = jest.fn(() => mockMotionValue);
  return {
    useTime: mockUseTime,
    __mockMotionValue: mockMotionValue,
    __mockUseTime: mockUseTime,
  };
});

// Get mocks for use in tests
const { useTime: mockUseTime, __mockMotionValue, __mockUseTime } = jest.requireMock('motion/react');
const mockMotionValue = __mockMotionValue;
const mockUseTimeFn = __mockUseTime || mockUseTime;

describe('useTime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseTime to return mockMotionValue
    mockUseTimeFn.mockReturnValue(mockMotionValue);
  });

  it('should be a re-export of motion/react useTime', () => {
    const { result } = renderHook(() => useTime());

    expect(mockUseTimeFn).toHaveBeenCalled();
    expect(result.current).toBe(mockMotionValue);
  });

  it('should return a motion value', () => {
    const { result } = renderHook(() => useTime());

    expect(result.current).toBeDefined();
    expect(typeof result.current.get).toBe('function');
  });
});
