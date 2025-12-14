'use client';

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../logger.ts';

/**
 * Options for useSessionStorage hook
 */
export interface UseSessionStorageOptions<T> {
  /**
   * Custom function to serialize values before storage
   * @default JSON.stringify
   */
  serializer?: (value: T) => string;
  /**
   * Custom function to deserialize values from storage
   * @default JSON.parse
   */
  deserializer?: (value: string) => T;
  /**
   * Whether to initialize with stored value immediately
   * Set to `false` for SSR to prevent hydration mismatches
   * @default true
   */
  initializeWithValue?: boolean;
}

/**
 * React hook for sessionStorage management with automatic serialization and state synchronization.
 *
 * Provides a useState-like API that automatically handles serialization, error recovery, and
 * cross-component synchronization. Data persists across page reloads within the same browser
 * tab but is cleared when the tab is closed.
 *
 * **When to use:**
 * - ✅ Form draft saving - Preserve form inputs during page reloads and navigation
 * - ✅ Shopping cart sessions - Maintain cart items during the browsing session
 * - ✅ Multi-step wizards - Save progress through complex form workflows
 * - ✅ User preferences - Store temporary UI settings and theme choices
 * - ✅ Search filters - Remember applied filters and sorting across page loads
 * - ✅ Draft content - Preserve unsaved articles, comments, or message drafts
 * - ❌ For data that should persist across browser sessions - use `useLocalStorage` instead
 *
 * **Key Differences from localStorage:**
 * - sessionStorage is tab-specific (data not shared across tabs)
 * - Data is cleared when tab is closed
 * - Perfect for temporary session data
 *
 * **Features:**
 * - Automatic JSON serialization/deserialization
 * - Cross-component synchronization (updates when other components change same key)
 * - SSR-safe with controlled hydration
 * - Graceful error handling with fallbacks
 * - Custom serializers for complex types (dates, etc.)
 *
 * @typeParam T - Type of the value to store
 * @param key - Storage key for the sessionStorage item
 * @param initialValue - Initial value or function returning initial value
 * @param options - Configuration options
 * @returns Tuple `[value, setValue, removeValue]` where setValue works like useState
 *
 * @example
 * ```tsx
 * // Form draft saving
 * const [draft, setDraft, removeDraft] = useSessionStorage('form-draft', {
 *   title: '',
 *   content: '',
 * });
 *
 * // Auto-saves on change
 * <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
 * ```
 *
 * @example
 * ```tsx
 * // Custom serializer for dates
 * const [lastVisit, setLastVisit] = useSessionStorage<Date>('last-visit', new Date(), {
 *   serializer: (date) => date.toISOString(),
 *   deserializer: (str) => new Date(str),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe
 * const [cart, setCart] = useSessionStorage('cart', [], {
 *   initializeWithValue: false,
 * });
 *
 * if (cart === undefined) return <Loading />;
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseSessionStorageOptions<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    initializeWithValue = true,
  } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }

    if (!initializeWithValue) {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue;
      }
      return deserializer(item);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.warn({ err: errorObj,
        category: 'storage',
        component: 'useSessionStorage',
        recoverable: true,
        action: 'initialize',
        key, }, `Error reading sessionStorage key "${key}"`);
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, serializer(valueToStore));
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.warn({ err: errorObj,
          category: 'storage',
          component: 'useSessionStorage',
          recoverable: true,
          action: 'setValue',
          key, }, `Error setting sessionStorage key "${key}"`);
      }
    },
    [key, serializer, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      );
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.warn({ err: errorObj,
        category: 'storage',
        component: 'useSessionStorage',
        recoverable: true,
        action: 'removeValue',
        key, }, `Error removing sessionStorage key "${key}"`);
    }
  }, [key, initialValue]);

  // Listen for changes from other components/tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.sessionStorage) {
        try {
          setStoredValue(e.newValue ? deserializer(e.newValue) : initialValue);
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          logger.warn({ err: errorObj,
            category: 'storage',
            component: 'useSessionStorage',
            recoverable: true,
            action: 'handleStorageChange',
            key, }, `Error reading sessionStorage key "${key}"`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer, initialValue]);

  return [storedValue, setValue, removeValue];
}
