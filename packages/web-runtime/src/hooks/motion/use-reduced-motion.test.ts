import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from './use-reduced-motion';

// Mock motion/react
const mockUseReducedMotion = vi.fn(() => false);

vi.mock('motion/react', () => ({
  useReducedMotion: mockUseReducedMotion,
}));

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when reduced motion is not enabled', () => {
    mockUseReducedMotion.mockReturnValue(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should return true when reduced motion is enabled', () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('should return false when motion/react returns null/undefined', () => {
    mockUseReducedMotion.mockReturnValue(null);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should call motion/react useReducedMotion', () => {
    renderHook(() => useReducedMotion());

    expect(mockUseReducedMotion).toHaveBeenCalled();
  });
});
