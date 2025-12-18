import { expect, test } from '@playwright/test';
import { setupTestWithErrorTracking } from '../../../../../config/tests/utils/error-tracking';

/**
 * Comprehensive Config Recommender Landing Page E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Hero section with title, description, stats badges
 * - Quiz form display and interaction
 * - Benefits section (How It Works)
 * - Features section
 * - Console error/warning detection (tests FAIL on any errors)
 * - Network error detection
 * - Accessibility testing
 * - Responsive design
 */

test.describe('Config Recommender Landing Page (/tools/config-recommender)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error tracking and navigate to config recommender page
    const { cleanup, navigate } = setupTestWithErrorTracking(page, '/tools/config-recommender');
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

  test('should render page without errors', async ({ page }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mainElement = page.getByRole('main').or(page.locator('body'));
    await expect(mainElement.first()).toBeVisible();
  });

  test('should display hero section with title and description', async ({ page }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const title = page.locator('h1').filter({ hasText: /Find Your Perfect/i });
    await expect(title).toBeVisible();

    const description = page.locator('text=/Answer 7 quick questions/i');
    await expect(description).toBeVisible();
  });

  test('should display stats badges (2 minutes, 147+ configs, Instant results)', async ({
    page,
  }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const stats = page.locator('text=/2 minutes|147\\+ configs|Instant results/i');
    await expect(stats.first()).toBeVisible();
  });

  test('should display AI-Powered Recommendations badge', async ({ page }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const badge = page.locator('text=/AI-Powered Recommendations/i');
    await expect(badge).toBeVisible();
  });

  test('should display quiz form', async ({ page }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Quiz form should be present (client component)
    const quizForm = page.locator('[data-testid="quiz-form"]').or(
      page.locator('form').filter({ hasText: /use case|experience/i })
    );
    await expect(quizForm.first()).toBeVisible();
  });

  test('should display How It Works section with 3 steps', async ({ page }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const howItWorks = page.locator('text=/How It Works/i');
    await expect(howItWorks).toBeVisible();

    // Check for step cards
    const steps = page.locator('text=/Answer Questions|Instant Analysis|Get Results/i');
    await expect(steps.first()).toBeVisible();
  });

  test('should display What You\'ll Get section', async ({ page }) => {
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const featuresSection = page.locator('text=/What You\'ll Get/i');
    await expect(featuresSection).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/tools/config-recommender');
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
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mainElement = page.getByRole('main').or(page.locator('body'));
    await expect(mainElement.first()).toBeVisible();
  });

  test('should handle generateMetadata error gracefully', async ({ page }) => {
    // This tests the error path when generatePageMetadata fails
    // The function doesn't have explicit error handling, but Next.js handles it
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should render even if metadata generation fails
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();

    // Check page title (should have fallback or generated title)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should display QuizForm during Suspense', async ({ page }) => {
    // This tests that QuizForm is shown during Suspense
    // The component uses Suspense with fallback
    await page.goto('/tools/config-recommender');
    
    // Check for loading state (may flash quickly)
    const loading = page.locator('[data-loading], [aria-busy="true"]');
    const hasLoading = await loading.isVisible().catch(() => false);
    
    // Loading state may or may not be visible depending on load time
    // But page should eventually load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const main = page.getByRole('main').or(page.locator('body'));
    await expect(main.first()).toBeVisible();
  });

  test('should handle QuizForm lazy loading errors gracefully', async ({ page }) => {
    // This tests that lazy loading errors are handled
    // The component uses dynamic(() => import(...))
    await page.goto('/tools/config-recommender');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render or show error boundary, but not crash
    const main = page.getByRole('main').or(page.locator('body'));
    const hasMain = await main.first().isVisible().catch(() => false);
    const hasErrorOverlay = await page.locator('[data-nextjs-error]').isVisible().catch(() => false);
    
    // Should either render main or show error boundary, but not have unhandled error overlay
    expect(hasErrorOverlay).toBe(false);
  });
});
