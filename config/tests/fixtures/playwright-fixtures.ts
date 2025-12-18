/**
 * Custom Playwright Fixtures
 * 
 * Provides reusable fixtures for common test scenarios.
 * These fixtures extend the base Playwright test context.
 * 
 * @module config/tests/fixtures/playwright-fixtures
 */

import { test as base, type Page } from '@playwright/test';
import { setupTestWithErrorTracking, setupErrorTracking } from '../utils/error-tracking';
import { setTheme, waitForPageLoad } from '../utils/helpers';

/**
 * Fixture for page with automatic error tracking
 */
export const test = base.extend<{
  pageWithErrors: Page;
  authenticatedPage: Page;
  pageWithTheme: (theme: 'light' | 'dark') => Promise<Page>;
}>({
  /**
   * Page with error tracking automatically set up
   * 
   * Automatically tracks console errors, warnings, and network failures.
   * Throws in afterEach if any errors are detected.
   */
  pageWithErrors: async ({ page }, use) => {
    const cleanup = setupErrorTracking(page);
    (page as any).__errorTrackingCleanup = cleanup;
    
    await use(page);
    
    // Cleanup is called automatically in afterEach via the stored function
  },

  /**
   * Authenticated page (with user logged in)
   * 
   * Note: This is a placeholder fixture. Actual authentication setup
   * would depend on your auth implementation. You may need to:
   * - Set cookies/tokens
   * - Mock auth state
   * - Use test user credentials
   */
  authenticatedPage: async ({ page }, use) => {
    // Set up error tracking
    const cleanup = setupErrorTracking(page);
    (page as any).__errorTrackingCleanup = cleanup;
    
    // TODO: Add authentication setup here
    // Example: await page.context().addCookies([...]);
    // Or: await page.goto('/auth/test-login');
    
    await use(page);
  },

  /**
   * Page with theme set
   * 
   * Returns a function that sets the theme and returns the page.
   */
  pageWithTheme: async ({ page }, use) => {
    const cleanup = setupErrorTracking(page);
    (page as any).__errorTrackingCleanup = cleanup;
    
    await use(async (theme: 'light' | 'dark') => {
      await setTheme(page, theme);
      return page;
    });
  },
});

/**
 * Helper fixture for common test setup
 * 
 * Combines error tracking and navigation in one fixture.
 */
export const testWithNavigation = base.extend<{
  navigateTo: (url: string) => Promise<void>;
}>({
  navigateTo: async ({ page }, use) => {
    const { cleanup, navigate } = setupTestWithErrorTracking(page);
    (page as any).__errorTrackingCleanup = cleanup;
    
    await use(navigate);
  },
});

// Re-export base test for tests that don't need custom fixtures
export { expect } from '@playwright/test';
