import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageInView } from './use-page-in-view';

// Mock motion/react
const mockUsePageInView = vi.fn(() => true);

vi.mock('motion/react', () => ({
  usePageInView: mockUsePageInView,
}));

describe('usePageInView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when page is in view', () => {
    mockUsePageInView.mockReturnValue(true);

    const { result } = renderHook(() => usePageInView());

    expect(result.current).toBe(true);
  });

  it('should return false when page is not in view', () => {
    mockUsePageInView.mockReturnValue(false);

    const { result } = renderHook(() => usePageInView());

    expect(result.current).toBe(false);
  });

  it('should call motion/react usePageInView', () => {
    renderHook(() => usePageInView());

    expect(mockUsePageInView).toHaveBeenCalled();
  });
});
