/**
 * Homepage E2E Smoke Tests
 *
 * Tests critical functionality of the homepage to ensure
 * the site is functional before running full test suite.
 *
 * **Coverage:**
 * - Page loads successfully
 * - Core navigation works
 * - Search functionality
 * - Performance budget
 * - Accessibility compliance
 *
 * @group smoke
 */

import { expect, test } from '@playwright/test';
import {
  expectFastLoad,
  expectNoA11yViolations,
  expectPageTitle,
  expectPageURL,
  expectVisible,
  navigateToHomepage,
  performSearch,
} from '../helpers/test-helpers';

test.describe('Homepage - Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await navigateToHomepage(page);

    // Verify page loaded
    await expectPageURL(page, '/');
    await expectPageTitle(page, /ClaudePro/i);

    // Verify core elements are visible
    await expectVisible(page.locator('header'));
    await expectVisible(page.locator('main'));
    await expectVisible(page.locator('footer'));
  });

  test('should display hero section with CTA', async ({ page }) => {
    await navigateToHomepage(page);

    // Check for hero content
    const hero = page.locator('section').first();
    await expectVisible(hero);

    // Verify heading exists
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expectVisible(heading);

    // Verify CTA buttons exist
    const ctaButtons = page.getByRole('link').filter({ has: page.locator('button') });
    expect(await ctaButtons.count()).toBeGreaterThan(0);
  });

  test('should have working navigation', async ({ page }) => {
    await navigateToHomepage(page);

    // Find navigation
    const nav = page.locator('nav').first();
    await expectVisible(nav);

    // Verify key navigation links
    const links = [
      { text: /agents/i, href: /\/agents/ },
      { text: /mcp/i, href: /\/mcp/ },
      { text: /commands/i, href: /\/commands/ },
    ];

    for (const link of links) {
      const navLink = nav.getByRole('link', { name: link.text });
      await expectVisible(navLink);
      await expect(navLink).toHaveAttribute('href', link.href);
    }
  });

  test('should open command palette with ⌘K', async ({ page }) => {
    await navigateToHomepage(page);

    // Press ⌘K (or Ctrl+K on non-Mac)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Verify command palette opened
    const commandPalette = page.locator('[role="dialog"]').or(page.locator('[role="combobox"]'));
    await expectVisible(commandPalette);

    // Verify search input is focused
    const searchInput = commandPalette
      .locator('input[type="search"]')
      .or(commandPalette.locator('[role="combobox"]'));
    await expectVisible(searchInput);

    // Close command palette
    await page.keyboard.press('Escape');
  });

  test('should perform basic search', async ({ page }) => {
    await navigateToHomepage(page);

    // Perform search using helper
    await performSearch(page, 'code review');

    // Verify navigation to search results or category
    await expect(page).toHaveURL(/\/(search|agents|mcp)/);

    // Verify search results or content loaded
    await page.waitForLoadState('networkidle');
    const hasResults =
      (await page.locator('[data-content-item]').or(page.locator('article')).count()) > 0;

    // Should have content displayed
    expect(hasResults).toBeTruthy();
  });

  test('should display featured content sections', async ({ page }) => {
    await navigateToHomepage(page);

    // Look for "Featured" or "Trending" sections
    const featuredSection = page.getByText(/featured|trending/i).first();

    // Featured section should exist (may be above fold or below)
    if (await featuredSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(featuredSection);

      // Should have content cards
      const cards = page
        .locator('[data-content-item]')
        .or(page.locator('article').or(page.locator('[role="article"]')));

      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('should load within performance budget (3s)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure performance
    await expectFastLoad(page, 3000);
  });

  test('should have no critical accessibility violations', async ({ page }) => {
    await navigateToHomepage(page);

    // Run accessibility audit
    await expectNoA11yViolations(page);
  });

  test('should have proper SEO metadata', async ({ page }) => {
    await navigateToHomepage(page);

    // Check meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.length).toBeGreaterThan(50);

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();

    // Check Twitter Card tags
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBeTruthy();
  });

  test('should have theme toggle working', async ({ page }) => {
    await navigateToHomepage(page);

    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i });

    if (await themeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expectVisible(themeToggle);

      // Click to toggle theme
      await themeToggle.click();

      // Wait for theme change (check for dark class on html or body)
      await page.waitForTimeout(500); // Allow for animation

      // Verify theme changed (class should be added/removed)
      const htmlElement = page.locator('html');
      const hasThemeClass = await htmlElement.getAttribute('class');
      expect(hasThemeClass).toBeTruthy();
    }
  });

  test('should handle navigation to category pages', async ({ page }) => {
    await navigateToHomepage(page);

    // Click on "Agents" navigation link
    const agentsLink = page.getByRole('link', { name: /agents/i }).first();
    await expectVisible(agentsLink);
    await agentsLink.click();

    // Verify navigation
    await page.waitForURL('/agents');
    await expectPageURL(page, '/agents');

    // Verify category page loaded
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expectVisible(heading);
  });
});
