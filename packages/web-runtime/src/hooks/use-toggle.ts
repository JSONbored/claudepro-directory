'use client';

import { useCallback, useState } from 'react';

/**
 * React hook for boolean toggle state management with useState-like array pattern.
 *
 * Provides a simple, performant alternative to `useState(false)` with a memoized
 * toggle function. Returns an array `[value, toggle, setValue]` matching useState pattern.
 *
 * **When to use:**
 * - ✅ Feature flags and UI toggles
 * - ✅ Show/hide modals, expand/collapse panels, sidebar states
 * - ✅ Theme switching, layout preferences, display options
 * - ✅ Form checkbox states, switch controls, boolean fields
 * - ✅ Settings management, user preferences, configuration toggles
 * - ✅ Dropdown menus, accordion panels, tab visibility
 * - ❌ For complex state management - use `useState` or state management library
 *
 * **Performance:**
 * - Toggle function is memoized with `useCallback` to prevent unnecessary
 *   child component re-renders when passed as props
 * - Stable function reference across re-renders
 *
 * @param defaultValue - Initial toggle state (default: `false`)
 * @returns Tuple `[value, toggle, setValue]` matching useState pattern
 *
 * @example
 * ```tsx
 * // Array destructuring (useState-like)
 * const [isOpen, toggleOpen] = useToggle();
 *
 * <button onClick={toggleOpen}>
 *   {isOpen ? 'Close' : 'Open'}
 * </button>
 * ```
 *
 * @example
 * ```tsx
 * // Named destructuring
 * const [visible, setVisible, toggleVisible] = useToggle();
 *
 * <button onClick={toggleVisible}>Toggle</button>
 * ```
 *
 * @example
 * ```tsx
 * // Multiple independent toggles
 * const [modal, toggleModal] = useToggle();
 * const [sidebar, toggleSidebar] = useToggle();
 * ```
 */
export function useToggle(defaultValue: boolean = false) {
  if (typeof defaultValue !== 'boolean') {
    throw new Error(
      `useToggle: defaultValue must be a boolean, received ${typeof defaultValue}`
    );
  }

  const [value, setValue] = useState<boolean>(defaultValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue] as const;
}
