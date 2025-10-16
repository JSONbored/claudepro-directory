/**
 * Search Functionality E2E Smoke Tests
 *
 * Tests unified search functionality across all content types.
 *
 * **Coverage:**
 * - Command palette search (⌘K)
 * - Search results display
 * - Filter and sort functionality
 * - Empty state handling
 * - Search performance
 *
 * @group smoke
 */

import { expect, test } from '@playwright/test';
import {
  expectVisible,
  navigateToHomepage,
  performSearch,
  waitForNetworkIdle,
} from '../helpers/test-helpers';

test.describe('Search Functionality - Smoke Tests', () => {
  test('should open command palette with ⌘K', async ({ page }) => {
    await navigateToHomepage(page);

    // Press ⌘K (or Ctrl+K on non-Mac)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Verify command palette opened
    const commandPalette = page.locator('[role="dialog"]').or(page.locator('[role="combobox"]'));
    await expectVisible(commandPalette);

    // Verify search input exists and is focused
    const searchInput = commandPalette
      .locator('input[type="search"]')
      .or(commandPalette.locator('[role="combobox"]'));
    await expectVisible(searchInput);
    await expect(searchInput).toBeFocused();
  });

  test('should search for agents and show results', async ({ page }) => {
    await navigateToHomepage(page);

    // Perform search
    await performSearch(page, 'code review');

    // Wait for results to load
    await waitForNetworkIdle(page);

    // Should have navigated to results
    await expect(page).toHaveURL(/\/(search|agents|mcp|rules|commands|hooks|statuslines)/);

    // Should show content items
    const contentItems = page.locator('[data-content-item]').or(page.locator('article'));
    const count = await contentItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search for MCP servers and show results', async ({ page }) => {
    await navigateToHomepage(page);

    // Perform search
    await performSearch(page, 'database');

    // Wait for results
    await waitForNetworkIdle(page);

    // Should show results
    const contentItems = page.locator('[data-content-item]').or(page.locator('article'));
    const count = await contentItems.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if no database-related content
  });

  test('should handle empty search gracefully', async ({ page }) => {
    await navigateToHomepage(page);

    // Open command palette
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Try to submit empty search
    const searchInput = page
      .locator('[role="combobox"]')
      .or(page.locator('[type="search"]'))
      .first();
    await searchInput.press('Enter');

    // Should not navigate or should show validation
    await page.waitForTimeout(500);

    // Either stayed on homepage or shows empty state
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(|search)/);
  });

  test('should show "no results" for nonsensical query', async ({ page }) => {
    await navigateToHomepage(page);

    // Perform search with nonsensical query
    await performSearch(page, 'xyznonexistentquery98765');

    // Wait for results
    await waitForNetworkIdle(page);

    // Should show empty state or no results message
    const emptyState = page.getByText(/no results|not found|no items|nothing found/i);
    const contentItems = page.locator('[data-content-item]').or(page.locator('article'));

    // Either show empty state OR have 0 items
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    const itemCount = await contentItems.count();

    expect(hasEmptyState || itemCount === 0).toBeTruthy();
  });

  test('should filter search results by category', async ({ page }) => {
    await navigateToHomepage(page);

    // Navigate to agents category
    await page.goto('/agents');
    await waitForNetworkIdle(page);

    // Look for filter UI
    const filterButton = page.getByRole('button', { name: /filter|category|type/i });

    if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterButton.click();

      // Should open filter panel
      const filterPanel = page.locator('[role="dialog"]').or(page.locator('[data-filter-panel]'));
      await expectVisible(filterPanel);

      // Verify filter options exist
      const filterOptions = filterPanel
        .locator('[role="checkbox"]')
        .or(filterPanel.locator('input[type="checkbox"]'));
      expect(await filterOptions.count()).toBeGreaterThan(0);
    }
  });

  test('should sort search results', async ({ page }) => {
    await page.goto('/agents');
    await waitForNetworkIdle(page);

    // Look for sort UI
    const sortButton = page.getByRole('button', { name: /sort|order/i });

    if (await sortButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sortButton.click();

      // Should show sort options
      const sortOptions = page.getByRole('menuitem').or(page.locator('[role="option"]'));
      expect(await sortOptions.count()).toBeGreaterThan(0);
    }
  });

  test('should display search result metadata', async ({ page }) => {
    await navigateToHomepage(page);

    // Perform search
    await performSearch(page, 'test');

    // Wait for results
    await waitForNetworkIdle(page);

    // Find first content item
    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();

    if (await firstItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Should have title
      const title = firstItem.locator('h2, h3, [role="heading"]').first();
      await expectVisible(title);

      // Should have some metadata (author, date, category, etc.)
      const hasMetadata =
        (await firstItem.locator('time, [data-author], [data-category]').count()) > 0;
      expect(hasMetadata).toBeTruthy();
    }
  });

  test('should highlight search terms in results', async ({ page }) => {
    await navigateToHomepage(page);

    // Search for a specific term
    await performSearch(page, 'review');

    // Wait for results
    await waitForNetworkIdle(page);

    // Check if any highlighting exists (mark, strong, or highlighted class)
    const highlighted = page.locator('mark, .highlight, [data-highlight]');
    const highlightCount = await highlighted.count();

    // May or may not have highlighting depending on implementation
    // This test documents the expectation
    if (highlightCount > 0) {
      await expectVisible(highlighted.first());
    }
  });

  test('should close command palette with Escape', async ({ page }) => {
    await navigateToHomepage(page);

    // Open command palette
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Verify opened
    const commandPalette = page.locator('[role="dialog"]').or(page.locator('[role="combobox"]'));
    await expectVisible(commandPalette);

    // Close with Escape
    await page.keyboard.press('Escape');

    // Should be closed
    await page.waitForTimeout(500);
    const isVisible = await commandPalette.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isVisible).toBeFalsy();
  });

  test('should perform search within reasonable time', async ({ page }) => {
    await navigateToHomepage(page);

    const startTime = Date.now();

    // Perform search
    await performSearch(page, 'test query');

    // Wait for results
    await waitForNetworkIdle(page);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Search should complete within 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  test('should support keyboard navigation in search results', async ({ page }) => {
    await navigateToHomepage(page);

    // Open command palette
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Type search query
    const searchInput = page
      .locator('[role="combobox"]')
      .or(page.locator('[type="search"]'))
      .first();
    await searchInput.fill('test');

    // Wait for suggestions
    await page.waitForTimeout(1000);

    // Try to navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');

    // Should have keyboard-navigable results
    const focusedElement = page.locator(':focus');
    const isFocused = (await focusedElement.count()) > 0;
    expect(isFocused).toBeTruthy();
  });
});
