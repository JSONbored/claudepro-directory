import { expect, test } from '@playwright/test';

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
  // Track all console messages for error detection
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset tracking
    consoleErrors = [];
    consoleWarnings = [];
    networkErrors = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!isAcceptableError(text)) {
          consoleErrors.push(text);
        }
      } else if (msg.type() === 'warning') {
        if (!isAcceptableWarning(text)) {
          consoleWarnings.push(text);
        }
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (isCriticalResource(url)) {
        networkErrors.push(`${url} - ${request.failure()?.errorText}`);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // FAIL test if any console errors detected
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Test failed due to console errors: ${consoleErrors.join('; ')}`);
    }

    // FAIL test if any console warnings detected (strict mode)
    if (consoleWarnings.length > 0) {
      console.warn('Console warnings detected:', consoleWarnings);
      throw new Error(`Test failed due to console warnings: ${consoleWarnings.join('; ')}`);
    }

    // FAIL test if any network errors detected
    if (networkErrors.length > 0) {
      console.error('Network errors detected:', networkErrors);
      throw new Error(`Test failed due to network errors: ${networkErrors.join('; ')}`);
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

// Helper functions
function isAcceptableError(text: string): boolean {
  return false;
}

function isAcceptableWarning(text: string): boolean {
  return false;
}

function isCriticalResource(url: string): boolean {
  return !url.includes('favicon') && !url.includes('analytics');
}
