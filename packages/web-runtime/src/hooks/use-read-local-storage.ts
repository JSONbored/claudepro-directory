'use client';

import { useEffect, useState } from 'react';
import { logger } from '../logger.ts';

/**
 * Options for useReadLocalStorage hook
 */
export interface UseReadLocalStorageOptions<T> {
  /**
   * Custom function to deserialize values from storage
   * @default JSON.parse
   */
  deserializer?: (value: string) => T;
  /**
   * Whether to initialize with localStorage value
   * Set to `false` for SSR to prevent hydration mismatches
   * @default true
   */
  initializeWithValue?: boolean;
}

/**
 * React hook for read-only localStorage access with reactive updates.
 *
 * Lightweight alternative to `useLocalStorage` when you only need to read values
 * and react to changes. Automatically updates when localStorage changes in other
 * components or browser tabs.
 *
 * **When to use:**
 * - ✅ User preference displays - Show current theme, language, or layout settings
 * - ✅ Authentication status - Display login state and user information from tokens
 * - ✅ Shopping cart indicators - Show cart item counts and totals in navigation
 * - ✅ Feature flag reading - Check enabled features without modification capabilities
 * - ✅ Recent activity - Display browsing history or recently viewed items
 * - ✅ Form draft recovery - Show saved draft indicators without editing the drafts
 * - ❌ When you need to write to localStorage - use `useLocalStorage` instead
 *
 * **Performance:**
 * - Only reads localStorage once on mount, then uses storage events for updates
 * - Much better performance than calling `localStorage.getItem()` on every render
 * - Automatically reacts to changes from other components or browser tabs
 *
 * **Return Values:**
 * - `undefined` - During SSR when `initializeWithValue: false`
 * - `null` - Key doesn't exist or error occurred
 * - `T` - The stored value
 *
 * @typeParam T - Type of the stored value
 * @param key - The localStorage key to read from
 * @param options - Configuration options
 * @returns The stored value, `null` if not found/error, or `undefined` during SSR
 *
 * @example
 * ```tsx
 * // Display user preference
 * const theme = useReadLocalStorage<string>('theme');
 *
 * <div>Current theme: {theme ?? 'default'}</div>
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe with loading state
 * const cartCount = useReadLocalStorage<number>('cart-count', {
 *   initializeWithValue: false,
 * });
 *
 * if (cartCount === undefined) return <Loading />;
 * <Badge>{cartCount ?? 0}</Badge>
 * ```
 *
 * @example
 * ```tsx
 * // Custom deserializer for dates
 * const lastVisit = useReadLocalStorage<Date>('last-visit', {
 *   deserializer: (str) => new Date(str),
 * });
 * ```
 */
export function useReadLocalStorage<T>(
  key: string,
  options: UseReadLocalStorageOptions<T> = {}
): T | null | undefined {
  const { deserializer = JSON.parse, initializeWithValue = true } = options;

  const [storedValue, setStoredValue] = useState<T | null | undefined>(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!initializeWithValue) {
      return undefined;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return deserializer(item);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        {
          err: errorObj,
          category: 'storage',
          component: 'useReadLocalStorage',
          recoverable: true,
          action: 'initialize',
          key,
        },
        `Error reading localStorage key "${key}"`
      );
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const readValue = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item === null) {
          setStoredValue(null);
        } else {
          setStoredValue(deserializer(item));
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          {
            err: errorObj,
            category: 'storage',
            component: 'useReadLocalStorage',
            recoverable: true,
            action: 'readValue',
            key,
          },
          `Error reading localStorage key "${key}"`
        );
        setStoredValue(null);
      }
    };

    // Read initial value if not already set
    if (initializeWithValue && storedValue === undefined) {
      readValue();
    }

    // Listen for storage events (changes from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        readValue();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer, initializeWithValue, storedValue]);

  return storedValue;
}
