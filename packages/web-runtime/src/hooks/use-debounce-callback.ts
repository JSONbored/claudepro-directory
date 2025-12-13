'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Options for useDebounceCallback hook
 */
export interface DebounceOptions {
  /**
   * Execute on the leading edge of the timeout
   * @default false
   */
  leading?: boolean;
  /**
   * Execute on the trailing edge of the timeout
   * @default true
   */
  trailing?: boolean;
  /**
   * Maximum time function is allowed to be delayed
   */
  maxWait?: number;
}

/**
 * Debounced function with control methods
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
}

/**
 * React hook for debouncing function calls.
 *
 * Wraps a function with debouncing logic, preventing it from being called too frequently.
 * Useful for API calls, search queries, and other expensive operations that should be
 * rate-limited.
 *
 * **When to use:**
 * - ✅ Search inputs - Delay API calls until user stops typing
 * - ✅ Form validation - Debounce expensive validation checks
 * - ✅ Auto-save features - Delay save operations until user pauses editing
 * - ✅ API throttling - Control request frequency to prevent rate limiting
 * - ✅ Resize handlers - Debounce expensive calculations during window resize
 * - ✅ Button click protection - Prevent rapid successive clicks on action buttons
 * - ✅ Filter controls - Debounce complex filtering operations on large datasets
 * - ❌ For simple onClick handlers - Regular functions are fine
 *
 * **Key Differences:**
 * - `useDebounceCallback` - Debounces function calls (delayed execution)
 * - `useDebounceValue` - Debounces state changes (delayed value)
 *
 * **Features:**
 * - Control methods: `cancel()`, `flush()`, `isPending()`
 * - Configurable leading/trailing execution
 * - Automatic cleanup on unmount
 * - Preserves function type signature
 *
 * @typeParam T - Type of the function to debounce
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @param options - Additional lodash.debounce options
 * @returns Debounced function with control methods
 *
 * @example
 * ```tsx
 * // Debounced search API call
 * const debouncedSearch = useDebounceCallback((term: string) => {
 *   searchAPI(term);
 * }, 300);
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 *
 * @example
 * ```tsx
 * // With control methods
 * const debouncedSave = useDebounceCallback(saveData, 1000);
 *
 * // Cancel pending save
 * debouncedSave.cancel();
 *
 * // Execute immediately
 * debouncedSave.flush();
 *
 * // Check if pending
 * if (debouncedSave.isPending()) {
 *   showLoadingIndicator();
 * }
 * ```
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const funcRef = useRef(func);
  const leadingExecutedRef = useRef(false);

  // Store latest function in ref to avoid stale closures
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    lastCallTimeRef.current = null;
    leadingExecutedRef.current = false;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    lastCallTimeRef.current = null;
    leadingExecutedRef.current = false;
  }, []);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  const debouncedFn = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      // Leading edge execution
      if (leading && !leadingExecutedRef.current) {
        leadingExecutedRef.current = true;
        funcRef.current(...args);
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          if (!leading || leadingExecutedRef.current) {
            funcRef.current(...args);
          }
          timeoutRef.current = null;
          leadingExecutedRef.current = false;
        }, delay);
      }

      // Max wait handling
      if (maxWait && lastCallTimeRef.current === null) {
        lastCallTimeRef.current = now;
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (!leading || leadingExecutedRef.current) {
            funcRef.current(...args);
          }
          lastCallTimeRef.current = null;
          leadingExecutedRef.current = false;
        }, maxWait);
      }
    }) as DebouncedFunction<T>,
    [delay, leading, trailing, maxWait]
  );

  // Attach control methods
  debouncedFn.cancel = cancel;
  debouncedFn.flush = flush;
  debouncedFn.isPending = isPending;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return debouncedFn;
}
