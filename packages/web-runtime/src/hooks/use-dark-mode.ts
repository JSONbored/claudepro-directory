'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './use-local-storage.ts';

/**
 * Options for useDarkMode hook
 */
export interface UseDarkModeOptions {
  /**
   * Initial dark mode state
   * @default false
   */
  defaultValue?: boolean;
  /**
   * localStorage key for persistence
   * @default "usehooks-ts-dark-mode"
   */
  localStorageKey?: string;
  /**
   * Whether to read from localStorage on mount
   * @default true
   */
  initializeWithValue?: boolean;
  /**
   * Whether to apply 'dark' class to document root
   * @default true
   */
  applyDarkClass?: boolean;
}

/**
 * React hook for dark mode management with OS preference sync and localStorage persistence.
 *
 * Automatically syncs with OS preferences, persists user choice to localStorage, and
 * handles SSR hydration mismatches. Applies 'dark' class to document root for Tailwind
 * dark mode support.
 *
 * **When to use:**
 * - ✅ Theme switching - User-controlled dark/light mode toggles
 * - ✅ OS sync - Respecting and reacting to system preference changes
 * - ✅ Persistent themes - Saving user choice across browser sessions
 * - ✅ SSR applications - Server-side rendering without hydration mismatches
 * - ✅ Documentation sites - Reader-friendly theme options
 * - ✅ Dashboards - Professional apps with theme preferences
 * - ❌ For simple CSS-only dark mode - CSS media queries are simpler
 *
 * **Features:**
 * - Automatically syncs with OS `prefers-color-scheme` changes
 * - Persists user choice to localStorage across sessions
 * - Applies 'dark' class to `<html>` element for Tailwind dark mode
 * - SSR-safe with controlled hydration
 *
 * **Note:** This hook is for boolean dark mode. For ternary mode (light/dark/system),
 * use `useTernaryDarkMode` instead.
 *
 * @param options - Configuration options
 * @returns Object with `isDarkMode`, `toggle`, `enable`, `disable`, and `set` methods
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { isDarkMode, toggle } = useDarkMode();
 *
 * <button onClick={toggle}>
 *   {isDarkMode ? 'Light' : 'Dark'} Mode
 * </button>
 * ```
 *
 * @example
 * ```tsx
 * // With custom localStorage key
 * const { isDarkMode, enable, disable } = useDarkMode({
 *   localStorageKey: 'my-app-theme',
 * });
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe
 * const { isDarkMode } = useDarkMode({
 *   initializeWithValue: false,
 * });
 *
 * if (isDarkMode === undefined) return <Loading />;
 * ```
 */
export function useDarkMode(options: UseDarkModeOptions = {}) {
  const {
    defaultValue = false,
    localStorageKey = 'usehooks-ts-dark-mode',
    applyDarkClass = true,
  } = options;

  // Use useLocalStorage for persistent storage
  const { value: storedPreference, setValue: setStoredPreference } = useLocalStorage<string | null>(
    localStorageKey,
    {
      defaultValue: null,
      syncAcrossTabs: true,
    }
  );

  // Get initial OS preference
  const [osPreference, setOsPreference] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return defaultValue;
    }
  });

  // Compute isDarkMode: use stored preference if exists, otherwise use OS preference
  const isDarkMode = storedPreference !== null ? storedPreference === 'true' : osPreference;

  // Update stored preference when isDarkMode changes (user action)
  const setIsDarkMode = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(isDarkMode) : value;
      setStoredPreference(String(newValue));
    },
    [isDarkMode, setStoredPreference]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Apply dark class to document root
    if (applyDarkClass) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode, applyDarkClass]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Listen for OS preference changes
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (event: MediaQueryListEvent) => {
        // Only update OS preference if user hasn't manually set a preference
        // (storedPreference will be null if user hasn't set a preference)
        if (storedPreference === null) {
          setOsPreference(event.matches);
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
      }
    } catch {
      // Media query not supported
      return;
    }
  }, [storedPreference]);

  const toggle = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, [setIsDarkMode]);

  const enable = useCallback(() => {
    setIsDarkMode(true);
  }, [setIsDarkMode]);

  const disable = useCallback(() => {
    setIsDarkMode(false);
  }, [setIsDarkMode]);

  const set = useCallback(
    (value: boolean) => {
      setIsDarkMode(value);
    },
    [setIsDarkMode]
  );

  return {
    isDarkMode,
    toggle,
    enable,
    disable,
    set,
  } as const;
}
