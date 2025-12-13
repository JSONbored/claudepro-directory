'use client';

import { useEffect, useRef } from 'react';

/**
 * React hook for setInterval management with automatic cleanup and pause/resume functionality.
 *
 * Handles stale closures, memory leaks, and provides clean pause/resume by passing
 * `null` as the delay. Uses Dan Abramov's proven pattern for React-aware intervals.
 *
 * **When to use:**
 * - ✅ Countdown timers - Clock displays and time-sensitive UI updates
 * - ✅ Data polling - Refresh content from APIs at regular intervals
 * - ✅ Animation loops - Control frame-based animations and transitions
 * - ✅ Auto-save features - Periodically save user input or form data
 * - ✅ Real-time updates - Live feeds, notifications, and status monitoring
 * - ✅ Progress indicators - Animate progress bars and loading sequences
 * - ❌ For one-off delays - Use `useTimeout` or `setTimeout` instead
 *
 * **Features:**
 * - Automatic cleanup on unmount
 * - Dynamic callback updates without restarting interval
 * - Pause/resume by passing `null` delay
 * - No stale closures - always uses latest callback
 * - Declarative API that handles common patterns automatically
 *
 * **Performance:**
 * - Uses `useRef` to store latest callback, preventing stale closures
 * - Interval automatically restarts when delay changes
 * - Proper cleanup prevents memory leaks
 *
 * @param callback - Function to execute at each interval
 * @param delay - Interval delay in milliseconds, or `null` to pause
 *
 * @example
 * ```tsx
 * // Basic interval
 * useInterval(() => {
 *   setCount(prev => prev + 1);
 * }, 1000);
 * ```
 *
 * @example
 * ```tsx
 * // Pause/resume
 * const [isRunning, setIsRunning] = useState(true);
 *
 * useInterval(() => {
 *   fetchData();
 * }, isRunning ? 5000 : null);
 * ```
 *
 * @example
 * ```tsx
 * // Dynamic delay
 * const [delay, setDelay] = useState(1000);
 *
 * useInterval(() => {
 *   pollAPI();
 * }, delay);
 *
 * // Change delay - interval automatically restarts
 * <button onClick={() => setDelay(2000)}>Slow down</button>
 * ```
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const callbackRef = useRef(callback);

  // Store latest callback in ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const intervalId = setInterval(() => {
      callbackRef.current();
    }, delay);

    return () => {
      clearInterval(intervalId);
    };
  }, [delay]);
}
