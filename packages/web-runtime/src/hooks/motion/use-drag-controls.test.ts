/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useDragControls } from './use-drag-controls';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockDragControls = {
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
  };
  const mockUseDragControls = jest.fn(() => mockDragControls);
  return {
    useDragControls: mockUseDragControls,
    __mockDragControls: mockDragControls,
    __mockUseDragControls: mockUseDragControls,
  };
});

// Get mocks for use in tests
const {
  useDragControls: mockUseDragControls,
  __mockDragControls,
  __mockUseDragControls,
} = jest.requireMock('motion/react');
const mockDragControls = __mockDragControls;
const mockUseDragControlsFn = __mockUseDragControls || mockUseDragControls;

describe('useDragControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mockUseDragControls to return mockDragControls
    mockUseDragControlsFn.mockReturnValue(mockDragControls);
  });

  it('should return drag controls', () => {
    const { result } = renderHook(() => useDragControls());

    expect(result.current).toBe(mockDragControls);
    expect(mockUseDragControlsFn).toHaveBeenCalled();
  });

  it('should be a re-export of motion/react useDragControls', () => {
    renderHook(() => useDragControls());

    expect(mockUseDragControlsFn).toHaveBeenCalledTimes(1);
  });
});
