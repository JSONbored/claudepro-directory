/**
 * Search Debouncing Hook with AbortController Support
 * 
 * Provides debounced search functionality with automatic request cancellation
 * to prevent race conditions and reduce API calls.
 */

import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSearchDebounceOptions {
  /** Debounce delay in milliseconds (default: 400ms) */
  delay?: number;
  /** Callback to execute when debounced search should run */
  onSearch: (query: string, signal?: AbortSignal) => Promise<void>;
}

export interface UseSearchDebounceReturn {
  /** Current query value */
  query: string;
  /** Debounced search function */
  debouncedSearch: (newQuery: string) => void;
  /** Current AbortController for manual cancellation */
  abortController: AbortController | null;
  /** Cancel any pending search */
  cancel: () => void;
}

/**
 * Hook for debounced search with automatic request cancellation
 * 
 * @param options - Configuration options
 * @returns Debounced search utilities
 * 
 * @example
 * ```tsx
 * const { debouncedSearch, cancel } = useSearchDebounce({
 *   delay: 400,
 *   onSearch: async (query, signal) => {
 *     const results = await searchAPI(query, { signal });
 *     setResults(results);
 *   },
 * });
 * 
 * // In input handler
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useSearchDebounce({
  delay = 400,
  onSearch,
}: UseSearchDebounceOptions): UseSearchDebounceReturn {
  const [query, setQuery] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancel = useCallback(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debouncedSearch = useCallback(
    (newQuery: string) => {
      // Cancel previous request
      cancel();

      setQuery(newQuery);

      // Create new AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Debounce the search
      timeoutRef.current = setTimeout(async () => {
        try {
          await onSearch(newQuery, controller.signal);
        } catch (error) {
          // Ignore AbortError (expected when request is cancelled)
          if (error instanceof Error && error.name !== 'AbortError') {
            // Log other errors but don't throw (let caller handle)
            const normalized = normalizeError(error, 'Search debounce error');
            logClientWarn('[useSearchDebounce] Search error', normalized, 'useSearchDebounce.onSearch', {
              component: 'useSearchDebounce',
              action: 'search-error',
              query: newQuery.slice(0, 100), // Limit query length for logging
            });
          }
        }
      }, delay);
    },
    [onSearch, delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    query,
    debouncedSearch,
    abortController: abortControllerRef.current,
    cancel,
  };
}
