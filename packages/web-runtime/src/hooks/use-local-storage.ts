'use client';

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { logger } from '../logger.ts';
import { ParseStrategy, safeParse } from '../data.ts';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

/**
 * Sensitive key patterns that should NEVER be stored in localStorage
 *
 * 🔒 SECURITY WARNING:
 * localStorage is NOT encrypted and is accessible to any JavaScript on the page (XSS attacks).
 * These patterns help detect accidental storage of sensitive data.
 *
 * @see {@link https://owasp.org/www-community/vulnerabilities/Cross_Site_Scripting_(XSS)}
 */
export const PROHIBITED_LOCALSTORAGE_PATTERNS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'auth',
  'jwt',
  'key',
  'api',
  'credential',
  'session',
  'cookie',
  'private',
  'ssn',
  'credit',
  'card',
  'cvv',
  'pin',
  'oauth',
  'refresh',
  'access',
] as const;

/**
 * Checks if a localStorage key contains sensitive patterns
 *
 * @param key - The localStorage key to validate
 * @returns true if key contains prohibited patterns, false otherwise
 *
 * @internal
 */
function containsSensitivePattern(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return PROHIBITED_LOCALSTORAGE_PATTERNS.some((pattern) => lowerKey.includes(pattern));
}

/**
 * Production-grade default deserializer
 * Uses safeParse with permissive schema for generic localStorage values
 *
 * @param value - Serialized string from localStorage
 * @returns Parsed value of type T
 *
 * @internal
 */
function safeDeserialize<T = unknown>(value: string): T {
  // Use safeParse with permissive unknown schema (client-safe VALIDATED_JSON strategy)
  return safeParse<T>(value, z.unknown() as z.ZodType<T>, {
    strategy: ParseStrategy.VALIDATED_JSON,
  });
}

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
 * 🔒 CRITICAL SECURITY WARNING:
 * localStorage is NOT encrypted and is vulnerable to XSS attacks. Any JavaScript running on your
 * page can access localStorage data. NEVER store sensitive data including:
 * - Passwords, API keys, tokens (JWT, OAuth, session, refresh tokens)
 * - Authentication credentials or session identifiers
 * - Private keys, secrets, or encryption keys
 * - Personal identifiable information (SSN, credit cards, etc.)
 * - Any data that could be exploited if stolen
 *
 * SAFE USE CASES:
 * ✅ User preferences (theme, language, display settings)
 * ✅ UI state (collapsed panels, selected tabs, filters)
 * ✅ Non-sensitive feature flags
 * ✅ Public data or anonymized analytics preferences
 *
 * For sensitive data, use:
 * - Secure, HttpOnly cookies (inaccessible to JavaScript)
 * - Server-side session storage
 * - Memory-only state (lost on page refresh, but safe from XSS)
 *
 * This hook includes runtime validation in development to warn about potentially sensitive keys.
 *
 * @typeParam T - Type of the value to store
 * @param {string} key - localStorage key to use for storage
 * @param {UseLocalStorageOptions<T>} [options] - Configuration options
 * @param {T} [options.defaultValue] - Default value if no stored value exists
 * @param {boolean} [options.syncAcrossTabs=true] - Enable cross-tab synchronization
 * @param {(value: T) => string} [options.serialize] - Custom serializer (default: JSON.stringify)
 * @param {(value: string) => T} [options.deserialize] - Custom deserializer (default: safeDeserialize with safeParse + Zod validation)
 *
 * @returns {UseLocalStorageReturn<T>} Object with value, setValue, removeValue, and error
 *
 * @see {@link PROHIBITED_LOCALSTORAGE_PATTERNS} for list of sensitive key patterns
 * @see {@link https://owasp.org/www-community/vulnerabilities/Cross_Site_Scripting_(XSS)}
 *
 * @example
 * ```tsx
 * // ✅ SAFE: Simple usage with primitive values (UI preferences)
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
    deserialize = safeDeserialize,
  } = options;

  // 🔒 SECURITY: Runtime validation for sensitive key patterns (development only)
  // Warn developers if they accidentally try to store sensitive data in localStorage
  if (isDevelopment && typeof window !== 'undefined') {
    if (containsSensitivePattern(key)) {
      logger.warn({ component: 'useLocalStorage',
          key,
          matchedPatterns: PROHIBITED_LOCALSTORAGE_PATTERNS.filter((p) =>
            key.toLowerCase().includes(p)
          ).join(', '),
          guidance:
            'localStorage is not encrypted; use HttpOnly cookies or server-side sessions for secrets.', }, 'localStorage key matches sensitive pattern. Avoid storing secrets in localStorage.');
    }
  }

  const [error, setError] = useState<Error | null>(null);

  // Initialize state with value from localStorage or default
  const [value, setValue] = useState<T>(() => {
    // SSR check
    if (typeof window === 'undefined') {
      return defaultValue as T;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Handle null or empty string
      if (item === null || item === '') {
        return defaultValue as T;
      }
      return deserialize(item);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      const itemValue = window.localStorage.getItem(key);
      logger.warn({ err: errorObj,
        category: 'storage',
        component: 'useLocalStorage',
        recoverable: true,
        action: 'initialize',
        key,
        item: itemValue ?? 'null', }, '[Storage] Failed to read from localStorage');
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
          logger.warn({ component: 'useLocalStorage',
            key, }, 'Attempted to write to localStorage during SSR');
          return;
        }

        // Save to localStorage
        window.localStorage.setItem(key, serialize(valueToStore));
        setError(null);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        // Enhanced error type detection
        let errorType = 'UNKNOWN';
        if (errorObj.name === 'QuotaExceededError' || errorObj.message.includes('quota')) {
          errorType = 'QUOTA_EXCEEDED';
        } else if (errorObj.name === 'SecurityError') {
          errorType = 'SECURITY_ERROR';
        } else if (errorObj.name === 'TypeError') {
          errorType = 'SERIALIZATION_ERROR';
        }

        logger.warn({ err: errorObj,
          category: 'storage',
          component: 'useLocalStorage',
          recoverable: true,
          action: 'setValue',
          key,
          errorType, }, '[Storage] Failed to write to localStorage');
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
        logger.warn({ component: 'useLocalStorage',
          key, }, 'Attempted to remove from localStorage during SSR');
        return;
      }

      window.localStorage.removeItem(key);
      setValue(defaultValue as T);
      setError(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.warn({ err: errorObj,
        category: 'storage',
        component: 'useLocalStorage',
        recoverable: true,
        action: 'removeValue',
        key, }, '[Storage] Failed to remove from localStorage');
      setError(errorObj);
    }
  }, [key, defaultValue]);

  // Sync across tabs/windows using storage event
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    // Mounted flag to prevent state updates after unmount
    let isMounted = true;

    const handleStorageChange = (e: StorageEvent) => {
      // Ignore events from wrong key or if component is unmounted
      if (e.key !== key || !isMounted) {
        return;
      }

      if (e.newValue !== null && e.newValue !== '') {
        try {
          const newValue = deserialize(e.newValue);

          // Update state (isMounted already checked in early return)
          setValue(newValue);
          setError(null);
        } catch (err) {
          const errorObj = err instanceof Error ? err : new Error(String(err));

          // Enhanced error logging with error type detection
          const errorType =
            errorObj.name === 'SyntaxError' ? 'JSON_PARSE_ERROR' : 'DESERIALIZE_ERROR';

          logger.warn(
            {
              err: errorObj,
              category: 'storage',
              component: 'useLocalStorage',
              recoverable: true,
              action: 'sync',
              key,
              errorType,
              newValue: e.newValue?.substring(0, 100), // Truncate for privacy
            },
            '[Storage] Failed to sync localStorage across tabs'
          );

          // Update state with error and fallback (isMounted already checked in early return)
          setError(errorObj);
          setValue(defaultValue as T);
        }
      } else if (e.newValue === null || e.newValue === '') {
        // Value was removed or empty in another tab (isMounted already checked in early return)
        setValue(defaultValue as T);
        setError(null);
      }
    };

    // Add storage event listener
    try {
      window.addEventListener('storage', handleStorageChange);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.warn(
        {
          err: errorObj,
          category: 'storage',
          component: 'useLocalStorage',
          recoverable: true,
          action: 'addEventListener',
          key,
        },
        '[Storage] Failed to add storage event listener'
      );
      setError(errorObj);
    }

    return () => {
      isMounted = false;
      try {
        window.removeEventListener('storage', handleStorageChange);
      } catch {
        // Silently handle removeEventListener errors (should never happen)
        logger.warn(
          { component: 'useLocalStorage', key },
          'Failed to remove storage event listener'
        );
      }
    };
  }, [key, defaultValue, deserialize, syncAcrossTabs]);

  return {
    value,
    setValue: updateValue,
    removeValue,
    error,
  };
}
