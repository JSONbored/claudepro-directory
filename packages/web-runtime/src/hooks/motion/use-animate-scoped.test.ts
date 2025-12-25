/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useAnimateScoped } from './use-animate-scoped';

// Mock motion/react - define mocks inside factory function to avoid hoisting issues
jest.mock('motion/react', () => {
  const mockScope = { current: null };
  const mockAnimate = jest.fn();
  const mockUseAnimate = jest.fn(() => [mockScope, mockAnimate]);
  return {
    useAnimate: mockUseAnimate,
    __mockScope: mockScope,
    __mockAnimate: mockAnimate,
    __mockUseAnimate: mockUseAnimate,
  };
});

// Get mocks for use in tests
const { useAnimate, __mockScope, __mockAnimate, __mockUseAnimate } =
  jest.requireMock('motion/react');
const mockScope = __mockScope;
const mockAnimate = __mockAnimate;
const mockUseAnimate = __mockUseAnimate;

describe('useAnimateScoped', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseAnimate to default return value
    mockUseAnimate.mockReturnValue([mockScope, mockAnimate]);
  });

  it('should return scope and animate function', () => {
    const { result } = renderHook(() => useAnimateScoped());

    expect(result.current).toEqual([mockScope, mockAnimate]);
    expect(mockUseAnimate).toHaveBeenCalled();
  });

  it('should be a wrapper around motion/react useAnimate', () => {
    renderHook(() => useAnimateScoped());

    expect(mockUseAnimate).toHaveBeenCalledTimes(1);
  });
});
