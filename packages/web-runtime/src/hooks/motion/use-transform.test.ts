import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTransform } from './use-transform';

// Mock motion/react
const mockMotionValue = {
  get: vi.fn(() => 0),
  on: vi.fn(),
};
const mockUseTransform = vi.fn(() => mockMotionValue);

vi.mock('motion/react', () => ({
  useTransform: mockUseTransform,
}));

describe('useTransform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a re-export of motion/react useTransform', () => {
    const source = { get: () => 0, on: vi.fn() };
    const { result } = renderHook(() => useTransform(source, [0, 100], [0, 1]));

    expect(mockUseTransform).toHaveBeenCalledWith(source, [0, 100], [0, 1]);
    expect(result.current).toBe(mockMotionValue);
  });

  it('should accept transform function', () => {
    const source = { get: () => 50, on: vi.fn() };
    const transform = (value: number) => value * 2;

    renderHook(() => useTransform(source, transform));

    expect(mockUseTransform).toHaveBeenCalledWith(source, transform);
  });
});
