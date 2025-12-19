import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnimateScoped } from './use-animate-scoped';

// Mock motion/react - use vi.hoisted() for variables used in vi.mock()
const mockScope = vi.hoisted(() => ({ current: null }));
const mockAnimate = vi.hoisted(() => vi.fn());
const mockUseAnimate = vi.hoisted(() => vi.fn(() => [mockScope, mockAnimate]));

vi.mock('motion/react', () => ({
  useAnimate: mockUseAnimate,
}));

describe('useAnimateScoped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
