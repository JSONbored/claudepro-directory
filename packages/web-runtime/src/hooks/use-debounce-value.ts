'use client';

import { useEffect, useState } from 'react';

/**
 * Options for useDebounceValue hook
 */
export interface UseDebounceValueOptions<T> {
  /**
   * Invoke on the leading edge of the timeout
   * @default false
   */
  leading?: boolean;
  /**
   * Invoke on the trailing edge of the timeout
   * @default true
   */
  trailing?: boolean;
  /**
   * Maximum time function is allowed to be delayed
   */
  maxWait?: number;
  /**
   * Function to determine if value has changed
   * @default === (strict equality)
   */
  equalityFn?: (left: T, right: T) => boolean;
}

/**
 * React hook for debounced state management.
 *
 * Provides a useState-like interface with built-in debouncing. The value updates are
 * delayed until the user stops changing the input, preventing excessive operations.
 *
 * **When to use:**
 * - ✅ Search inputs - Debounce API calls until user stops typing
 * - ✅ Form validation - Delay expensive checks until user pauses editing
 * - ✅ Auto-save functionality - Batch save operations with configurable delays
 * - ✅ Slider and range inputs - Smooth performance for continuous value changes
 * - ✅ Filter controls - Debounce complex filtering on large datasets
 * - ✅ Live previews - Optimize preview updates without hammering renders
 * - ✅ Username availability - Check availability without spamming the server
 * - ❌ For simple inputs that don't trigger expensive operations - `useState` is fine
 *
 * **Key Differences:**
 * - `useDebounceValue` - Debounces state changes (delayed value)
 * - `useDebounceCallback` - Debounces function calls (delayed execution)
 *
 * **Performance:**
 * - Prevents excessive API calls or expensive operations
 * - Configurable delay timing for different use cases
 * - Custom equality functions for complex objects
 *
 * @typeParam T - Type of the value to debounce
 * @param initialValue - The initial value or a function that returns the initial value
 * @param delay - The delay in milliseconds before the value updates (default: 500ms)
 * @param options - Optional configurations for debouncing behavior
 * @returns Tuple `[debouncedValue, setValue]` where setValue works like useState
 *
 * @example
 * ```tsx
 * // Search input with debounced API call
 * const [searchTerm, setSearchTerm] = useDebounceValue('', 300);
 *
 * useEffect(() => {
 *   if (searchTerm) {
 *     searchAPI(searchTerm);
 *   }
 * }, [searchTerm]);
 *
 * <input value={immediateValue} onChange={(e) => setSearchTerm(e.target.value)} />
 * ```
 *
 * @example
 * ```tsx
 * // Custom equality for objects
 * const [filters, setFilters] = useDebounceValue({ category: '', tags: [] }, 500, {
 *   equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
 * });
 * ```
 */
export function useDebounceValue<T>(
  initialValue: T | (() => T),
  delay: number = 500,
  options: UseDebounceValueOptions<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { equalityFn = (a, b) => a === b } = options;

  const [value, setValue] = useState<T>(
    typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
  );
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Check if value actually changed
    if (equalityFn(value, debouncedValue)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay, debouncedValue, equalityFn]);

  return [debouncedValue, setValue];
}
