'use client';

/**
 * Web Vitals Reporter Component
 *
 * Client-side component that reports Core Web Vitals metrics.
 * This component should be included in the root layout.
 *
 * @see https://web.dev/vitals/
 */

import { useEffect } from 'react';

/**
 * WebVitalsReporter - Reports Core Web Vitals metrics
 *
 * This component initializes web-vitals reporting when mounted.
 * It only runs in the browser and silently fails if web-vitals can't be loaded.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    // OPTIMIZATION: Defer web-vitals initialization to avoid blocking initial render
    // Use requestIdleCallback to load and initialize web-vitals when browser is idle
    const initializeWebVitals = () => {
      // Dynamically import and initialize web-vitals reporting
      import('@/src/lib/analytics/web-vitals')
        .then(({ reportWebVitals }) => {
          reportWebVitals();
        })
        .catch(() => {
          // Silently fail if web-vitals can't be loaded
          // This prevents errors in environments where web-vitals isn't available
        });
    };

    // Defer to idle time to avoid blocking main thread
    if ('requestIdleCallback' in globalThis) {
      requestIdleCallback(initializeWebVitals, { timeout: 3000 });
    } else {
      // Fallback: defer with setTimeout after initial render
      setTimeout(initializeWebVitals, 100);
    }
  }, []);

  return null; // This component doesn't render anything
}
