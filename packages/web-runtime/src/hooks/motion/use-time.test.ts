import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTime } from './use-time';

// Mock motion/react
const mockMotionValue = {
  get: vi.fn(() => 0),
  on: vi.fn(),
};
const mockUseTime = vi.fn(() => mockMotionValue);

vi.mock('motion/react', () => ({
  useTime: mockUseTime,
}));

describe('useTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a re-export of motion/react useTime', () => {
    const { result } = renderHook(() => useTime());

    expect(mockUseTime).toHaveBeenCalled();
    expect(result.current).toBe(mockMotionValue);
  });

  it('should return a motion value', () => {
    const { result } = renderHook(() => useTime());

    expect(result.current).toBeDefined();
    expect(typeof result.current.get).toBe('function');
  });
});
