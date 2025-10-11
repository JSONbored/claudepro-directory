/**
 * MSW Browser Setup
 *
 * Configures Mock Service Worker for browser environment (E2E tests, Storybook).
 * Uses Service Worker to intercept browser requests.
 *
 * **Usage:**
 * - Playwright E2E tests (optional, for API mocking in browser)
 * - Storybook integration (visual testing with mocked data)
 * - Development mode API mocking (MSW devtools)
 *
 * **Note:**
 * For most E2E tests, we use real API calls to test integration.
 * This is only needed for isolated component testing or when
 * external APIs are unavailable/flaky.
 *
 * **Setup:**
 * ```ts
 * // In app initialization or test setup
 * if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MSW_ENABLED) {
 *   const { worker } = await import('@/tests/mocks/browser');
 *   worker.start();
 * }
 * ```
 *
 * @see https://mswjs.io/docs/api/setup-worker
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Browser Worker
 *
 * Configured for browser environment.
 * Requires public/mockServiceWorker.js to be generated.
 */
export const worker = setupWorker(...handlers);

/**
 * Start worker with error handling
 *
 * Safe to call in development, no-op in production.
 */
export async function startMocking() {
  if (typeof window === 'undefined') {
    // Server-side, use Node.js server instead
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    // Never mock in production
    return;
  }

  try {
    await worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });

    console.info('[MSW] Browser mocking enabled');
  } catch (error) {
    console.error('[MSW] Failed to start browser mocking:', error);
  }
}

/**
 * Stop worker (cleanup)
 */
export function stopMocking() {
  if (typeof window !== 'undefined') {
    worker.stop();
  }
}
