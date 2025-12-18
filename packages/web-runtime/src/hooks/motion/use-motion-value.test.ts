import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMotionValue } from './use-motion-value';

// Mock motion/react
const mockMotionValue = {
  get: vi.fn(() => 0),
  set: vi.fn(),
  on: vi.fn(),
};
const mockUseMotionValue = vi.fn((initial: number) => mockMotionValue);

vi.mock('motion/react', () => ({
  useMotionValue: mockUseMotionValue,
}));

describe('useMotionValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a re-export of motion/react useMotionValue', () => {
    const { result } = renderHook(() => useMotionValue(0));

    expect(mockUseMotionValue).toHaveBeenCalledWith(0);
    expect(result.current).toBe(mockMotionValue);
  });

  it('should accept initial value', () => {
    renderHook(() => useMotionValue(100));

    expect(mockUseMotionValue).toHaveBeenCalledWith(100);
  });
});
