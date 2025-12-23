/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { usePageInView } from './use-page-in-view';

// Mock motion/react - define mocks inside factory function
jest.mock('motion/react', () => {
  const mockUsePageInView = jest.fn(() => true);
  return {
    usePageInView: mockUsePageInView,
    __mockUsePageInView: mockUsePageInView,
  };
});

// Get mock for use in tests
const { usePageInView: mockUsePageInView } = jest.requireMock('motion/react');
const mockUsePageInViewFn = mockUsePageInView.__mockUsePageInView || mockUsePageInView;

describe('usePageInView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return true when page is in view', () => {
    mockUsePageInViewFn.mockReturnValue(true);

    const { result } = renderHook(() => usePageInView());

    expect(result.current).toBe(true);
  });

  it('should return false when page is not in view', () => {
    mockUsePageInViewFn.mockReturnValue(false);

    const { result } = renderHook(() => usePageInView());

    expect(result.current).toBe(false);
  });

  it('should call motion/react usePageInView', () => {
    renderHook(() => usePageInView());

    expect(mockUsePageInViewFn).toHaveBeenCalled();
  });
});
