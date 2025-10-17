/**
 * Homepage Visual Regression Tests
 *
 * Systematic visual regression testing across all standard breakpoints.
 * Captures screenshots for baseline comparison to detect unintended visual changes.
 *
 * **Coverage:**
 * - Homepage at mobile (320px)
 * - Homepage at tablet (768px)
 * - Homepage at desktop (1024px)
 * - Homepage at wide (1280px)
 * - Homepage at ultra (1920px)
 *
 * **Strategy:**
 * - Uses Playwright's built-in visual comparison (toHaveScreenshot)
 * - Tests run in viewport-specific projects (mobile-viewport, tablet-viewport, etc.)
 * - Automatically captures and compares against baselines
 * - Fails if visual differences exceed threshold (1% default)
 *
 * **First Run:**
 * Run with `--update-snapshots` to generate baseline screenshots:
 * ```bash
 * npx playwright test homepage.visual --update-snapshots
 * ```
 *
 * **Subsequent Runs:**
 * Tests compare against baselines automatically:
 * ```bash
 * npx playwright test homepage.visual
 * ```
 *
 * @see tests/utils/visual-testing.ts - Visual testing utilities
 * @see config/tools/playwright.config.ts - Viewport project configuration
 * @group visual
 */

import { expect, test } from '@playwright/test';
import { getMaskLocators, waitForPageStable } from '@/tests/utils/visual-testing';

/**
 * Homepage Visual Tests
 * Run in all viewport projects (mobile-viewport, tablet-viewport, desktop-viewport, wide-viewport, ultra-viewport)
 */
test.describe('Homepage - Visual Regression', () => {
  /**
   * Before each test: Navigate to homepage and wait for stability
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageStable(page);
  });

  /**
   * Full Page Screenshot
   * Captures entire homepage for comprehensive visual comparison
   */
  test('should match homepage screenshot', async ({ page }) => {
    // Mask dynamic content (timestamps, live updates, user avatars)
    const masks = getMaskLocators(page, [
      '[data-testid="timestamp"]',
      '[data-testid="user-avatar"]',
      '.live-update',
    ]);

    // Capture full-page screenshot with Playwright's visual comparison
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      mask: masks,
      maxDiffPixelRatio: 0.01, // 1% tolerance for minor rendering differences
    });
  });

  /**
   * Hero Section Screenshot
   * Tests most visible "above the fold" content
   */
  test('should match hero section screenshot', async ({ page }) => {
    const hero = page.locator('section').first();
    await hero.waitFor({ state: 'visible' });

    await expect(hero).toHaveScreenshot('homepage-hero.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  /**
   * Navigation Screenshot
   * Tests header/navigation consistency across viewports
   */
  test('should match navigation screenshot', async ({ page }) => {
    const nav = page.locator('header nav').first();
    await nav.waitFor({ state: 'visible' });

    await expect(nav).toHaveScreenshot('homepage-navigation.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  /**
   * Footer Screenshot
   * Tests footer consistency (often overlooked in manual testing)
   */
  test('should match footer screenshot', async ({ page }) => {
    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    await footer.waitFor({ state: 'visible' });

    await expect(footer).toHaveScreenshot('homepage-footer.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  /**
   * Dark Mode Screenshot
   * Tests dark theme appearance (critical for dark mode users)
   */
  test('should match dark mode screenshot', async ({ page }) => {
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Wait for theme transition
    await page.waitForTimeout(300);

    // Mask dynamic content
    const masks = getMaskLocators(page, [
      '[data-testid="timestamp"]',
      '[data-testid="user-avatar"]',
    ]);

    // Capture dark mode screenshot
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      mask: masks,
      maxDiffPixelRatio: 0.01,
    });
  });

  /**
   * Command Palette Screenshot
   * Tests command palette (⌘K) appearance
   */
  test('should match command palette screenshot', async ({ page }) => {
    // Open command palette
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

    // Wait for command palette to open
    const commandPalette = page.locator('[role="dialog"]').or(page.locator('[role="combobox"]'));
    await commandPalette.waitFor({ state: 'visible' });

    // Capture command palette screenshot
    await expect(commandPalette).toHaveScreenshot('homepage-command-palette.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  /**
   * Scroll Position Tests
   * Tests visual appearance at different scroll positions
   */
  test('should match mid-page scroll screenshot', async ({ page }) => {
    // Scroll to middle of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    // Wait for scroll to complete
    await page.waitForTimeout(200);

    // Mask dynamic content
    const masks = getMaskLocators(page, ['[data-testid="timestamp"]']);

    // Capture mid-scroll screenshot
    await expect(page).toHaveScreenshot('homepage-mid-scroll.png', {
      fullPage: false, // Viewport only (not full page)
      mask: masks,
      maxDiffPixelRatio: 0.01,
    });
  });
});

/**
 * Responsive Layout Tests
 * These tests verify specific responsive behaviors at breakpoint transitions
 */
test.describe('Homepage - Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPageStable(page);
  });

  /**
   * Mobile Menu Test (mobile/tablet only)
   * Verifies mobile menu button appears on small screens
   */
  test('should show mobile menu on small viewports', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width || 0;

    // Only test on mobile/tablet viewports
    if (viewportWidth < 1024) {
      // Mobile menu button should be visible
      const mobileMenuButton = page
        .locator('[aria-label*="menu"]')
        .or(page.locator('button:has-text("Menu")'));
      await expect(mobileMenuButton).toBeVisible();

      // Open mobile menu
      await mobileMenuButton.click();

      // Wait for menu to open
      await page.waitForTimeout(300);

      // Capture open menu screenshot
      await expect(page).toHaveScreenshot('homepage-mobile-menu-open.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.01,
      });
    } else {
      // Skip test on desktop viewports
      test.skip();
    }
  });

  /**
   * Desktop Navigation Test (desktop only)
   * Verifies full navigation appears on large screens
   */
  test('should show full navigation on large viewports', async ({ page }) => {
    const viewportWidth = page.viewportSize()?.width || 0;

    // Only test on desktop+ viewports
    if (viewportWidth >= 1024) {
      // Desktop nav should be visible
      const desktopNav = page.locator('header nav').first();
      await expect(desktopNav).toBeVisible();

      // Capture desktop nav screenshot
      await expect(desktopNav).toHaveScreenshot('homepage-desktop-nav.png', {
        maxDiffPixelRatio: 0.01,
      });
    } else {
      // Skip test on mobile/tablet viewports
      test.skip();
    }
  });
});
