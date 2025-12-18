import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './use-countdown';
import type { UseCountdownOptions } from './use-countdown';

// Mock useBoolean and useInterval
const mockSetTrue = vi.fn();
const mockSetFalse = vi.fn();
let mockIsRunning = false;
let mockIntervalCallback: (() => void) | null = null;
let mockIntervalDelay: number | null = null;

vi.mock('./use-boolean', () => ({
  useBoolean: vi.fn(() => ({
    value: () => mockIsRunning,
    setTrue: mockSetTrue,
    setFalse: mockSetFalse,
    toggle: vi.fn(),
  })),
}));

vi.mock('./use-interval', () => ({
  useInterval: vi.fn((callback: () => void, delay: number | null) => {
    mockIntervalCallback = callback;
    mockIntervalDelay = delay;
  }),
}));

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsRunning = false;
    mockIntervalCallback = null;
    mockIntervalDelay = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with countStart value', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 60 } as UseCountdownOptions)
    );

    const [count] = result.current;
    expect(count).toBe(60);
  });

  it('should initialize with default countStop of 0', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10 } as UseCountdownOptions)
    );

    const [count, actions] = result.current;
    expect(count).toBe(10);
    expect(typeof actions.startCountdown).toBe('function');
    expect(typeof actions.stopCountdown).toBe('function');
    expect(typeof actions.resetCountdown).toBe('function');
  });

  it('should count down when started', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 5, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    expect(mockSetTrue).toHaveBeenCalled();
    expect(mockIntervalDelay).toBe(1000);

    // Simulate interval ticks
    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 5 -> 4
      }
    });

    expect(result.current[0]).toBe(4);

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 4 -> 3
      }
    });

    expect(result.current[0]).toBe(3);
  });

  it('should count up when isIncrement is true', () => {
    const { result } = renderHook(() =>
      useCountdown({
        countStart: 0,
        countStop: 10,
        intervalMs: 1000,
        isIncrement: true,
      } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 0 -> 1
      }
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 1 -> 2
      }
    });

    expect(result.current[0]).toBe(2);
  });

  it('should stop automatically when reaching countStop (countdown)', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 2, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 2 -> 1
      }
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 1 -> 0 (stops)
      }
    });

    expect(result.current[0]).toBe(0);
    expect(mockSetFalse).toHaveBeenCalled();
    mockIsRunning = false;
  });

  it('should stop automatically when reaching countStop (count up)', () => {
    const { result } = renderHook(() =>
      useCountdown({
        countStart: 0,
        countStop: 2,
        intervalMs: 1000,
        isIncrement: true,
      } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 0 -> 1
      }
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 1 -> 2 (stops)
      }
    });

    expect(result.current[0]).toBe(2);
    expect(mockSetFalse).toHaveBeenCalled();
    mockIsRunning = false;
  });

  it('should not stop when countStop is -Infinity (count down)', () => {
    const { result } = renderHook(() =>
      useCountdown({
        countStart: 10,
        countStop: -Infinity,
        intervalMs: 1000,
      } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    // Count down multiple times - should not stop
    for (let i = 0; i < 5; i++) {
      act(() => {
        if (mockIntervalCallback) {
          mockIntervalCallback();
        }
      });
    }

    expect(result.current[0]).toBe(5); // 10 - 5 = 5
    expect(mockSetFalse).not.toHaveBeenCalled();
  });

  it('should stop countdown when stopCountdown is called', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 10 -> 9
      }
    });

    expect(result.current[0]).toBe(9);

    act(() => {
      result.current[1].stopCountdown();
      mockIsRunning = false;
    });

    expect(mockSetFalse).toHaveBeenCalled();

    // Should not continue counting
    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback();
      }
    });

    // Count should remain the same
    expect(result.current[0]).toBe(9);
  });

  it('should reset countdown to countStart', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 10 -> 9
      }
    });

    expect(result.current[0]).toBe(9);

    act(() => {
      result.current[1].resetCountdown();
      mockIsRunning = false;
    });

    expect(result.current[0]).toBe(10);
    expect(mockSetFalse).toHaveBeenCalled();
  });

  it('should not start if already running', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    const initialCallCount = mockSetTrue.mock.calls.length;

    act(() => {
      result.current[1].startCountdown(); // Should not start again
    });

    expect(mockSetTrue).toHaveBeenCalledTimes(initialCallCount);
  });

  it('should use custom intervalMs', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 500 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    expect(mockIntervalDelay).toBe(500);
  });

  it('should handle countStart equal to countStop', () => {
    const { result } = renderHook(() =>
      useCountdown({ countStart: 5, countStop: 5, intervalMs: 1000 } as UseCountdownOptions)
    );

    act(() => {
      result.current[1].startCountdown();
      mockIsRunning = true;
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback();
      }
    });

    // Should stop immediately
    expect(mockSetFalse).toHaveBeenCalled();
    expect(result.current[0]).toBe(5);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    const firstStart = result.current[1].startCountdown;
    const firstStop = result.current[1].stopCountdown;
    const firstReset = result.current[1].resetCountdown;

    rerender();

    const secondStart = result.current[1].startCountdown;
    const secondStop = result.current[1].stopCountdown;
    const secondReset = result.current[1].resetCountdown;

    expect(firstStart).toBe(secondStart);
    expect(firstStop).toBe(secondStop);
    expect(firstReset).toBe(secondReset);
  });
});
