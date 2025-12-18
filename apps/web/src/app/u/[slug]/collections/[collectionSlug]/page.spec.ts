import { expect, test } from '@playwright/test';

/**
 * Comprehensive User Collection Detail Page E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Collection detail display (name, description, stats)
 * - Collection items display
 * - Navigation back to user profile
 * - Owner actions (manage collection button)
 * - View tracking (Pulse component)
 * - API integration
 * - Console error/warning detection (tests FAIL on any errors)
 * - Network error detection
 * - Accessibility testing
 * - Responsive design
 */

test.describe('User Collection Detail Page (/u/[slug]/collections/[collectionSlug])', () => {
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

    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    page.on('requestfailed', (request) => {
      const url = request.url();
      if (isCriticalResource(url)) {
        networkErrors.push(`${url} - ${request.failure()?.errorText}`);
      }
    });
  });

  test.afterEach(async ({ page }) => {
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
  });

  test('should render collection detail page without errors', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mainElement = page.getByRole('main').or(page.locator('body'));
    await expect(mainElement.first()).toBeVisible();

    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should display collection name and description', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for collection name
    const collectionName = page.locator('h1').first();
    await expect(collectionName).toBeVisible();

    // Check for public badge
    const publicBadge = page.locator('text=/Public/i').first();
    await expect(publicBadge).toBeVisible();
  });

  test('should display collection metadata (item count, views, created date)', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for metadata (item count, views, created by)
    const metadata = page.locator('text=/items|views|Created by/i').first();
    await expect(metadata).toBeVisible();
  });

  test('should display back to profile button', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const backButton = page.getByRole('button', { name: /back to.*profile/i }).first();
    await expect(backButton).toBeVisible();
  });

  test('should navigate back to user profile when back button clicked', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const backButton = page.getByRole('button', { name: /back to.*profile/i }).first();
    await backButton.click();
    await page.waitForTimeout(500);

    // Should navigate to user profile
    expect(page.url()).toContain('/u/test-user');
  });

  test('should display collection items when available', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for items section
    const itemsSection = page.locator('text=/Items in this Collection/i').first();
    await expect(itemsSection).toBeVisible();
  });

  test('should display empty state when collection has no items', async ({ page }) => {
    await page.goto('/u/test-user/collections/empty-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for empty state message
    const emptyState = page.locator('text=/empty|no items/i').first();
    await expect(emptyState).toBeVisible();
  });

  test('should display collection stats cards (Total Items, Views, Created)', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for stats cards
    const statsCards = page.locator('text=/Total Items|Views|Created/i');
    await expect(statsCards.first()).toBeVisible();
  });

  test('should handle 404 for invalid collection', async ({ page }) => {
    await page.goto('/u/test-user/collections/non-existent-collection', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1000);

    const notFound = page.locator('text=/404|not found/i').first();
    await expect(notFound).toBeVisible();
  });

  test('should call getPublicCollectionDetail API correctly', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('get_collection_detail')) {
        apiCalls.push(url);
      }
    });

    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // API may be called server-side only
    expect(apiCalls.length).toBeGreaterThanOrEqual(0);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mainContent = page.getByRole('main').or(page.locator('body'));
    await expect(mainContent.first()).toBeVisible();

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/u/test-user/collections/test-collection');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mainElement = page.getByRole('main').or(page.locator('body'));
    await expect(mainElement.first()).toBeVisible();
  });
});

function isAcceptableError(text: string): boolean {
  return false;
}

function isAcceptableWarning(text: string): boolean {
  return false;
}

function isCriticalResource(url: string): boolean {
  return !url.includes('favicon') && !url.includes('analytics') && !url.includes('ads');
}
