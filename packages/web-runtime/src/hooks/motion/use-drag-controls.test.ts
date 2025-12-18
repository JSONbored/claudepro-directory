import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDragControls } from './use-drag-controls';

// Mock motion/react
const mockDragControls = {
  start: vi.fn(),
  stop: vi.fn(),
  cancel: vi.fn(),
};
const mockUseDragControls = vi.fn(() => mockDragControls);

vi.mock('motion/react', () => ({
  useDragControls: mockUseDragControls,
}));

describe('useDragControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return drag controls', () => {
    const { result } = renderHook(() => useDragControls());

    expect(result.current).toBe(mockDragControls);
    expect(mockUseDragControls).toHaveBeenCalled();
  });

  it('should be a re-export of motion/react useDragControls', () => {
    renderHook(() => useDragControls());

    expect(mockUseDragControls).toHaveBeenCalledTimes(1);
  });
});
