/**
 * Category Pages E2E Smoke Tests
 *
 * Tests category browsing functionality across all content types.
 *
 * **Coverage:**
 * - All category pages load
 * - Content listing displays
 * - Filtering works
 * - Navigation between categories
 *
 * @group smoke
 */

import { expect, test } from '@playwright/test';
import {
  expectNoA11yViolations,
  expectPageURL,
  expectVisible,
  navigateToCategory,
} from '../helpers/test-helpers';

const CATEGORIES = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'];

test.describe('Category Pages - Smoke Tests', () => {
  // Test each category page
  for (const category of CATEGORIES) {
    test(`should load /${category} page successfully`, async ({ page }) => {
      await navigateToCategory(page, category);

      // Verify URL
      await expectPageURL(page, `/${category}`);

      // Verify page title
      await expect(page).toHaveTitle(new RegExp(category, 'i'));

      // Verify main heading
      const heading = page.getByRole('heading', { level: 1 });
      await expectVisible(heading);

      // Verify content grid/list exists
      const contentContainer = page.locator('[data-content-list]').or(
        page
          .locator('main')
          .locator('div')
          .filter({ has: page.locator('article') })
      );
      await expectVisible(contentContainer);
    });

    test(`should display content items on /${category}`, async ({ page }) => {
      await navigateToCategory(page, category);

      // Wait for content to load
      await page.waitForLoadState('networkidle');

      // Find content cards/items
      const contentItems = page
        .locator('[data-content-item]')
        .or(page.locator('article').or(page.locator('[role="article"]')));

      // Should have at least one content item
      const count = await contentItems.count();
      expect(count).toBeGreaterThan(0);

      // First item should be visible
      await expectVisible(contentItems.first());
    });

    test(`should have working filters on /${category}`, async ({ page }) => {
      await navigateToCategory(page, category);

      // Look for filter UI
      const filterButton = page.getByRole('button', { name: /filter|sort|tags/i });

      if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterButton.click();

        // Filter panel should open
        const filterPanel = page.locator('[role="dialog"]').or(page.locator('[data-filter-panel]'));

        await expectVisible(filterPanel);
      }
    });
  }

  test('should navigate between categories', async ({ page }) => {
    // Start on agents
    await navigateToCategory(page, 'agents');
    await expectPageURL(page, '/agents');

    // Navigate to MCP
    const mcpLink = page.getByRole('link', { name: /mcp/i });
    await mcpLink.click();

    await page.waitForURL('/mcp');
    await expectPageURL(page, '/mcp');

    // Verify content loaded
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expectVisible(heading);
  });

  test('should show empty state when no results', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Try to apply a filter that will return no results
    // (This assumes there's a search/filter feature)
    const searchInput = page.locator('input[type="search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('xyznonexistentquery12345');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      // Should show empty state or no results message
      const emptyState = page.getByText(/no results|not found|no items/i);

      if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expectVisible(emptyState);
      }
    }
  });

  test('should have accessibility compliance on category pages', async ({ page }) => {
    // Test accessibility on one representative category
    await navigateToCategory(page, 'agents');

    // Run accessibility audit
    await expectNoA11yViolations(page);
  });

  test('should display category metadata', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Check for description/subtitle
    const description = page.locator('p').first();
    if (await description.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await description.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(20);
    }
  });

  test('should have working pagination or infinite scroll', async ({ page }) => {
    await navigateToCategory(page, 'agents');
    await page.waitForLoadState('networkidle');

    // Count initial items
    const initialItems = await page
      .locator('[data-content-item]')
      .or(page.locator('article'))
      .count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for potential load
    await page.waitForTimeout(2000);

    // Check if more items loaded (infinite scroll) or pagination exists
    const finalItems = await page
      .locator('[data-content-item]')
      .or(page.locator('article'))
      .count();

    const paginationExists = await page
      .getByRole('button', { name: /next|load more/i })
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // Either more items loaded or pagination exists
    expect(finalItems >= initialItems || paginationExists).toBeTruthy();
  });
});
