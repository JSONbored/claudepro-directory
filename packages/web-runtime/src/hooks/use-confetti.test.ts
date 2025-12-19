import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfetti } from './use-confetti';

// Mock canvas-confetti - use vi.hoisted() for variables used in vi.mock()
const mockConfetti = vi.hoisted(() => vi.fn());
vi.mock('canvas-confetti', () => ({
  default: mockConfetti,
}));

// Mock config
vi.mock('../config/unified-config', () => ({
  CONFETTI_CONFIG: {
    'success.particle_count': 50,
    'success.spread': 70,
    'success.ticks': 50,
    'celebration.particle_count': 100,
    'celebration.spread': 70,
    'celebration.ticks': 50,
    'milestone.particle_count': 75,
    'milestone.spread': 70,
    'milestone.ticks': 50,
    'milestone.scalar': 1.2,
    'subtle.particle_count': 30,
    'subtle.spread': 50,
    'subtle.ticks': 30,
  },
}));

vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('../errors', () => ({
  normalizeError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useConfetti', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return confetti functions', () => {
    const { result } = renderHook(() => useConfetti());

    expect(typeof result.current.fireConfetti).toBe('function');
    expect(typeof result.current.celebrateBookmark).toBe('function');
    expect(typeof result.current.celebrateSubmission).toBe('function');
    expect(typeof result.current.celebrateMilestone).toBe('function');
    expect(typeof result.current.celebrateSignup).toBe('function');
  });

  it('should fire success confetti', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti('success');
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#34d399'],
        ticks: 50,
      })
    );
  });

  it('should fire celebration confetti', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti('celebration');
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 100,
        spread: 70,
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
      })
    );
  });

  it('should fire milestone confetti', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti('milestone');
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 75,
        shapes: ['star'],
        colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
        scalar: 1.2,
      })
    );
  });

  it('should fire subtle confetti', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti('subtle');
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#8b5cf6'],
        startVelocity: 20,
      })
    );
  });

  it('should use success variant as default', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti(); // No argument
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 50, // Success config
      })
    );
  });

  it('should call celebrateBookmark with success variant', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.celebrateBookmark();
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 50, // Success config
      })
    );
  });

  it('should call celebrateSubmission with celebration variant', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.celebrateSubmission();
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 100, // Celebration config
      })
    );
  });

  it('should call celebrateMilestone with milestone variant', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.celebrateMilestone();
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: ['star'], // Milestone config
      })
    );
  });

  it('should call celebrateSignup with subtle variant', () => {
    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.celebrateSignup();
    });

    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 30, // Subtle config
      })
    );
  });

  it('should handle confetti errors gracefully', async () => {
    const { logger } = await import('../logger');
    mockConfetti.mockImplementation(() => {
      throw new Error('Confetti failed');
    });

    const { result } = renderHook(() => useConfetti());

    act(() => {
      result.current.fireConfetti('success');
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'animation',
        component: 'useConfetti',
        variant: 'success',
      }),
      '[Animation] Confetti failed'
    );
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useConfetti());

    const firstFire = result.current.fireConfetti;
    const firstBookmark = result.current.celebrateBookmark;

    rerender();

    const secondFire = result.current.fireConfetti;
    const secondBookmark = result.current.celebrateBookmark;

    expect(firstFire).toBe(secondFire);
    expect(firstBookmark).toBe(secondBookmark);
  });
});
