/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useSpring } from './use-spring';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockSpringValue = {
    get: jest.fn(() => 0),
    set: jest.fn(),
    on: jest.fn(),
  };
  const mockUseSpring = jest.fn((initial: number, config?: any) => mockSpringValue);
  return {
    useSpring: mockUseSpring,
    __mockSpringValue: mockSpringValue,
    __mockUseSpring: mockUseSpring,
  };
});

// Get mocks for use in tests
const {
  useSpring: mockUseSpring,
  __mockSpringValue,
  __mockUseSpring,
} = jest.requireMock('motion/react');
const mockSpringValue = __mockSpringValue;
const mockUseSpringFn = __mockUseSpring || mockUseSpring;

describe('useSpring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseSpring to return mockSpringValue
    mockUseSpringFn.mockReturnValue(mockSpringValue);
  });

  it('should be a re-export of motion/react useSpring', () => {
    const { result } = renderHook(() => useSpring(0));

    expect(mockUseSpringFn).toHaveBeenCalledWith(0);
    expect(result.current).toBeDefined();
    expect(result.current).toBe(mockSpringValue);
  });

  it('should accept initial value', () => {
    renderHook(() => useSpring(100));

    expect(mockUseSpringFn).toHaveBeenCalledWith(100);
  });

  it('should accept spring config', () => {
    const config = { stiffness: 300, damping: 30 };

    renderHook(() => useSpring(0, config));

    expect(mockUseSpringFn).toHaveBeenCalledWith(0, config);
  });
});
