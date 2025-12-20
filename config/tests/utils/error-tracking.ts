/**
 * Playwright Error Tracking Utilities
 *
 * Provides shared error tracking setup for Playwright tests to eliminate
 * duplication across 61+ test files. Tracks console errors/warnings and
 * network failures, with configurable filtering for acceptable errors.
 *
 * @example
 * ```typescript
 * import { setupErrorTracking } from '@/config/tests/utils/error-tracking';
 *
 * test.describe('MyPage', () => {
 *   let cleanupErrorTracking: (() => void) | undefined;
 *
 *   test.beforeEach(async ({ page }) => {
 *     cleanupErrorTracking = setupErrorTracking(page);
 *     await page.goto('/my-page');
 *   });
 *
 *   test.afterEach(async () => {
 *     if (cleanupErrorTracking) {
 *       cleanupErrorTracking();
 *     }
 *   });
 * });
 * ```
 */

import type { Page } from '@playwright/test';

/**
 * Configuration options for error tracking
 */
export interface ErrorTrackingOptions {
  /**
   * List of error message substrings to ignore (case-insensitive)
   * Default: Common acceptable errors like metadata warnings
   */
  acceptableErrors?: string[];

  /**
   * List of warning message substrings to ignore (case-insensitive)
   * Default: Common acceptable warnings like hydration mismatches
   */
  acceptableWarnings?: string[];

  /**
   * List of URL substrings to ignore for network failures (case-insensitive)
   * Default: Non-critical URLs like analytics, favicon
   */
  nonCriticalUrls?: string[];
}

/**
 * Default acceptable error filters
 *
 * These are common errors that are acceptable in tests and don't indicate
 * actual problems with the application.
 */
const DEFAULT_ACCEPTABLE_ERRORS = [
  'Only plain objects',
  'background:',
  'background-color:',
  'Feature-Policy',
] as const;

/**
 * Default acceptable warning filters
 *
 * These are common warnings that are acceptable in tests and don't indicate
 * actual problems with the application.
 */
const DEFAULT_ACCEPTABLE_WARNINGS = [
  'apple-mobile-web-app-capable',
  'Feature-Policy',
  'hydrated but some attributes', // Hydration warnings from React (known issue)
  'hydration-mismatch', // Hydration mismatch warnings
] as const;

/**
 * Default non-critical URL filters
 *
 * These URLs are not critical for test functionality and can fail without
 * indicating a problem with the application.
 */
const DEFAULT_NON_CRITICAL_URLS = ['analytics', 'umami', 'vercel', 'favicon'] as const;

/**
 * Set up error tracking for a Playwright page
 *
 * Tracks:
 * - Console errors (filtered by acceptableErrors)
 * - Console warnings (filtered by acceptableWarnings)
 * - Page errors (uncaught exceptions)
 * - Network failures (filtered by nonCriticalUrls)
 *
 * Returns a cleanup function that should be called in `afterEach` to
 * check for errors and throw if any are found.
 *
 * @param page - Playwright page instance
 * @param options - Configuration options for error tracking
 * @returns Cleanup function that throws if errors are detected
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   const cleanup = setupErrorTracking(page);
 *   // Store cleanup for afterEach
 *   (page as any).__errorTrackingCleanup = cleanup;
 * });
 *
 * test.afterEach(async ({ page }) => {
 *   const cleanup = (page as any).__errorTrackingCleanup;
 *   if (cleanup) cleanup();
 * });
 * ```
 */
export function setupErrorTracking(page: Page, options: ErrorTrackingOptions = {}): () => void {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const networkErrors: string[] = [];

  // Use provided options or defaults
  const acceptableErrors = options.acceptableErrors ?? [...DEFAULT_ACCEPTABLE_ERRORS];
  const acceptableWarnings = options.acceptableWarnings ?? [...DEFAULT_ACCEPTABLE_WARNINGS];
  const nonCriticalUrls = options.nonCriticalUrls ?? [...DEFAULT_NON_CRITICAL_URLS];

  // Helper to check if text matches any filter (case-insensitive)
  const matchesFilter = (text: string, filters: readonly string[]): boolean => {
    return filters.some((filter) => text.toLowerCase().includes(filter.toLowerCase()));
  };

  // Track console errors
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      if (!matchesFilter(text, acceptableErrors)) {
        consoleErrors.push(text);
      }
    } else if (msg.type() === 'warning') {
      if (!matchesFilter(text, acceptableWarnings)) {
        consoleWarnings.push(text);
      }
    }
  });

  // Track page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  // Track network failures
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!matchesFilter(url, nonCriticalUrls)) {
      networkErrors.push(`${url} - ${request.failure()?.errorText || 'Failed'}`);
    }
  });

  // Return cleanup function that throws on errors
  return () => {
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Test failed due to console errors: ${consoleErrors.join('; ')}`);
    }

    if (consoleWarnings.length > 0) {
      console.warn('Console warnings detected:', consoleWarnings);
      throw new Error(`Test failed due to console warnings: ${consoleWarnings.join('; ')}`);
    }

    if (networkErrors.length > 0) {
      console.error('Network errors detected:', networkErrors);
      throw new Error(`Test failed due to network errors: ${networkErrors.join('; ')}`);
    }
  };
}

/**
 * Convenience function for test setup with error tracking
 *
 * Sets up error tracking and returns both the cleanup function and
 * a helper to navigate and wait for page load.
 *
 * @param page - Playwright page instance
 * @param url - URL to navigate to (optional)
 * @param options - Error tracking options
 * @returns Object with cleanup function and navigation helper
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   const { cleanup, navigate } = setupTestWithErrorTracking(page, '/my-page');
 *   await navigate();
 *   (page as any).__errorTrackingCleanup = cleanup;
 * });
 * ```
 */
export function setupTestWithErrorTracking(
  page: Page,
  url?: string,
  options: ErrorTrackingOptions = {}
): {
  cleanup: () => void;
  navigate: (targetUrl?: string) => Promise<void>;
} {
  const cleanup = setupErrorTracking(page, options);

  const navigate = async (targetUrl?: string) => {
    const finalUrl = targetUrl ?? url;
    if (finalUrl) {
      await page.goto(finalUrl);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for React to hydrate
  };

  return { cleanup, navigate };
}
