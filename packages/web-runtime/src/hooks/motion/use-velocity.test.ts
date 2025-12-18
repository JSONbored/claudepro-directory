import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVelocity } from './use-velocity';

// Mock motion/react
const mockMotionValue = {
  get: vi.fn(() => 0),
  on: vi.fn(),
};
const mockSource = { get: () => 0, on: vi.fn() };
const mockUseVelocity = vi.fn(() => mockMotionValue);

vi.mock('motion/react', () => ({
  useVelocity: mockUseVelocity,
}));

describe('useVelocity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a re-export of motion/react useVelocity', () => {
    const { result } = renderHook(() => useVelocity(mockSource));

    expect(mockUseVelocity).toHaveBeenCalledWith(mockSource);
    expect(result.current).toBe(mockMotionValue);
  });

  it('should return a motion value tracking velocity', () => {
    const { result } = renderHook(() => useVelocity(mockSource));

    expect(result.current).toBeDefined();
    expect(typeof result.current.get).toBe('function');
  });
});
