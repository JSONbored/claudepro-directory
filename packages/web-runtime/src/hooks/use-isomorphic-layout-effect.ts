'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * React hook for SSR-safe layout effects.
 *
 * Automatically uses `useLayoutEffect` in the browser (for synchronous DOM access)
 * and `useEffect` on the server (to prevent hydration warnings). Drop-in replacement
 * for `useLayoutEffect` that works in SSR environments like Next.js.
 *
 * **When to use:**
 * - ✅ DOM measurements - Element dimensions and positioning calculations
 * - ✅ Animation setup - Initial animation states before browser paint
 * - ✅ Theme initialization - Synchronous theme application to prevent flash
 * - ✅ Layout calculations - Responsive behavior based on element sizes
 * - ✅ Scroll positioning - Restoring scroll positions after navigation
 * - ✅ Focus management - Setting focus states that need immediate DOM access
 * - ❌ For async operations - Regular `useEffect` is better for API calls
 *
 * **Features:**
 * - SSR-safe - Uses useEffect on server, useLayoutEffect in browser
 * - Hydration warning prevention - No "useLayoutEffect does nothing on the server" warnings
 * - Drop-in replacement - Same API as useLayoutEffect
 * - Zero runtime overhead - Compile-time environment detection
 *
 * **Note:** This is still a layout effect in the browser, which can block rendering
 * if your effect is expensive. Keep layout effects fast to avoid blocking the UI.
 *
 * @param effect - The effect function to run
 * @param deps - Optional dependency array
 *
 * @example
 * ```tsx
 * // DOM measurements
 * useIsomorphicLayoutEffect(() => {
 *   const rect = elementRef.current?.getBoundingClientRect();
 *   setDimensions({ width: rect?.width, height: rect?.height });
 * }, []);
 * ```
 *
 * @example
 * ```tsx
 * // Theme initialization
 * useIsomorphicLayoutEffect(() => {
 *   const theme = localStorage.getItem('theme');
 *   document.documentElement.setAttribute('data-theme', theme || 'light');
 * }, []);
 * ```
 *
 * @example
 * ```tsx
 * // Animation setup
 * useIsomorphicLayoutEffect(() => {
 *   if (elementRef.current) {
 *     elementRef.current.style.transform = 'translateX(0)';
 *   }
 * }, []);
 * ```
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
