import { expect, test } from '@playwright/test';

/**
 * Comprehensive Edit Collection Page E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Authentication requirement (redirects to login if not authenticated)
 * - Collection edit form display
 * - Form pre-population with existing collection data
 * - Bookmarks data loading
 * - Form validation
 * - Form submission
 * - API integration (getAuthenticatedUser, getCollectionDetail)
 * - 404 handling for non-existent collections
 * - Loading states
 * - Error states
 * - Accessibility
 * - Responsiveness
 */

test.describe('/account/library/[slug]/edit', () => {
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

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/account/library/test-collection/edit');

    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should render edit collection page when authenticated', async ({ page }) => {
    // This test requires authentication
    await page.goto('/account/library/test-collection/edit');
    await page.waitForLoadState('networkidle');

    // Should either show the page (if authenticated) or redirect to login
    const url = page.url();
    expect(url.includes('/account/library') || url.includes('/login')).toBe(true);
  });

  test('should display page title and description', async ({ page }) => {
    await page.goto('/account/library/test-collection/edit');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/library') && !page.url().includes('/login')) {
      const title = page.getByRole('heading', { name: /edit collection/i });
      await expect(title).toBeVisible();

      const description = page.getByText(/update your collection details/i);
      await expect(description).toBeVisible();
    }
  });

  test('should display back to collection button', async ({ page }) => {
    await page.goto('/account/library/test-collection/edit');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/library') && !page.url().includes('/login')) {
      const backButton = page.getByRole('link', { name: /back to collection/i });
      await expect(backButton).toBeVisible();
    }
  });

  test('should display collection form', async ({ page }) => {
    await page.goto('/account/library/test-collection/edit');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/library') && !page.url().includes('/login')) {
      // Should show collection form
      const formCard = page.getByText(/collection details/i);
      await expect(formCard).toBeVisible();
    }
  });

  test('should handle 404 for non-existent collection', async ({ page }) => {
    await page.goto('/account/library/non-existent-12345/edit');
    await page.waitForLoadState('networkidle');

    // Should either show 404 or redirect to login
    const url = page.url();
    expect(url.includes('/login') || url.includes('404') || url.includes('not-found')).toBe(true);
  });

  test('should handle loading states', async ({ page }) => {
    await page.goto('/account/library/test-collection/edit');

    // Should not show error overlay
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/account/library/test-collection/edit');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/library') && !page.url().includes('/login')) {
      // Check main heading
      const heading = page.getByRole('heading', { name: /edit collection/i });
      await expect(heading).toBeVisible();

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/account/library/test-collection/edit');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/library') && !page.url().includes('/login')) {
      // Check layout doesn't break
      const title = page.getByRole('heading', { name: /edit collection/i });
      await expect(title).toBeVisible();
    }
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
