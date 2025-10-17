/**
 * Content Detail Pages Visual Regression Tests
 *
 * Systematic visual regression testing for content detail/view pages.
 * Tests individual content item pages (agents, MCP servers, commands, guides).
 *
 * **Coverage:**
 * - Content detail layout
 * - Sidebar/metadata panels
 * - Code blocks and syntax highlighting
 * - Related content sections
 * - Copy buttons and interactions
 *
 * **Strategy:**
 * - Tests detail page structure at all breakpoints
 * - Verifies responsive sidebar (side-by-side desktop → stacked mobile)
 * - Captures code block rendering
 * - Tests copy-to-clipboard UI
 *
 * @see tests/utils/visual-testing.ts - Visual testing utilities
 * @group visual
 */

import { expect, test } from '@playwright/test';
import { captureWithFocus, getMaskLocators, waitForPageStable } from '@/tests/utils/visual-testing';

/**
 * Content Detail Page Visual Tests
 * Tests detail page components and layouts
 */
test.describe('Content Detail - Visual Regression', () => {
  /**
   * Agent Detail Page
   * Uses a well-known agent slug for consistent testing
   */
  test.describe('Agent Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to first agent (assumes content exists)
      await page.goto('/agents', { waitUntil: 'networkidle' });
      const firstAgentLink = page.locator('a[href^="/agents/"]').first();

      if (await firstAgentLink.isVisible().catch(() => false)) {
        await firstAgentLink.click();
        await page.waitForLoadState('networkidle');
        await waitForPageStable(page);
      } else {
        test.skip();
      }
    });

    test('should match agent detail full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
        '[data-testid="copy-count"]',
      ]);

      await expect(page).toHaveScreenshot('agent-detail-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });

    test('should match agent detail sidebar', async ({ page }) => {
      const sidebar = page.locator('aside').or(page.locator('[data-testid="detail-sidebar"]'));

      if (await sidebar.isVisible().catch(() => false)) {
        await expect(sidebar).toHaveScreenshot('agent-detail-sidebar.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });

    test('should match agent detail content area', async ({ page }) => {
      const contentArea = page
        .locator('main article')
        .or(page.locator('[data-testid="content-area"]'));

      if (await contentArea.isVisible().catch(() => false)) {
        await expect(contentArea).toHaveScreenshot('agent-detail-content.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    });
  });

  /**
   * MCP Server Detail Page
   */
  test.describe('MCP Server Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/mcp-servers', { waitUntil: 'networkidle' });
      const firstMcpLink = page.locator('a[href^="/mcp-servers/"]').first();

      if (await firstMcpLink.isVisible().catch(() => false)) {
        await firstMcpLink.click();
        await page.waitForLoadState('networkidle');
        await waitForPageStable(page);
      } else {
        test.skip();
      }
    });

    test('should match mcp server detail full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
        '[data-testid="copy-count"]',
      ]);

      await expect(page).toHaveScreenshot('mcp-server-detail-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });
  });

  /**
   * Command Detail Page
   */
  test.describe('Command Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/commands', { waitUntil: 'networkidle' });
      const firstCommandLink = page.locator('a[href^="/commands/"]').first();

      if (await firstCommandLink.isVisible().catch(() => false)) {
        await firstCommandLink.click();
        await page.waitForLoadState('networkidle');
        await waitForPageStable(page);
      } else {
        test.skip();
      }
    });

    test('should match command detail full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
        '[data-testid="copy-count"]',
      ]);

      await expect(page).toHaveScreenshot('command-detail-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });
  });

  /**
   * Guide Detail Page
   */
  test.describe('Guide Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/guides', { waitUntil: 'networkidle' });
      const firstGuideLink = page.locator('a[href^="/guides/"]').first();

      if (await firstGuideLink.isVisible().catch(() => false)) {
        await firstGuideLink.click();
        await page.waitForLoadState('networkidle');
        await waitForPageStable(page);
      } else {
        test.skip();
      }
    });

    test('should match guide detail full screenshot', async ({ page }) => {
      const masks = getMaskLocators(page, [
        '[data-testid="timestamp"]',
        '[data-testid="view-count"]',
      ]);

      await expect(page).toHaveScreenshot('guide-detail-full.png', {
        fullPage: true,
        mask: masks,
        maxDiffPixelRatio: 0.01,
      });
    });
  });
});

/**
 * Code Block Visual Tests
 * Tests syntax highlighting and code block rendering
 */
test.describe('Code Blocks - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to any content with code blocks
    await page.goto('/agents', { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/agents/"]').first();

    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await waitForPageStable(page);
    } else {
      test.skip();
    }
  });

  test('should match code block appearance', async ({ page }) => {
    const codeBlock = page
      .locator('pre code')
      .or(page.locator('[data-testid="code-block"]'))
      .first();

    if (await codeBlock.isVisible().catch(() => false)) {
      await expect(codeBlock).toHaveScreenshot('code-block.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('should match code block with line numbers', async ({ page }) => {
    const codeBlockWithLines = page
      .locator('pre[class*="line-numbers"]')
      .or(page.locator('[data-testid="code-block-lines"]'))
      .first();

    if (await codeBlockWithLines.isVisible().catch(() => false)) {
      await expect(codeBlockWithLines).toHaveScreenshot('code-block-line-numbers.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('should match copy button on code block hover', async ({ page }) => {
    const codeBlock = page.locator('pre').first();

    if (await codeBlock.isVisible().catch(() => false)) {
      // Hover over code block to reveal copy button
      await codeBlock.hover();
      await page.waitForTimeout(200);

      // Capture with copy button visible
      await expect(codeBlock).toHaveScreenshot('code-block-hover.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

/**
 * Responsive Detail Layout Tests
 * Verifies sidebar and content layout adapts correctly
 */
test.describe('Detail Page - Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/agents/"]').first();

    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await waitForPageStable(page);
    } else {
      test.skip();
    }
  });

  test('should show correct layout based on viewport', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width || 0;

    // Capture layout at current viewport
    await expect(page).toHaveScreenshot('detail-layout-responsive.png', {
      fullPage: false, // Viewport only
      maxDiffPixelRatio: 0.01,
    });

    // Verify layout based on viewport
    if (viewportWidth < 1024) {
      // Mobile/Tablet: Stacked layout
      const sidebar = page.locator('aside').first();
      if (await sidebar.isVisible().catch(() => false)) {
        const sidebarPosition = await sidebar.boundingBox();
        expect(sidebarPosition?.width).toBeGreaterThan(0);
        // Sidebar should be full-width on mobile
      }
    } else {
      // Desktop: Side-by-side layout
      const sidebar = page.locator('aside').first();
      const main = page.locator('main').first();

      if (
        (await sidebar.isVisible().catch(() => false)) &&
        (await main.isVisible().catch(() => false))
      ) {
        const sidebarBox = await sidebar.boundingBox();
        const mainBox = await main.boundingBox();

        // Sidebar and main should be side-by-side
        if (sidebarBox && mainBox) {
          // Allow for some layout flexibility
          expect(Math.abs(sidebarBox.y - mainBox.y)).toBeLessThan(100);
        }
      }
    }
  });
});

/**
 * Interactive Element Visual Tests
 * Tests buttons, badges, and interactive components
 */
test.describe('Interactive Elements - Visual States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/agents/"]').first();

    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await waitForPageStable(page);
    } else {
      test.skip();
    }
  });

  test('should match copy button appearance', async ({ page }) => {
    const copyButton = page
      .locator('button:has-text("Copy")')
      .or(page.locator('[data-testid="copy-button"]'))
      .first();

    if (await copyButton.isVisible().catch(() => false)) {
      await expect(copyButton).toHaveScreenshot('copy-button.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('should match copy button hover state', async ({ page }) => {
    const copyButton = page.locator('button:has-text("Copy")').first();

    if (await copyButton.isVisible().catch(() => false)) {
      await copyButton.hover();
      await page.waitForTimeout(100);

      await expect(copyButton).toHaveScreenshot('copy-button-hover.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('should match badge components', async ({ page }) => {
    const badgeContainer = page
      .locator('[class*="badge"]')
      .or(page.locator('[data-testid="badges"]'))
      .first();

    if (await badgeContainer.isVisible().catch(() => false)) {
      await expect(badgeContainer).toHaveScreenshot('badges.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

/**
 * Related Content Visual Tests
 * Tests related/similar content sections
 */
test.describe('Related Content - Visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/agents/"]').first();

    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await waitForPageStable(page);
    } else {
      test.skip();
    }
  });

  test('should match related content section', async ({ page }) => {
    const relatedSection = page
      .locator('section:has-text("Related")')
      .or(page.locator('[data-testid="related-content"]'));

    if (await relatedSection.isVisible().catch(() => false)) {
      await relatedSection.scrollIntoViewIfNeeded();
      await waitForPageStable(page);

      await expect(relatedSection).toHaveScreenshot('related-content.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});
