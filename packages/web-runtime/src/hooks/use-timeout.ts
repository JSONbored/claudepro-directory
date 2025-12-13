'use client';

import { useEffect, useRef } from 'react';

/**
 * React hook for setTimeout management with automatic cleanup and dynamic delay control.
 *
 * Handles stale closures, memory leaks, and provides conditional execution by passing
 * `null` as the delay. Always uses the latest callback version, preventing stale
 * closure bugs.
 *
 * **When to use:**
 * - ✅ Auto-save systems - Delay save operations and cancel on new changes
 * - ✅ Notification timers - Show/hide messages with automatic timeout management
 * - ✅ Debounced interactions - Delay API calls, search queries, and user input processing
 * - ✅ Game mechanics - Implement countdown timers, time-based actions, and game loops
 * - ✅ Loading states - Timeout-based loading indicators and fallback mechanisms
 * - ✅ Animation sequences - Control timed animations and transitions
 * - ❌ For repeating actions - Use `useInterval` instead
 *
 * **Features:**
 * - Automatic cleanup on unmount and when delay changes
 * - Latest callback execution - always uses most recent function version
 * - Dynamic delay control - change delay at runtime
 * - Conditional execution - pass `null` to cancel/pause
 * - No stale closures - uses `useRef` to store latest callback
 *
 * **Performance:**
 * - Uses `useRef` to store latest callback, preventing stale closures
 * - Timeout automatically restarts when delay changes
 * - Proper cleanup prevents memory leaks
 *
 * @param callback - Function to execute after the delay (latest version is always used)
 * @param delay - Delay in milliseconds, or `null` to cancel/pause the timeout
 *
 * @example
 * ```tsx
 * // Basic timeout
 * useTimeout(() => {
 *   setShowMessage(false);
 * }, 3000);
 * ```
 *
 * @example
 * ```tsx
 * // Conditional execution
 * const [isActive, setIsActive] = useState(true);
 *
 * useTimeout(() => {
 *   saveData();
 * }, isActive ? 5000 : null);
 * ```
 *
 * @example
 * ```tsx
 * // Dynamic delay
 * const [delay, setDelay] = useState(1000);
 *
 * useTimeout(() => {
 *   showNotification();
 * }, delay);
 *
 * // Change delay - timeout automatically restarts
 * <button onClick={() => setDelay(2000)}>Delay more</button>
 * ```
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const callbackRef = useRef(callback);

  // Store latest callback in ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      callbackRef.current();
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay]);
}
