'use client';

import { useEffect, useRef } from 'react';

/**
 * React hook for component unmount cleanup.
 *
 * Executes a cleanup function when the component unmounts. Provides access to the
 * latest state and props in cleanup callbacks, unlike useEffect cleanup which captures
 * values from when the effect was created.
 *
 * **When to use:**
 * - ✅ API request cleanup - Cancel pending network requests and AbortController management
 * - ✅ Subscription management - WebSocket disconnections, event stream cleanup, real-time data
 * - ✅ Timer and interval cleanup - Clear timeouts, intervals, and animation frames
 * - ✅ Event listener removal - Window, document, and DOM event cleanup
 * - ✅ Resource cleanup - File handles, database connections, worker termination
 * - ✅ Analytics and tracking - Send usage metrics, performance data, user behavior on exit
 * - ❌ For simple useEffect cleanup - useEffect cleanup handles most cases fine
 *
 * **Features:**
 * - Automatic cleanup - Guaranteed execution when component unmounts
 * - Latest closure access - Cleanup functions have access to current state and props
 * - Function validation - Runtime type checking with descriptive error messages
 * - Memory leak prevention - Stable references and proper cleanup timing
 * - Centralized cleanup - Single location for all unmount logic
 *
 * **Key Differences:**
 * - `useEffect` cleanup - Runs on every dependency change, captures stale values
 * - `useUnmount` cleanup - Runs only on unmount, always has latest values
 *
 * @param fn - Cleanup function to execute on component unmount (validates function type)
 *
 * @example
 * ```tsx
 * // Timer cleanup
 * const timerId = useRef<NodeJS.Timeout>();
 *
 * useUnmount(() => {
 *   if (timerId.current) {
 *     clearInterval(timerId.current);
 *   }
 * });
 * ```
 *
 * @example
 * ```tsx
 * // AbortController cleanup
 * const controllerRef = useRef(new AbortController());
 *
 * useUnmount(() => {
 *   controllerRef.current.abort();
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Multiple cleanup tasks
 * useUnmount(() => {
 *   // All cleanup in one place with access to latest state
 *   cancelPendingRequests();
 *   closeWebSocket();
 *   clearTimers();
 *   sendAnalytics();
 * });
 * ```
 */
export function useUnmount(fn: () => void): void {
  if (typeof fn !== 'function') {
    throw new Error(
      `useUnmount: Expected a function, received ${typeof fn}`
    );
  }

  const fnRef = useRef(fn);

  // Store latest function in ref to avoid stale closures
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      fnRef.current();
    };
  }, []);
}
