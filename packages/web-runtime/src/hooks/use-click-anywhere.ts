'use client';

import { useEffect, useRef } from 'react';

/**
 * React hook for global click detection on the document.
 *
 * Tracks all clicks anywhere on the page, providing full MouseEvent details including
 * coordinates and target. Useful for complex click logic that needs to handle multiple
 * conditions or areas.
 *
 * **When to use:**
 * - ✅ Modal and dropdown closing - Detect clicks outside components
 * - ✅ Global analytics tracking - Monitor user interaction patterns
 * - ✅ Debugging and development - Track click events during development
 * - ✅ Custom context menus - Close menus on outside clicks with proper cleanup
 * - ✅ Interactive tutorials - Guide users through clicks with visual feedback
 * - ✅ Click-based games - Detect clicks anywhere for game mechanics
 * - ❌ For simple button clicks - Use `onClick` handlers instead
 *
 * **Features:**
 * - Document-wide click detection with automatic event listener attachment
 * - Full MouseEvent details (coordinates, target, button pressed)
 * - Automatic cleanup - Event listeners removed on unmount
 * - SSR compatible - Safely handles server-side rendering
 * - Lightweight implementation using optimized event listener patterns
 *
 * **Note:** For simple outside-click detection, `useOnClickOutside` is usually better.
 * Use this hook when you need complex click logic or want to track all clicks.
 *
 * @param handler - Function called when any click is detected on the document
 *
 * @example
 * ```tsx
 * // Close dropdown on outside click
 * useClickAnywhere((event) => {
 *   if (!dropdownRef.current?.contains(event.target as Node)) {
 *     setIsOpen(false);
 *   }
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Track click coordinates
 * useClickAnywhere((event) => {
 *   console.log(`Clicked at ${event.clientX}, ${event.clientY}`);
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Complex click logic
 * useClickAnywhere((event) => {
 *   if (event.target.closest('.modal') || event.target.closest('.tooltip')) {
 *     return; // Ignore clicks in these areas
 *   }
 *   // Handle other clicks
 * });
 * ```
 */
export function useClickAnywhere(handler: (event: MouseEvent) => void): void {
  const handlerRef = useRef(handler);

  // Store latest handler in ref to avoid stale closures
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      handlerRef.current(event);
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
}
