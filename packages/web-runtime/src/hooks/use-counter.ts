'use client';

import { useCallback, useState } from 'react';

/**
 * React hook for managing numeric counter state with increment, decrement, and reset controls.
 *
 * Provides a cleaner API than `useState(0)` with memoized helper functions that prevent
 * unnecessary re-renders when passed to child components.
 *
 * **When to use:**
 * - ✅ Shopping cart quantity controls
 * - ✅ Game score tracking, lives, multipliers
 * - ✅ Form numeric steppers and quantity selectors
 * - ✅ Dashboard counters and statistics
 * - ✅ Pagination page number controls
 * - ❌ For simple display-only numbers - `useState` is fine
 *
 * **Performance:**
 * - Helper functions are memoized with `useCallback` to prevent unnecessary
 *   child component re-renders when passed as props
 * - More efficient than inline arrow functions like `onClick={() => setCount(count + 1)}`
 *
 * **Note:** No built-in min/max bounds checking. Add validation in your component:
 * ```tsx
 * onClick={() => count < max && increment()}
 * ```
 *
 * @param initialValue - Starting value for the counter (default: `0`)
 * @returns Object with `count`, `increment`, `decrement`, `reset`, and `setCount` methods
 *
 * @example
 * ```tsx
 * // Shopping cart quantity
 * const { count, increment, decrement } = useCounter(1);
 *
 * <button onClick={decrement} disabled={count <= 1}>-</button>
 * <span>{count}</span>
 * <button onClick={increment} disabled={count >= maxStock}>+</button>
 * ```
 *
 * @example
 * ```tsx
 * // Custom step size
 * const { count, setCount } = useCounter(0);
 *
 * <button onClick={() => setCount(prev => prev + 5)}>+5</button>
 * ```
 *
 * @example
 * ```tsx
 * // Multiple independent counters
 * const counter1 = useCounter(0);
 * const counter2 = useCounter(10);
 * ```
 */
export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState<number>(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
  } as const;
}
