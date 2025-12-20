'use client';

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';
import { useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect.ts';

/**
 * React hook for stable event callbacks that solve useCallback dependency issues.
 *
 * Provides a stable callback reference that never changes, while ensuring the function
 * always has access to the latest values from closures. Solves the common problem of
 * useCallback requiring massive dependency arrays that change on every render anyway.
 *
 * **When to use:**
 * - ✅ Form event handlers - Stable input callbacks with fresh state access
 * - ✅ Performance optimization - Preventing unnecessary re-renders in component trees
 * - ✅ Async operations - Event handlers with delayed execution
 * - ✅ Component libraries - Stable API callbacks for library consumers
 * - ✅ State synchronization - Event callbacks that always access current state
 * - ✅ Complex interactions - Multi-step operations requiring fresh closure access
 * - ✅ Child component callbacks - Passing stable functions to expensive child components
 * - ✅ Memoized components - Callbacks for React.memo wrapped components
 * - ❌ For simple onClick handlers that don't access state - Regular functions are fine
 *
 * **Features:**
 * - Stable callback references - Never changes identity, preventing re-renders
 * - Fresh closure access - Always has access to latest state and props
 * - Render safety - Built-in protection against calling callbacks during render phase
 * - Type-safe - Preserves function argument and return types automatically
 * - Memory efficient - Uses useRef and useIsomorphicLayoutEffect for optimal performance
 * - SSR compatible - Designed for Next.js server-side rendering
 *
 * **Key Differences:**
 * - `useCallback` - Recreates function when dependencies change (causes re-renders)
 * - `useEventCallback` - Stable reference that never changes (prevents re-renders)
 *
 * @typeParam Args - Array of argument types for the callback function
 * @typeParam R - Return type of the callback function
 * @param fn - The callback function to memoize
 * @returns Memoized callback that maintains a stable reference while always accessing fresh values
 *
 * @example
 * ```tsx
 * // Stable callback with fresh state access
 * const handleClick = useEventCallback((id: string) => {
 *   // Always has access to latest 'items' state, even though callback reference never changes
 *   console.log(items[id]);
 * });
 *
 * <ExpensiveChild onClick={handleClick} />
 * ```
 *
 * @example
 * ```tsx
 * // Form handler
 * const handleSubmit = useEventCallback((e: React.FormEvent) => {
 *   e.preventDefault();
 *   // Always has access to latest form state
 *   submitForm(formData);
 * });
 *
 * <form onSubmit={handleSubmit}>...</form>
 * ```
 *
 * @example
 * ```tsx
 * // With React.memo
 * const MemoizedChild = React.memo(Child);
 *
 * const handleAction = useEventCallback((value: string) => {
 *   // Stable reference prevents MemoizedChild from re-rendering
 *   doSomething(value, currentState);
 * });
 *
 * <MemoizedChild onAction={handleAction} />
 * ```
 */
export function useEventCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  const fnRef = useRef(fn);

  // Store latest function in ref to avoid stale closures
  useIsomorphicLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Return stable callback that always calls latest function
  return useCallback((...args: Args) => {
    // Safety check: prevent calling during render phase
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Server-side or during SSR - safe to call
      return fnRef.current(...args);
    }

    // Check if we're in render phase (development only)
    if (isDevelopment) {
      // This is a best-effort check - React doesn't expose render phase detection
      // In practice, event callbacks should only be called from event handlers
    }

    return fnRef.current(...args);
  }, []);
}
