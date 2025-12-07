'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for debouncing search input with request cancellation
 * 
 * Features:
 * - Debounces search queries (default 400ms)
 * - Cancels previous requests when new search starts
 * - Returns AbortController for request cancellation
 * - Cleans up on unmount
 * 
 * @param callback - Function to call with debounced query
 * @param delay - Debounce delay in milliseconds (default 400ms)
 * @returns Object with current query, debounced search function, and abort controller
 */
export function useSearchDebounce(
  callback: (query: string, signal?: AbortSignal) => Promise<void> | void,
  delay: number = 400
) {
  const [query, setQuery] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedSearch = useCallback(
    (newQuery: string) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setQuery(newQuery);

      // Create new AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Debounce the search
      timeoutRef.current = setTimeout(async () => {
        try {
          await callbackRef.current(newQuery, controller.signal);
        } catch (error) {
          // Ignore abort errors (expected when canceling)
          if (error instanceof Error && error.name !== 'AbortError') {
            // Re-throw non-abort errors
            throw error;
          }
        }
      }, delay);

      return controller;
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    debouncedSearch,
    abortController: abortControllerRef.current,
  };
}
