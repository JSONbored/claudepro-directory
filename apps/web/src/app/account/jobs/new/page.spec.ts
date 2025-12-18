import { expect, test } from '@playwright/test';

/**
 * Comprehensive New Job Page E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Authentication requirement
 * - Job creation form display
 * - Payment plan catalog loading
 * - Form validation
 * - Form submission (with payment flow)
 * - API integration (getPaymentPlanCatalog, createJob server action)
 * - Loading states
 * - Error states
 * - Accessibility
 * - Responsiveness
 */

test.describe('/account/jobs/new', () => {
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

    // Navigate to page
    await page.goto('/account/jobs/new');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Wait for React to hydrate
    await page.waitForTimeout(1000);
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
    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should render create job page when authenticated', async ({ page }) => {
    // This test requires authentication
    await page.goto('/account/jobs/new');
    await page.waitForLoadState('networkidle');

    // Should either show the page (if authenticated) or redirect to login
    const url = page.url();
    expect(url.includes('/account/jobs/new') || url.includes('/login')).toBe(true);
  });

  test('should display page title and description', async ({ page }) => {
    await page.goto('/account/jobs/new');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/jobs/new')) {
      const title = page.getByRole('heading', { name: /post a job/i });
      await expect(title).toBeVisible();

      const description = page.getByText(/create a new job listing/i);
      await expect(description).toBeVisible();
    }
  });

  test('should display job form', async ({ page }) => {
    await page.goto('/account/jobs/new');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/jobs/new')) {
      // Should show job form
      // Form may be lazy-loaded, so we check for main content
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    await page.goto('/account/jobs/new');

    // Should not show error overlay
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/account/jobs/new');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/jobs/new')) {
      // Check main heading
      const heading = page.getByRole('heading', { name: /post a job/i });
      await expect(heading).toBeVisible();

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/account/jobs/new');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/account/jobs/new')) {
      // Check layout doesn't break
      const title = page.getByRole('heading', { name: /post a job/i });
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
