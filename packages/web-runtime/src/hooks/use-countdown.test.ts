/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCountdown } from './use-countdown';
import type { UseCountdownOptions } from './use-countdown';

// Mock useBoolean and useInterval - define variables outside mock factory
let mockIsRunning = false;
let mockIntervalCallback: (() => void) | null = null;
let mockIntervalDelay: number | null = null;
let mockRerender: (() => void) | null = null;

// Create stable function references for setTrue and setFalse
const stableSetTrue = jest.fn(() => {
  mockIsRunning = true;
  if (mockRerender) {
    mockRerender();
  }
});
const stableSetFalse = jest.fn(() => {
  mockIsRunning = false;
  if (mockRerender) {
    mockRerender();
  }
});

jest.mock('./use-boolean', () => ({
  useBoolean: jest.fn(() => {
    // Return object with getter for value to make it reactive
    // Use stable function references so useCallback dependencies don't change
    return {
      get value() {
        return mockIsRunning;
      },
      setTrue: stableSetTrue,
      setFalse: stableSetFalse,
      toggle: jest.fn(),
    };
  }),
}));

jest.mock('./use-interval', () => ({
  useInterval: jest.fn((callback: () => void, delay: number | null) => {
    // Only capture callback and delay if delay is not null (interval is active)
    if (delay !== null) {
      mockIntervalCallback = callback;
      mockIntervalDelay = delay;
    } else {
      // When delay is null, clear the callback (interval paused)
      mockIntervalCallback = null;
      mockIntervalDelay = null;
    }
  }),
}));

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIsRunning = false;
    mockIntervalCallback = null;
    mockIntervalDelay = null;
    mockRerender = null;
    jest.clearAllMocks();
    // Reset stable function mocks
    stableSetTrue.mockClear();
    stableSetFalse.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize with countStart value', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 60 } as UseCountdownOptions));

    const [count] = result.current;
    expect(count).toBe(60);
  });

  it('should initialize with default countStop of 0', () => {
    const { result } = renderHook(() => useCountdown({ countStart: 10 } as UseCountdownOptions));

    const [count, actions] = result.current;
    expect(count).toBe(10);
    expect(typeof actions.startCountdown).toBe('function');
    expect(typeof actions.stopCountdown).toBe('function');
    expect(typeof actions.resetCountdown).toBe('function');
  });

  it('should count down when started', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 5, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

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
    const { result, rerender } = renderHook(() =>
      useCountdown({
        countStart: 0,
        countStop: 10,
        intervalMs: 1000,
        isIncrement: true,
      } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
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

  it('should stop automatically when reaching countStop (countdown)', async () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 2, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 2 -> 1
      }
    });

    expect(result.current[0]).toBe(1);

    // Save callback before it gets cleared by stopRunning()
    const callbackBeforeStop = mockIntervalCallback;
    act(() => {
      if (callbackBeforeStop) {
        callbackBeforeStop(); // 1 -> 0 (stops, calls stopRunning() which clears callback)
      }
    });

    // Wait for state update to be applied
    await waitFor(() => {
      expect(result.current[0]).toBe(0);
    });
  });

  it('should stop automatically when reaching countStop (count up)', async () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({
        countStart: 0,
        countStop: 2,
        intervalMs: 1000,
        isIncrement: true,
      } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    // First tick: 0 -> 1
    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback();
      }
    });

    expect(result.current[0]).toBe(1);

    // Second tick: 1 -> 2 (should stop after this)
    // The callback will call stopRunning() which clears mockIntervalCallback,
    // so we need to capture it before calling
    const callbackBeforeSecondTick = mockIntervalCallback;
    expect(callbackBeforeSecondTick).toBeTruthy();

    act(() => {
      if (callbackBeforeSecondTick) {
        callbackBeforeSecondTick(); // This will: 1) setCount(2), 2) stopRunning() (clears callback)
      }
    });

    // Wait for state update to be applied
    // After stopping, count should be 2 (the callback returns countStop which is 2)
    // Note: The callback sets count to countStop (2) when next >= countStop
    await waitFor(() => {
      expect(result.current[0]).toBe(2);
    });
  });

  it('should not stop when countStop is -Infinity (count down)', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({
        countStart: 10,
        countStop: -Infinity,
        intervalMs: 1000,
      } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
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
  });

  it('should stop countdown when stopCountdown is called', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 10 -> 9
      }
    });

    expect(result.current[0]).toBe(9);

    act(() => {
      result.current[1].stopCountdown();
    });

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
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback(); // 10 -> 9
      }
    });

    expect(result.current[0]).toBe(9);

    act(() => {
      result.current[1].resetCountdown();
    });

    expect(result.current[0]).toBe(10);
  });

  it('should not start if already running', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    // Get the useBoolean mock to check call count
    const useBooleanModule = require('./use-boolean');
    const useBooleanMock = jest.mocked(useBooleanModule.useBoolean);
    const firstCallResult = useBooleanMock.mock.results[0]?.value;
    const initialCallCount = firstCallResult?.setTrue?.mock?.calls?.length || 0;

    act(() => {
      result.current[1].startCountdown(); // Should not start again
    });

    // setTrue should only be called once (from the first startCountdown)
    expect(firstCallResult?.setTrue).toHaveBeenCalledTimes(initialCallCount);
  });

  it('should use custom intervalMs', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 500 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    expect(mockIntervalDelay).toBe(500);
  });

  it('should handle countStart equal to countStop', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 5, countStop: 5, intervalMs: 1000 } as UseCountdownOptions)
    );
    mockRerender = rerender;

    act(() => {
      result.current[1].startCountdown();
    });

    act(() => {
      if (mockIntervalCallback) {
        mockIntervalCallback();
      }
    });

    // Should stop immediately (countStart equals countStop, so next value would be 4, which is <= 5, so it stops)
    expect(result.current[0]).toBe(5);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() =>
      useCountdown({ countStart: 10, countStop: 0, intervalMs: 1000 } as UseCountdownOptions)
    );

    const firstStart = result.current[1].startCountdown;
    const firstStop = result.current[1].stopCountdown;
    const firstReset = result.current[1].resetCountdown;

    // Re-render with same props (should maintain function references due to useCallback)
    rerender();

    const secondStart = result.current[1].startCountdown;
    const secondStop = result.current[1].stopCountdown;
    const secondReset = result.current[1].resetCountdown;

    // Functions should be stable (same reference) due to useCallback in the hook
    // Note: useCallback ensures functions are only recreated when dependencies change
    // Since we're re-rendering with the same props, dependencies haven't changed
    expect(firstStart).toBe(secondStart);
    expect(firstStop).toBe(secondStop);
    expect(firstReset).toBe(secondReset);
  });
});
