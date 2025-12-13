'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * React hook for mount state detection to prevent memory leaks from async operations.
 *
 * Returns a stable function that checks if the component is still mounted. Essential
 * for preventing "Can't perform a React state update on an unmounted component" warnings
 * from async operations that complete after navigation or component cleanup.
 *
 * **When to use:**
 * - ✅ API calls - Prevent state updates after component unmounts
 * - ✅ File uploads - Cancel operations safely when users navigate away
 * - ✅ Timers and intervals - Safe cleanup of async operations
 * - ✅ WebSocket connections - Prevent memory leaks in real-time apps
 * - ✅ Animation callbacks - Stop updating state after component cleanup
 * - ✅ Data polling - Prevent setState warnings during navigation
 * - ❌ For simple useEffect cleanup - useEffect cleanup handles most cases fine
 *
 * **Features:**
 * - Memory leak prevention - Check mount state before setState operations
 * - Async operation safety - Prevents updates on unmounted components
 * - Stable function reference - Memoized with useCallback to prevent re-renders
 * - Zero dependencies - Uses only native React hooks
 * - Performance optimized - Efficient mount tracking using useRef patterns
 *
 * **Important:** This prevents warnings, not true memory leaks. You still need proper
 * cleanup for subscriptions, timers, and event listeners. This hook just prevents
 * React from complaining about state updates.
 *
 * @returns Function that returns `true` if mounted, `false` if unmounted
 *
 * @example
 * ```tsx
 * // API call with mount check
 * const isMounted = useIsMounted();
 *
 * useEffect(() => {
 *   fetchData().then((data) => {
 *     if (isMounted()) {
 *       setData(data);
 *     }
 *   });
 * }, []);
 * ```
 *
 * @example
 * ```tsx
 * // Timer cleanup
 * const isMounted = useIsMounted();
 * const timerId = useRef<NodeJS.Timeout>();
 *
 * useEffect(() => {
 *   timerId.current = setInterval(() => {
 *     if (isMounted()) {
 *       updateState();
 *     }
 *   }, 1000);
 *
 *   return () => clearInterval(timerId.current);
 * }, []);
 * ```
 *
 * @example
 * ```tsx
 * // AbortController for fetch
 * const isMounted = useIsMounted();
 * const controllerRef = useRef(new AbortController());
 *
 * useEffect(() => {
 *   fetch(url, { signal: controllerRef.current.signal })
 *     .then((res) => res.json())
 *     .then((data) => {
 *       if (isMounted()) {
 *         setData(data);
 *       }
 *     });
 *
 *   return () => controllerRef.current.abort();
 * }, []);
 * ```
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => {
    return isMountedRef.current;
  }, []);
}
