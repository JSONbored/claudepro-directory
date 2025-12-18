import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSpring } from './use-spring';

// Mock motion/react
const mockUseSpring = vi.fn((initial: number, config?: any) => ({
  get: () => initial,
  set: vi.fn(),
  on: vi.fn(),
}));

vi.mock('motion/react', () => ({
  useSpring: mockUseSpring,
}));

describe('useSpring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a re-export of motion/react useSpring', () => {
    const { result } = renderHook(() => useSpring(0));

    expect(mockUseSpring).toHaveBeenCalledWith(0, undefined);
    expect(result.current).toBeDefined();
  });

  it('should accept initial value', () => {
    renderHook(() => useSpring(100));

    expect(mockUseSpring).toHaveBeenCalledWith(100, undefined);
  });

  it('should accept spring config', () => {
    const config = { stiffness: 300, damping: 30 };

    renderHook(() => useSpring(0, config));

    expect(mockUseSpring).toHaveBeenCalledWith(0, config);
  });
});
