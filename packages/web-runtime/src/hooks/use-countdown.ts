'use client';

import { useBoolean, useInterval } from './index.ts';
import { useCallback, useState } from 'react';

/**
 * Options for useCountdown hook
 */
export interface UseCountdownOptions {
  /**
   * Starting number for the countdown (required)
   */
  countStart: number;
  /**
   * Stopping number (pass -Infinity to decrease forever)
   * @default 0
   */
  countStop?: number;
  /**
   * Interval between updates in milliseconds
   * @default 1000
   */
  intervalMs?: number;
  /**
   * Whether to count up instead of down
   * @default false
   */
  isIncrement?: boolean;
}

/**
 * Countdown controller functions
 */
export interface UseCountdownActions {
  startCountdown: () => void;
  stopCountdown: () => void;
  resetCountdown: () => void;
}

/**
 * React hook for countdown timers with start/stop/reset controls.
 *
 * Flexible timer that can count up or down with configurable intervals and automatic
 * stopping at boundaries. Handles cleanup properly to prevent memory leaks.
 *
 * **When to use:**
 * - ✅ Countdown timers - Games, quizzes, or time-limited activities
 * - ✅ Pomodoro technique - Work/break interval timers in productivity apps
 * - ✅ Loading states - Timeout countdowns with visual progress indicators
 * - ✅ Game mechanics - Cooldowns, respawn timers, round timers
 * - ✅ Session timeouts - User session expiration warnings
 * - ✅ Exercise timers - Workout intervals and rest periods
 * - ✅ Auction timers - Bidding countdown displays with real-time updates
 * - ✅ Event countdowns - Time until launches or deadlines
 * - ❌ For displaying current time - Use Date objects instead
 *
 * **Features:**
 * - Flexible direction - Count down or count up
 * - Configurable interval - Set custom intervals in milliseconds
 * - Auto-stop - Automatically stops when reaching the target value
 * - Full control - Start, stop, and reset functionality
 * - Custom boundaries - Set custom start and stop values
 * - Performance optimized - Uses efficient interval management
 *
 * **Note:** JavaScript timers aren't perfectly accurate and can drift, especially
 * in background tabs. For mission-critical timing, track actual elapsed time with
 * `Date.now()` instead of counting intervals.
 *
 * @param options - Configuration options
 * @returns Tuple `[count, controllers]` where controllers contains control functions
 *
 * @example
 * ```tsx
 * // Basic countdown
 * const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
 *   countStart: 60,
 *   countStop: 0,
 * });
 *
 * <div>{count}</div>
 * <button onClick={startCountdown}>Start</button>
 * ```
 *
 * @example
 * ```tsx
 * // Count up
 * const [time, { startCountdown }] = useCountdown({
 *   countStart: 0,
 *   countStop: Infinity,
 *   isIncrement: true,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Multiple timers
 * const [workTime, workControls] = useCountdown({ countStart: 1500 }); // 25 minutes
 * const [breakTime, breakControls] = useCountdown({ countStart: 300 }); // 5 minutes
 * ```
 */
export function useCountdown(
  options: UseCountdownOptions
): [number, UseCountdownActions] {
  const {
    countStart,
    countStop = 0,
    intervalMs = 1000,
    isIncrement = false,
  } = options;

  const [count, setCount] = useState(countStart);
  const { value: isRunning, setTrue: startRunning, setFalse: stopRunning } = useBoolean();

  // Use useInterval for countdown logic
  useInterval(() => {
    setCount((prev) => {
      const next = isIncrement ? prev + 1 : prev - 1;

      // Check if we've reached the stop value
      if (isIncrement) {
        if (countStop !== -Infinity && next >= countStop) {
          stopRunning();
          return countStop;
        }
      } else {
        if (next <= countStop) {
          stopRunning();
          return countStop;
        }
      }

      return next;
    });
  }, isRunning ? intervalMs : null);

  const startCountdown = useCallback(() => {
    if (isRunning) {
      return;
    }
    startRunning();
  }, [isRunning, startRunning]);

  const stopCountdown = useCallback(() => {
    stopRunning();
  }, [stopRunning]);

  const resetCountdown = useCallback(() => {
    stopRunning();
    setCount(countStart);
  }, [countStart, stopRunning]);

  return [
    count,
    {
      startCountdown,
      stopCountdown,
      resetCountdown,
    },
  ];
}
