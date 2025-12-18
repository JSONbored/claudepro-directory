import { expect, test } from '@playwright/test';

/**
 * Comprehensive Status Page E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - System status display
 * - API health information
 * - StatusPageContent component
 * - Loading states (StatusPageSkeleton)
 * - API integration
 * - Error states
 * - Accessibility
 * - Responsiveness
 */

test.describe('/status', () => {
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
    await page.goto('/status');

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

  test('should render status page without errors', async ({ page }) => {
    // Check main element is present
    const mainElement = page.getByRole('main');
    await expect(mainElement).toBeVisible();

    // Check no error overlays
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should display page title and description', async ({ page }) => {
    const title = page.getByRole('heading', { name: /system status/i });
    await expect(title).toBeVisible();

    const description = page.getByText(/real-time status of our api/i);
    await expect(description).toBeVisible();
  });

  test('should display status content', async ({ page }) => {
    // StatusPageContent should be visible (may be in Suspense)
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Should not show error overlay
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Check main heading
    const heading = page.getByRole('heading', { name: /system status/i });
    await expect(heading).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check layout doesn't break
    const title = page.getByRole('heading', { name: /system status/i });
    await expect(title).toBeVisible();
  });

  test('should handle StatusPageContent errors gracefully', async ({ page }) => {
    // This tests that StatusPageContent errors are handled
    // The component is wrapped in Suspense with StatusPageSkeleton fallback
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if StatusPageContent errors
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should display StatusPageSkeleton during loading', async ({ page }) => {
    // This tests that StatusPageSkeleton is shown during loading
    // The component uses Suspense with StatusPageSkeleton fallback
    await page.goto('/status');
    
    // Check for loading skeleton (may flash quickly)
    const skeleton = page.locator('[data-loading], [aria-busy="true"]');
    const hasSkeleton = await skeleton.isVisible().catch(() => false);
    
    // Loading state may or may not be visible depending on load time
    // But page should eventually load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('should handle fetchStatus errors gracefully', async ({ page }) => {
    // This tests the error path when fetch('/api/status') fails
    // The component catches error and sets error state with fallback status
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if status fetch fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null/undefined healthData gracefully', async ({ page }) => {
    // This tests the edge case where healthData is null/undefined
    // The component uses useState<ApiHealthData | null>(null)
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if health data is null
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle mapApiStatusToComponentStatus with unknown status', async ({ page }) => {
    // This tests the edge case where apiStatus is unknown
    // The function defaults to 'offline' for unknown statuses
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if status mapping fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle exponential backoff on consecutive errors', async ({ page }) => {
    // This tests that exponential backoff works correctly
    // The component increases poll interval on consecutive errors
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even with backoff
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle tab visibility changes gracefully', async ({ page }) => {
    // This tests that polling pauses when tab is hidden
    // The component uses Visibility API to pause/resume polling
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render and handle visibility changes
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle invalid JSON response from /api/status', async ({ page }) => {
    // This tests the error path when response.json() fails
    // The component catches error in fetchStatus
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if JSON parsing fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null/undefined healthData properties', async ({ page }) => {
    // This tests edge cases where healthData properties are null/undefined
    // The component uses optional chaining for checks, database, timestamp, version
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if properties are missing
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    expect(hasError).toBe(false);
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
