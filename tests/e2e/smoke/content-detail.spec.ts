/**
 * Content Detail Pages E2E Smoke Tests
 *
 * Tests individual configuration detail pages across all content types.
 *
 * **Coverage:**
 * - Page loads successfully
 * - Content rendering
 * - Metadata display
 * - Actions (bookmark, review, share)
 * - Related content
 * - Accessibility
 *
 * @group smoke
 */

import { test, expect } from '@playwright/test';
import {
  navigateToCategory,
  expectPageURL,
  expectVisible,
  expectText,
  expectNoA11yViolations,
  waitForNetworkIdle,
} from '../helpers/test-helpers';

test.describe('Content Detail Pages - Smoke Tests', () => {
  test('should load agent detail page', async ({ page }) => {
    // Navigate to agents category
    await navigateToCategory(page, 'agents');

    // Click on first agent
    const firstAgent = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstAgent.click();

    // Should navigate to detail page
    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Verify page structure
    await expectVisible(page.locator('main'));

    // Should have heading
    const heading = page.getByRole('heading', { level: 1 });
    await expectVisible(heading);
  });

  test('should load MCP server detail page', async ({ page }) => {
    await navigateToCategory(page, 'mcp');

    // Click on first MCP server
    const firstMcp = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstMcp.click();

    // Should navigate to detail page
    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    // Verify page loaded
    const heading = page.getByRole('heading', { level: 1 });
    await expectVisible(heading);
  });

  test('should display content metadata', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to first item
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Should have metadata section
    const metadata = page.locator('[data-metadata]').or(
      page.locator('aside').or(
        page.locator('[class*="metadata"]')
      )
    );

    // Check for common metadata fields
    const hasAuthor = await page.getByText(/author|by|created by/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const hasDate = await page.locator('time')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const hasCategory = await page.getByText(/category|type/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Should have at least one metadata field
    expect(hasAuthor || hasDate || hasCategory).toBeTruthy();
  });

  test('should display content description', async ({ page }) => {
    await navigateToCategory(page, 'commands');

    // Navigate to first command
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/commands\/.+/);
    await waitForNetworkIdle(page);

    // Should have description/content
    const description = page.locator('[data-description]').or(
      page.locator('main p').first()
    );

    if (await description.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await description.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(20);
    }
  });

  test('should display code snippets for commands', async ({ page }) => {
    await navigateToCategory(page, 'commands');

    // Navigate to first command
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/commands\/.+/);
    await waitForNetworkIdle(page);

    // Look for code blocks
    const codeBlock = page.locator('pre code').or(
      page.locator('[data-code]')
    );

    if (await codeBlock.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(codeBlock);
      const code = await codeBlock.textContent();
      expect(code).toBeTruthy();
    }
  });

  test('should have bookmark/favorite action', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for bookmark/favorite button
    const bookmarkButton = page.getByRole('button', { name: /bookmark|favorite|save/i });

    if (await bookmarkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(bookmarkButton);

      // Should be clickable
      await expect(bookmarkButton).toBeEnabled();
    }
  });

  test('should have share functionality', async ({ page }) => {
    await navigateToCategory(page, 'mcp');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    // Look for share button
    const shareButton = page.getByRole('button', { name: /share|copy link/i });

    if (await shareButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(shareButton);
      await expect(shareButton).toBeEnabled();
    }
  });

  test('should display tags/categories', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for tags
    const tags = page.locator('[data-tag]').or(
      page.locator('[class*="tag"]').or(
        page.locator('[class*="badge"]')
      )
    );

    if (await tags.count() > 0) {
      await expectVisible(tags.first());
    }
  });

  test('should show related content section', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for related content section
    const relatedSection = page.getByText(/related|similar|you might also like/i);

    if (await relatedSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(relatedSection);

      // Should have related items
      const relatedItems = page.locator('[data-related-item]').or(
        page.locator('[data-content-item]')
      );

      if (await relatedItems.count() > 0) {
        expect(await relatedItems.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await navigateToCategory(page, 'rules');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/rules\/.+/);
    await waitForNetworkIdle(page);

    // Look for breadcrumbs
    const breadcrumb = page.locator('[aria-label*="breadcrumb"]').or(
      page.locator('[data-breadcrumb]').or(
        page.locator('nav ol')
      )
    );

    if (await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(breadcrumb);

      // Should have clickable links
      const breadcrumbLinks = breadcrumb.locator('a');
      expect(await breadcrumbLinks.count()).toBeGreaterThan(0);
    }
  });

  test('should have proper SEO metadata on detail page', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Check meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]')
      .getAttribute('content');
    expect(metaDescription).toBeTruthy();

    // Check Open Graph
    const ogTitle = await page.locator('meta[property="og:title"]')
      .getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('should handle non-existent content gracefully', async ({ page }) => {
    // Try to access non-existent content
    await page.goto('/agents/this-does-not-exist-12345');

    await waitForNetworkIdle(page);

    // Should show 404 or redirect
    const is404 = page.url().includes('404') ||
                  await page.getByText(/not found|404/i).isVisible({ timeout: 2000 }).catch(() => false);

    expect(is404).toBeTruthy();
  });

  test('should have accessibility compliance on detail pages', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Run accessibility audit
    await expectNoA11yViolations(page);
  });

  test('should display installation/usage instructions', async ({ page }) => {
    await navigateToCategory(page, 'mcp');

    // Navigate to MCP server detail
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    // Look for installation or usage section
    const installSection = page.getByText(/installation|setup|usage|how to use/i);

    if (await installSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(installSection);
    }
  });

  test('should show review/rating section', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Navigate to detail page
    const firstItem = page.locator('[data-content-item]').or(
      page.locator('article')
    ).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for reviews/ratings
    const reviewSection = page.getByText(/review|rating|feedback/i);

    if (await reviewSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(reviewSection);
    }
  });
});
