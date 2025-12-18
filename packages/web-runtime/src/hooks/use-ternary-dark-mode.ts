'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from './use-local-storage.ts';

/**
 * Ternary dark mode value: 'system', 'dark', or 'light'
 */
export type TernaryDarkMode = 'system' | 'dark' | 'light';

/**
 * Options for useTernaryDarkMode hook
 */
export interface TernaryDarkModeOptions {
  /**
   * Initial theme mode value
   * @default "system"
   */
  defaultValue?: TernaryDarkMode;
  /**
   * localStorage key for persistence
   * @default "use-ternary-dark-mode"
   */
  localStorageKey?: string;
  /**
   * Whether to initialize with stored value
   * Set to `false` for SSR to prevent hydration mismatches
   * @default true
   */
  initializeWithValue?: boolean;
}

/**
 * React hook for ternary dark mode management (light/dark/system).
 *
 * Provides three modes: 'light' (force light), 'dark' (force dark), and 'system'
 * (follow OS preference). Automatically syncs with OS preference changes when in
 * 'system' mode and persists user choice to localStorage.
 *
 * **When to use:**
 * - ✅ Application themes - Provide light, dark, and auto modes for user preference
 * - ✅ Dashboard interfaces - Let users choose themes while respecting system settings
 * - ✅ Accessibility compliance - Support system-level dark mode preferences automatically
 * - ✅ User preference systems - Remember theme choices across browser sessions
 * - ✅ Multi-tenant applications - Consistent theme management across different environments
 * - ✅ Developer tools - Provide theme options that match user's development environment
 * - ❌ For simple light/dark toggles - `useDarkMode` or `useBoolean` are simpler
 *
 * **Features:**
 * - Three modes: 'light', 'dark', 'system'
 * - Automatically syncs with OS `prefers-color-scheme` when in 'system' mode
 * - Persists user choice to localStorage across sessions
 * - Computed `isDarkMode` boolean based on current mode and system preference
 * - SSR-safe with controlled hydration
 *
 * @param options - Configuration options
 * @returns Object with `isDarkMode`, `ternaryDarkMode`, `setTernaryDarkMode`, and `toggleTernaryDarkMode`
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { isDarkMode, toggleTernaryDarkMode } = useTernaryDarkMode();
 *
 * <button onClick={toggleTernaryDarkMode}>
 *   {ternaryDarkMode === 'system' ? 'Auto' : ternaryDarkMode === 'dark' ? 'Dark' : 'Light'}
 * </button>
 * ```
 *
 * @example
 * ```tsx
 * // Apply to Tailwind
 * const { isDarkMode } = useTernaryDarkMode();
 *
 * <div className={isDarkMode ? 'dark' : ''}>
 *   <div className="bg-white dark:bg-black">...</div>
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe
 * const { isDarkMode } = useTernaryDarkMode({
 *   initializeWithValue: false,
 * });
 *
 * if (isDarkMode === undefined) return <Loading />;
 * ```
 */
export function useTernaryDarkMode(
  options: TernaryDarkModeOptions = {}
): {
  isDarkMode: boolean;
  ternaryDarkMode: TernaryDarkMode;
  setTernaryDarkMode: React.Dispatch<React.SetStateAction<TernaryDarkMode>>;
  toggleTernaryDarkMode: () => void;
} {
  const {
    defaultValue = 'system',
    localStorageKey = 'use-ternary-dark-mode',
    // Note: initializeWithValue is part of the API but not used internally
    // useLocalStorage always initializes with defaultValue
    // initializeWithValue: _initializeWithValue = true,
  } = options;

  // Use useLocalStorage for persistent storage
  // Note: useLocalStorage always initializes with defaultValue, so initializeWithValue is handled
  const { value: storedMode, setValue: setStoredMode } = useLocalStorage<TernaryDarkMode>(
    localStorageKey,
    {
      defaultValue,
      syncAcrossTabs: true,
    }
  );

  // Use stored mode (useLocalStorage returns defaultValue if not found)
  const ternaryDarkMode = storedMode;
  const setTernaryDarkMode = setStoredMode;

  const [systemPreference, setSystemPreference] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Compute isDarkMode based on mode and system preference
  const isDarkMode =
    ternaryDarkMode === 'dark' ||
    (ternaryDarkMode === 'system' && systemPreference);

  // useLocalStorage handles persistence automatically, no need for separate useEffect

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Listen for OS preference changes
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (event: MediaQueryListEvent) => {
        setSystemPreference(event.matches);
      };

      // Set initial value
      setSystemPreference(mediaQuery.matches);

      // Listen for changes
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
  }, []);

  const toggleTernaryDarkMode = () => {
    setTernaryDarkMode((prev) => {
      if (prev === 'light') return 'system';
      if (prev === 'system') return 'dark';
      return 'light';
    });
  };

  return {
    isDarkMode,
    ternaryDarkMode,
    setTernaryDarkMode,
    toggleTernaryDarkMode,
  };
}
