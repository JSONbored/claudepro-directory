'use client';

import { useCallback, useState } from 'react';

/**
 * React hook for managing boolean state with convenient helper methods.
 *
 * Provides a cleaner API than `useState(false)` with memoized helper functions
 * (`setTrue`, `setFalse`, `toggle`) that prevent unnecessary re-renders when
 * passed to child components.
 *
 * **When to use:**
 * - ✅ When you need boolean state with helper methods (setTrue, setFalse, toggle)
 * - ✅ When passing boolean setters to child components (memoized prevents re-renders)
 * - ✅ For modal dialogs, dropdowns, feature toggles, loading states
 * - ❌ For simple flags only the parent uses - `useState` is fine
 *
 * **Performance:**
 * - Helper functions are memoized with `useCallback` to prevent unnecessary
 *   child component re-renders when passed as props
 * - More efficient than inline arrow functions like `onClick={() => setIsOpen(true)}`
 *
 * @param defaultValue - Initial boolean value (default: `false`)
 * @returns Object with `value`, `setValue`, `setTrue`, `setFalse`, and `toggle` methods
 *
 * @example
 * ```tsx
 * // Modal dialog
 * const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useBoolean();
 *
 * <button onClick={openModal}>Open</button>
 * {isOpen && <Modal onClose={closeModal} />}
 * ```
 *
 * @example
 * ```tsx
 * // Toggle switch
 * const { value: isEnabled, toggle } = useBoolean(false);
 *
 * <Switch checked={isEnabled} onCheckedChange={toggle} />
 * ```
 *
 * @example
 * ```tsx
 * // Multiple independent boolean states
 * const modal = useBoolean();
 * const loading = useBoolean();
 * const darkMode = useBoolean(true);
 * ```
 */
export function useBoolean(defaultValue: boolean = false) {
  if (typeof defaultValue !== 'boolean') {
    throw new Error(
      `useBoolean: defaultValue must be a boolean, received ${typeof defaultValue}`
    );
  }

  const [value, setValue] = useState<boolean>(defaultValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle,
  } as const;
}
