'use client';

import { useCallback, useState } from 'react';

/**
 * React hook for managing boolean state with convenient helper methods.
 *
 * Provides a cleaner API than `useState(false)` with memoized helper functions
 * (`setTrue`, `setFalse`, `toggle`) that prevent unnecessary re-renders when
 * passed to child components.
 *
 * **Supports both object and array destructuring patterns:**
 * - Object pattern: `const { value, setTrue, setFalse, toggle } = useBoolean();`
 * - Array pattern: `const [value, toggle] = useBoolean();` (useState-like)
 *
 * **When to use:**
 * - ✅ When you need boolean state with helper methods (setTrue, setFalse, toggle)
 * - ✅ When passing boolean setters to child components (memoized prevents re-renders)
 * - ✅ For modal dialogs, dropdowns, feature toggles, loading states
 * - ✅ When you prefer useState-like array pattern
 * - ❌ For simple flags only the parent uses - `useState` is fine
 *
 * **Performance:**
 * - Helper functions are memoized with `useCallback` to prevent unnecessary
 *   child component re-renders when passed as props
 * - More efficient than inline arrow functions like `onClick={() => setIsOpen(true)}`
 *
 * @param defaultValue - Initial boolean value (default: `false`)
 * @returns Object with `value`, `setValue`, `setTrue`, `setFalse`, and `toggle` methods.
 *          Also supports array destructuring: `[value, toggle, setValue]`
 *
 * @example
 * ```tsx
 * // Object pattern - Modal dialog
 * const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useBoolean();
 *
 * <button onClick={openModal}>Open</button>
 * {isOpen && <Modal onClose={closeModal} />}
 * ```
 *
 * @example
 * ```tsx
 * // Array pattern - useState-like (replaces useToggle)
 * const [isOpen, toggleOpen] = useBoolean();
 *
 * <button onClick={toggleOpen}>
 *   {isOpen ? 'Close' : 'Open'}
 * </button>
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
    throw new Error(`useBoolean: defaultValue must be a boolean, received ${typeof defaultValue}`);
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

  // Create result object that supports both object and array destructuring
  const result = {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle,
    // Support array destructuring pattern (useState-like)
    // This allows: const [value, toggle] = useBoolean();
    // TypeScript will infer the tuple type from the array
    0: value,
    1: toggle,
    2: setValue,
    length: 3,
    [Symbol.iterator]: function* () {
      yield value;
      yield toggle;
      yield setValue;
    },
  } as {
    value: boolean;
    setValue: React.Dispatch<React.SetStateAction<boolean>>;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
    0: boolean;
    1: () => void;
    2: React.Dispatch<React.SetStateAction<boolean>>;
    length: 3;
    [Symbol.iterator]: () => Generator<
      boolean | (() => void) | React.Dispatch<React.SetStateAction<boolean>>,
      void,
      unknown
    >;
  } & [boolean, () => void, React.Dispatch<React.SetStateAction<boolean>>];

  return result;
}
