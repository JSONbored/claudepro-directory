'use client';

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/src/lib/logger';

/**
 * Options for configuring the localStorage hook behavior
 *
 * @typeParam T - Type of the stored value
 * @property {T} [defaultValue] - Default value if no stored value exists
 * @property {boolean} [syncAcrossTabs=true] - Whether to sync value across browser tabs
 * @property {(value: T) => string} [serialize] - Custom serialization function
 * @property {(value: string) => T} [deserialize] - Custom deserialization function
 */
export interface UseLocalStorageOptions<T> {
  defaultValue?: T;
  syncAcrossTabs?: boolean;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

/**
 * Return type for useLocalStorage hook
 *
 * @typeParam T - Type of the stored value
 * @property {T} value - Current stored value
 * @property {(value: T | ((prev: T) => T)) => void} setValue - Function to update stored value
 * @property {() => void} removeValue - Function to remove stored value
 * @property {Error | null} error - Error object if operation failed
 */
export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  error: Error | null;
}

/**
 * Custom hook for type-safe localStorage access with SSR support and cross-tab synchronization
 *
 * This hook provides a reactive interface to localStorage with automatic serialization,
 * deserialization, and synchronization across browser tabs. It handles SSR gracefully
 * and includes comprehensive error handling.
 *
 * @typeParam T - Type of the value to store
 * @param {string} key - localStorage key to use for storage
 * @param {UseLocalStorageOptions<T>} [options] - Configuration options
 * @param {T} [options.defaultValue] - Default value if no stored value exists
 * @param {boolean} [options.syncAcrossTabs=true] - Enable cross-tab synchronization
 * @param {(value: T) => string} [options.serialize] - Custom serializer (default: JSON.stringify)
 * @param {(value: string) => T} [options.deserialize] - Custom deserializer (default: JSON.parse)
 *
 * @returns {UseLocalStorageReturn<T>} Object with value, setValue, removeValue, and error
 *
 * @example
 * ```tsx
 * // Simple usage with primitive values
 * function UserPreferences() {
 *   const { value: theme, setValue: setTheme } = useLocalStorage('theme', {
 *     defaultValue: 'light'
 *   });
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 *
 * // Complex object storage
 * interface UserSettings {
 *   notifications: boolean;
 *   language: string;
 * }
 *
 * function Settings() {
 *   const { value, setValue, removeValue } = useLocalStorage<UserSettings>(
 *     'user-settings',
 *     {
 *       defaultValue: { notifications: true, language: 'en' },
 *       syncAcrossTabs: true
 *     }
 *   );
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={value.notifications}
 *           onChange={(e) => setValue(prev => ({
 *             ...prev,
 *             notifications: e.target.checked
 *           }))}
 *         />
 *         Enable notifications
 *       </label>
 *       <button onClick={removeValue}>Reset to defaults</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Custom serialization for Date objects
 * function DatePicker() {
 *   const { value, setValue } = useLocalStorage<Date>('selected-date', {
 *     defaultValue: new Date(),
 *     serialize: (date) => date.toISOString(),
 *     deserialize: (str) => new Date(str)
 *   });
 *
 *   return (
 *     <input
 *       type="date"
 *       value={value.toISOString().split('T')[0]}
 *       onChange={(e) => setValue(new Date(e.target.value))}
 *     />
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    defaultValue,
    syncAcrossTabs = true,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const [error, setError] = useState<Error | null>(null);

  // Initialize state with value from localStorage or default
  const [value, setValue] = useState<T>(() => {
    // SSR check
    if (typeof window === 'undefined') {
      return defaultValue as T;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue as T;
      }
      return deserialize(item);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to read from localStorage', errorObj, {
        component: 'useLocalStorage',
        action: 'initialize',
        key,
      });
      setError(errorObj);
      return defaultValue as T;
    }
  });

  // Update localStorage when value changes
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        // Handle functional updates
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;

        setValue(valueToStore);

        // SSR check
        if (typeof window === 'undefined') {
          logger.warn('Attempted to write to localStorage during SSR', {
            component: 'useLocalStorage',
            key,
          });
          return;
        }

        // Save to localStorage
        window.localStorage.setItem(key, serialize(valueToStore));
        setError(null);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to write to localStorage', errorObj, {
          component: 'useLocalStorage',
          action: 'setValue',
          key,
        });
        setError(errorObj);
      }
    },
    [key, serialize, value]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      // SSR check
      if (typeof window === 'undefined') {
        logger.warn('Attempted to remove from localStorage during SSR', {
          component: 'useLocalStorage',
          key,
        });
        return;
      }

      window.localStorage.removeItem(key);
      setValue(defaultValue as T);
      setError(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to remove from localStorage', errorObj, {
        component: 'useLocalStorage',
        action: 'removeValue',
        key,
      });
      setError(errorObj);
    }
  }, [key, defaultValue]);

  // Sync across tabs/windows using storage event
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserialize(e.newValue);
          setValue(newValue);
          setError(null);
        } catch (err) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          logger.error('Failed to sync localStorage across tabs', errorObj, {
            component: 'useLocalStorage',
            action: 'sync',
            key,
          });
          setError(errorObj);
        }
      } else if (e.key === key && e.newValue === null) {
        // Value was removed in another tab
        setValue(defaultValue as T);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, deserialize, syncAcrossTabs]);

  return {
    value,
    setValue: updateValue,
    removeValue,
    error,
  };
}
