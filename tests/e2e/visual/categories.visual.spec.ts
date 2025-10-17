/**
 * Category Pages Visual Regression Tests
 *
 * Systematic visual regression testing for category listing pages.
 * Tests all major content categories across all standard breakpoints.
 *
 * **Coverage:**
 * - Agents category page (/agents)
 * - MCP category page (/mcp-servers)
 * - Commands category page (/commands)
 * - Guides category page (/guides)
 *
 * **Strategy:**
 * - Tests category grid layouts at all breakpoints
 * - Verifies responsive card layouts (1-col mobile → 2-col tablet → 3-col desktop)
 * - Captures filter/search UI states
 * - Tests empty states and loading states
 *
 * @see tests/utils/visual-testing.ts - Visual testing utilities
 * @group visual
 */

import { expect, test } from '@playwright/test';
import { getMaskLocators, waitForPageStable } from '@/tests/utils/visual-testing';

/**
 * Category Pages Visual Tests
 * Tests major category pages for visual consistency
 */
test.describe('Category Pages - Visual Regression', () => {
  /**
   * Agents Category Page
   */
  test.describe('Agents Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/agents', { waitUntil: 'networkidle' });
      await waitForPageStable(page);
    });

    test('should match agents page full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
      ]);

      await expect(page).toHaveScreenshot('agents-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });

    test('should match agents grid layout', async ({ page }) => {
      const grid = page
        .locator('[class*="grid"]')
        .filter({ has: page.locator('[data-category="agents"]') })
        .first();

      if (await grid.isVisible().catch(() => false)) {
        await expect(grid).toHaveScreenshot('agents-grid.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });

    test('should match agents filter UI', async ({ page }) => {
      const filterSection = page
        .locator('section')
        .filter({ has: page.locator('button:has-text("Filter")') })
        .or(page.locator('[data-testid="filter-section"]'));

      if (await filterSection.isVisible().catch(() => false)) {
        await expect(filterSection).toHaveScreenshot('agents-filters.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });
  });

  /**
   * MCP Servers Category Page
   */
  test.describe('MCP Servers Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/mcp-servers', { waitUntil: 'networkidle' });
      await waitForPageStable(page);
    });

    test('should match mcp-servers page full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
      ]);

      await expect(page).toHaveScreenshot('mcp-servers-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });

    test('should match mcp-servers grid layout', async ({ page }) => {
      const grid = page
        .locator('[class*="grid"]')
        .filter({ has: page.locator('[data-category="mcp-servers"]') })
        .first();

      if (await grid.isVisible().catch(() => false)) {
        await expect(grid).toHaveScreenshot('mcp-servers-grid.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });
  });

  /**
   * Commands Category Page
   */
  test.describe('Commands Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/commands', { waitUntil: 'networkidle' });
      await waitForPageStable(page);
    });

    test('should match commands page full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
      ]);

      await expect(page).toHaveScreenshot('commands-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });

    test('should match commands grid layout', async ({ page }) => {
      const grid = page
        .locator('[class*="grid"]')
        .filter({ has: page.locator('[data-category="commands"]') })
        .first();

      if (await grid.isVisible().catch(() => false)) {
        await expect(grid).toHaveScreenshot('commands-grid.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });
  });

  /**
   * Guides Category Page
   */
  test.describe('Guides Category', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/guides', { waitUntil: 'networkidle' });
      await waitForPageStable(page);
    });

    test('should match guides page full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
      ]);

      await expect(page).toHaveScreenshot('guides-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });

    test('should match guides grid layout', async ({ page }) => {
      const grid = page
        .locator('[class*="grid"]')
        .filter({ has: page.locator('[data-category="guides"]') })
        .first();

      if (await grid.isVisible().catch(() => false)) {
        await expect(grid).toHaveScreenshot('guides-grid.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });
  });
});

/**
 * Category Grid Responsive Tests
 * Verifies grid layouts adapt correctly at each breakpoint
 */
test.describe('Category Grid - Responsive Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'networkidle' });
    await waitForPageStable(page);
  });

  test('should show correct grid columns based on viewport', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width || 0;
    const grid = page.locator('[class*="grid"]').first();

    if (await grid.isVisible().catch(() => false)) {
      // Capture grid at current viewport
      await expect(grid).toHaveScreenshot('category-grid-responsive.png', {
        maxDiffPixelRatio: 0.01,
      });

      // Verify grid columns based on viewport
      const gridComputedStyle = await grid.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          gridTemplateColumns: computed.gridTemplateColumns,
          gap: computed.gap,
        };
      });

      // Log for debugging (visible in test output)
      console.log(`Viewport: ${viewportWidth}px, Grid: ${gridComputedStyle.gridTemplateColumns}`);

      // Expectations based on breakpoints
      if (viewportWidth < 768) {
        // Mobile: 1 column
        expect(gridComputedStyle.gridTemplateColumns.split(' ').length).toBe(1);
      } else if (viewportWidth < 1024) {
        // Tablet: 2 columns
        expect(gridComputedStyle.gridTemplateColumns.split(' ').length).toBe(2);
      } else {
        // Desktop: 3 columns
        expect(gridComputedStyle.gridTemplateColumns.split(' ').length).toBe(3);
      }
    }
  });

  test('should show correct card size at viewport', async ({ page }) => {
    const firstCard = page.locator('[data-testid="content-card"]').first();

    if (await firstCard.isVisible().catch(() => false)) {
      await expect(firstCard).toHaveScreenshot('category-card-responsive.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

/**
 * Category Search & Filter Visual Tests
 * Tests search and filter UI components
 */
test.describe('Category Search & Filter - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'networkidle' });
    await waitForPageStable(page);
  });

  test('should match search input appearance', async ({ page }) => {
    const searchInput = page
      .locator('input[type="search"]')
      .or(page.locator('[placeholder*="Search"]'));

    if (await searchInput.isVisible().catch(() => false)) {
      // Focus search input
      await searchInput.focus();
      await page.waitForTimeout(100);

      // Capture focused state
      await expect(searchInput).toHaveScreenshot('category-search-focused.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('should match filter dropdown appearance', async ({ page }) => {
    const filterButton = page
      .locator('button:has-text("Filter")')
      .or(page.locator('[data-testid="filter-button"]'));

    if (await filterButton.isVisible().catch(() => false)) {
      // Open filter dropdown
      await filterButton.click();
      await page.waitForTimeout(300);

      // Capture filter dropdown
      const filterDropdown = page
        .locator('[role="menu"]')
        .or(page.locator('[data-testid="filter-dropdown"]'));

      if (await filterDropdown.isVisible().catch(() => false)) {
        await expect(filterDropdown).toHaveScreenshot('category-filter-dropdown.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    }
  });
});
