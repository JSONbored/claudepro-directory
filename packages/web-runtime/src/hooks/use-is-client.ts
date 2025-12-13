'use client';

import { useEffect, useState } from 'react';

/**
 * React hook for client-side detection to prevent SSR hydration mismatches.
 *
 * Returns `false` during SSR and before hydration, then `true` after the component
 * mounts on the client. Essential for safely accessing browser APIs without causing
 * hydration errors.
 *
 * **When to use:**
 * - ✅ Browser API access - Window, document, navigator objects safely
 * - ✅ localStorage operations - Read/write browser storage without crashes
 * - ✅ Client-only features - Geolocation, clipboard, notifications
 * - ✅ Third-party scripts - Load analytics or client-only libraries
 * - ✅ Responsive detection - JavaScript-based media query handling
 * - ✅ Random content - Generate client-side values without hydration errors
 * - ❌ For most React code - Most React code works fine on both server and client
 *
 * **Features:**
 * - SSR compatible - Prevents hydration mismatches in server-side rendered apps
 * - Simple boolean API - Returns true when browser APIs are safely available
 * - Hydration safe - Starts as false, becomes true after client hydration
 * - Zero dependencies - Lightweight hook using only React primitives
 * - Performance optimized - Uses useEffect for minimal overhead
 *
 * **Important:** Always provide fallback content during SSR. Show loading states,
 * skeletons, or safe defaults when `isClient` is `false`. Don't just render nothing
 * - it causes layout shift.
 *
 * @returns Boolean indicating whether the code is running on the client side
 *
 * @example
 * ```tsx
 * // Browser API access
 * const isClient = useIsClient();
 *
 * if (!isClient) return <Loading />;
 * const userAgent = window.navigator.userAgent;
 * ```
 *
 * @example
 * ```tsx
 * // localStorage access
 * const isClient = useIsClient();
 *
 * if (isClient) {
 *   const theme = localStorage.getItem('theme');
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Random content without hydration errors
 * const isClient = useIsClient();
 * const randomValue = isClient ? Math.random() : 0;
 *
 * <div>Random: {randomValue}</div>
 * ```
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
