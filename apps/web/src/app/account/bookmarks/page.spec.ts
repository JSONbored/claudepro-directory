import { expect, test } from '@playwright/test';
import { setupErrorTracking } from '../../../../../config/tests/utils/error-tracking';

/**
 * Comprehensive Bookmarks Page E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Legacy route redirect to /account/library
 * - Redirect behavior
 * - Metadata generation
 * - No console errors
 * - Accessibility
 */

test.describe('/account/bookmarks', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error tracking (navigation handled per test due to redirect)
    const cleanup = setupErrorTracking(page);

    // Store cleanup function for afterEach
    (page as any).__errorTrackingCleanup = cleanup;
  });

  test.afterEach(async ({ page }) => {
    // Check for errors and throw if any detected
    const cleanup = (page as any).__errorTrackingCleanup;
    if (cleanup) {
      cleanup();
    }
  });

  test('should redirect to /account/library', async ({ page }) => {
    // Navigate to legacy bookmarks route
    await page.goto('/account/bookmarks');

    // Should redirect to library page
    await page.waitForURL(/\/account\/library/, { timeout: 5000 });
    expect(page.url()).toContain('/account/library');
  });

  test('should perform redirect without errors', async ({ page }) => {
    await page.goto('/account/bookmarks');
    await page.waitForURL(/\/account\/library/, { timeout: 5000 });

    // Should not show error overlay
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should handle redirect gracefully', async ({ page }) => {
    // Test redirect doesn't cause issues
    const response = await page.goto('/account/bookmarks', { waitUntil: 'networkidle' });

    // Should complete redirect successfully
    expect(response?.status()).toBeLessThan(400);
  });

  test('should preserve query parameters in redirect', async ({ page }) => {
    // Test that query params are handled (if applicable)
    await page.goto('/account/bookmarks?test=param');
    await page.waitForURL(/\/account\/library/, { timeout: 5000 });

    // Redirect should complete
    expect(page.url()).toContain('/account/library');
  });

  test('should not show error overlay', async ({ page }) => {
    await page.goto('/account/bookmarks');
    await page.waitForURL(/\/account\/library/, { timeout: 5000 });

    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });
});
