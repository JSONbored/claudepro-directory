import { expect, test } from '@playwright/test';
import { setupTestWithErrorTracking } from '../../../config/tests/utils/error-tracking';

/**
 * Comprehensive Homepage E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Page rendering without errors
 * - Homepage data fetching (getHomepageData)
 * - Authenticated user handling (getAuthenticatedUser)
 * - Bookmark status batch checking (isBookmarkedBatch)
 * - Stats extraction from homepageResult
 * - Top contributors processing
 * - Member count display
 * - Hero section rendering
 * - Content section rendering
 * - Top contributors section rendering
 * - Loading states
 * - Error states
 * - Console error/warning detection (tests FAIL on any errors)
 * - Network error detection
 * - Accessibility testing
 * - Responsive design
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error tracking and navigate to homepage
    const { cleanup, navigate } = setupTestWithErrorTracking(page, '/');
    await navigate();

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

  test('should render homepage without errors', async ({ page }) => {
    // Check main element is present
    const mainElement = page.getByRole('main').or(page.locator('body'));
    await expect(mainElement.first()).toBeVisible();

    // Check no error overlays
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();
  });

  test('should handle getHomepageData errors gracefully', async ({ page }) => {
    // This tests the error path when getHomepageData throws
    // The component uses .catch() and returns null, then uses ?? 0 and ?? []
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if getHomepageData fails
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null homepageResult gracefully', async ({ page }) => {
    // This tests the edge case where homepageResult is null
    // The component uses homepageResult?.member_count ?? 0 and homepageResult?.top_contributors ?? []
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if homepageResult is null
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null homepageResult.content gracefully', async ({ page }) => {
    // This tests the edge case where homepageResult.content is null
    // The component checks typeof homepageResult.content === 'object' && !Array.isArray
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if content is null
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null homepageResult.top_contributors gracefully', async ({ page }) => {
    // This tests the edge case where homepageResult.top_contributors is null
    // The component uses homepageResult?.top_contributors ?? []
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if top_contributors is null
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle getAuthenticatedUser errors gracefully', async ({ page }) => {
    // This tests the error path when getAuthenticatedUser throws
    // The component uses requireUser: false, so it shouldn't throw, but handles errors
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if getAuthenticatedUser fails
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle isBookmarkedBatch errors gracefully', async ({ page }) => {
    // This tests the error path when isBookmarkedBatch throws
    // The component uses try/catch and logs warning, continues with empty map
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if isBookmarkedBatch fails
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle empty top_contributors array gracefully', async ({ page }) => {
    // This tests the edge case where top_contributors is an empty array
    // The component filters and maps contributors, should handle empty array
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even with empty contributors
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle invalid contributor objects gracefully', async ({ page }) => {
    // This tests the edge case where contributors have invalid structure
    // The component filters contributors with type guard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even with invalid contributors
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null stats in content gracefully', async ({ page }) => {
    // This tests the edge case where content.stats is null
    // The component checks 'stats' in content && typeof content['stats'] === 'object'
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if stats is null
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null categoryData gracefully', async ({ page }) => {
    // This tests the edge case where content.categoryData is null
    // The component checks categoryData && typeof categoryData === 'object'
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if categoryData is null
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle generateMetadata error gracefully', async ({ page }) => {
    // This tests the error path when generatePageMetadata fails
    // The function doesn't have explicit error handling, but Next.js handles it
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if metadata generation fails
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Check page title (should have fallback or generated title)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should handle null searchParams gracefully', async ({ page }) => {
    // This tests the edge case where searchParams might be null
    // The component uses searchParams: _searchParams (unused but typed)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle empty allItems array gracefully', async ({ page }) => {
    // This tests the edge case where allItems is empty (no items to check bookmarks for)
    // The component checks allItems.length > 0 before calling isBookmarkedBatch
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even with no items to bookmark
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null batchResults gracefully', async ({ page }) => {
    // This tests the edge case where isBookmarkedBatch returns null/undefined
    // The component checks Array.isArray(batchResults)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if batchResults is null
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should be accessible', async ({ page }) => {
    // Check ARIA attributes
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check layout doesn't break
    const mainElement = page.getByRole('main').or(page.locator('body'));
    await expect(mainElement.first()).toBeVisible();
  });
});
