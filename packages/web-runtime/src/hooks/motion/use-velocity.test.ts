/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useVelocity } from './use-velocity';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockMotionValue = {
    get: jest.fn(() => 0),
    on: jest.fn(),
  };
  const mockUseVelocity = jest.fn(() => mockMotionValue);
  return {
    useVelocity: mockUseVelocity,
    __mockMotionValue: mockMotionValue,
    __mockUseVelocity: mockUseVelocity,
  };
});

// Get mocks for use in tests
const {
  useVelocity: mockUseVelocity,
  __mockMotionValue,
  __mockUseVelocity,
} = jest.requireMock('motion/react');
const mockMotionValue = __mockMotionValue;
const mockUseVelocityFn = __mockUseVelocity || mockUseVelocity;

describe('useVelocity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseVelocity to return mockMotionValue
    mockUseVelocityFn.mockReturnValue(mockMotionValue);
  });

  it('should be a re-export of motion/react useVelocity', () => {
    const mockSource = { get: () => 0, on: jest.fn() };
    const { result } = renderHook(() => useVelocity(mockSource));

    expect(mockUseVelocityFn).toHaveBeenCalledWith(mockSource);
    expect(result.current).toBe(mockMotionValue);
  });

  it('should return a motion value tracking velocity', () => {
    const mockSource = { get: () => 0, on: jest.fn() };
    const { result } = renderHook(() => useVelocity(mockSource));

    expect(result.current).toBeDefined();
    expect(typeof result.current.get).toBe('function');
  });
});
