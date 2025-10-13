/**
 * E2E Test Helpers
 *
 * Reusable helper functions for Playwright E2E tests.
 * Follows DRY principle and provides type-safe utilities.
 *
 * **Security:** No sensitive data in helpers
 * **Performance:** Optimized wait strategies
 * **Maintainability:** Single responsibility, well-documented
 *
 * @module tests/e2e/helpers
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

// =============================================================================
// Navigation Helpers
// =============================================================================

/**
 * Navigate to homepage and wait for page to be fully loaded
 *
 * @param page - Playwright page instance
 * @returns Promise that resolves when page is loaded
 *
 * @example
 * ```ts
 * await navigateToHomepage(page);
 * await expect(page).toHaveTitle(/ClaudePro/);
 * ```
 */
export async function navigateToHomepage(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/');
}

/**
 * Navigate to a category page
 *
 * @param page - Playwright page instance
 * @param category - Category slug (agents, mcp, rules, commands, hooks, statuslines)
 * @returns Promise that resolves when page is loaded
 *
 * @example
 * ```ts
 * await navigateToCategory(page, 'agents');
 * await expect(page).toHaveURL('/agents');
 * ```
 */
export async function navigateToCategory(page: Page, category: string): Promise<void> {
  await page.goto(`/${category}`);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(`/${category}`);
}

/**
 * Navigate to search page
 *
 * @param page - Playwright page instance
 * @param query - Optional search query
 * @returns Promise that resolves when page is loaded
 */
export async function navigateToSearch(page: Page, query?: string): Promise<void> {
  const url = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  // Allow query parameters in URL check
  await expect(page).toHaveURL(/^\/search/);
}

/**
 * Navigate to submit page
 *
 * @param page - Playwright page instance
 * @returns Promise that resolves when page is loaded
 */
export async function navigateToSubmit(page: Page): Promise<void> {
  await page.goto('/submit');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/submit');
}

// =============================================================================
// Wait Helpers
// =============================================================================

/**
 * Wait for element to be visible with timeout
 *
 * @param locator - Playwright locator
 * @param options - Wait options
 * @returns Promise that resolves when element is visible
 *
 * @example
 * ```ts
 * await waitForElement(page.locator('[data-testid="loading"]'), { timeout: 5000 });
 * ```
 */
export async function waitForElement(
  locator: Locator,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;
  await locator.waitFor({ state: 'visible', timeout });
}

/**
 * Wait for element to disappear
 *
 * @param locator - Playwright locator
 * @param options - Wait options
 * @returns Promise that resolves when element is hidden
 *
 * @example
 * ```ts
 * await waitForElementToDisappear(page.locator('[data-testid="loading"]'));
 * ```
 */
export async function waitForElementToDisappear(
  locator: Locator,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;
  await locator.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for network to be idle (no pending requests)
 *
 * @param page - Playwright page instance
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves when network is idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for navigation to complete
 *
 * @param page - Playwright page instance
 * @param urlPattern - Expected URL pattern (string or RegExp)
 * @returns Promise that resolves when navigation is complete
 */
export async function waitForNavigation(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForURL(urlPattern, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// Interaction Helpers
// =============================================================================

/**
 * Fill form field with value
 *
 * @param page - Playwright page instance
 * @param selector - Field selector (label text, placeholder, or CSS selector)
 * @param value - Value to fill
 * @returns Promise that resolves when field is filled
 *
 * @example
 * ```ts
 * await fillField(page, 'Email', 'test@example.com');
 * await fillField(page, '[name="email"]', 'test@example.com');
 * ```
 */
export async function fillField(page: Page, selector: string, value: string): Promise<void> {
  // Try to find by label first (most accessible)
  const field = page.getByLabel(selector, { exact: false }).or(
    // Fallback to placeholder
    page
      .getByPlaceholder(selector, { exact: false })
      .or(
        // Fallback to CSS selector
        page.locator(selector)
      )
  );

  await field.clear();
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

/**
 * Click button by text or role
 *
 * @param page - Playwright page instance
 * @param text - Button text or selector
 * @param options - Click options
 * @returns Promise that resolves when button is clicked
 *
 * @example
 * ```ts
 * await clickButton(page, 'Submit');
 * await clickButton(page, '[data-testid="submit-btn"]');
 * ```
 */
export async function clickButton(
  page: Page,
  text: string,
  options: { exact?: boolean } = {}
): Promise<void> {
  const button = page
    .getByRole('button', { name: text, exact: options.exact })
    .or(page.locator(`button:has-text("${text}")`).or(page.locator(text)));

  await button.scrollIntoViewIfNeeded();
  await button.click();
}

/**
 * Search using the global search
 *
 * @param page - Playwright page instance
 * @param query - Search query
 * @returns Promise that resolves when search is executed
 */
export async function performSearch(page: Page, query: string): Promise<void> {
  // Try command palette (⌘K) first
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyK' : 'Control+KeyK');

  // Wait for command palette to open
  const searchInput = page.locator('[role="combobox"]').or(page.locator('[type="search"]')).first();

  await searchInput.fill(query);
  await page.keyboard.press('Enter');

  // Wait for search results
  await page.waitForURL(/\/(search|agents|mcp|rules|commands|hooks|statuslines)/);
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert page title contains text
 *
 * @param page - Playwright page instance
 * @param text - Expected text in title
 */
export async function expectPageTitle(page: Page, text: string | RegExp): Promise<void> {
  await expect(page).toHaveTitle(text);
}

/**
 * Assert page URL matches pattern
 *
 * @param page - Playwright page instance
 * @param pattern - Expected URL pattern
 */
export async function expectPageURL(page: Page, pattern: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern);
}

/**
 * Assert element is visible
 *
 * @param locator - Playwright locator
 */
export async function expectVisible(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
}

/**
 * Assert element is hidden
 *
 * @param locator - Playwright locator
 */
export async function expectHidden(locator: Locator): Promise<void> {
  await expect(locator).toBeHidden();
}

/**
 * Assert element contains text
 *
 * @param locator - Playwright locator
 * @param text - Expected text
 */
export async function expectText(locator: Locator, text: string | RegExp): Promise<void> {
  await expect(locator).toContainText(text);
}

// =============================================================================
// Accessibility Helpers
// =============================================================================

/**
 * Run accessibility audit on current page
 *
 * Uses axe-core to detect WCAG violations
 *
 * @param page - Playwright page instance
 * @param options - Axe scan options
 * @returns Promise that resolves with accessibility violations
 *
 * @example
 * ```ts
 * const violations = await checkAccessibility(page);
 * expect(violations).toHaveLength(0);
 * ```
 */
export async function checkAccessibility(
  page: Page,
  options: {
    /**
     * Include specific WCAG rules
     * @example ['wcag2a', 'wcag2aa', 'wcag21aa']
     */
    tags?: string[];
    /**
     * Exclude specific elements from scan
     * @example ['[data-test-exclude]']
     */
    exclude?: string[];
  } = {}
): Promise<Awaited<ReturnType<AxeBuilder['analyze']>>> {
  const builder = new AxeBuilder({ page });

  // Set WCAG 2.1 AA compliance (default)
  if (options.tags) {
    builder.withTags(options.tags);
  } else {
    builder.withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
  }

  // Exclude specific elements if provided
  if (options.exclude && options.exclude.length > 0) {
    for (const selector of options.exclude) {
      builder.exclude(selector);
    }
  }

  const results = await builder.analyze();
  return results;
}

/**
 * Assert page has no accessibility violations
 *
 * @param page - Playwright page instance
 * @param options - Axe scan options
 *
 * @example
 * ```ts
 * await expectNoA11yViolations(page);
 * ```
 */
export async function expectNoA11yViolations(
  page: Page,
  options?: Parameters<typeof checkAccessibility>[1]
): Promise<void> {
  const results = await checkAccessibility(page, options);

  // Log violations for debugging
  if (results.violations.length > 0) {
    console.error('Accessibility violations detected:');
    for (const violation of results.violations) {
      console.error(`  - ${violation.id}: ${violation.description}`);
      console.error(`    Impact: ${violation.impact}`);
      console.error(`    Nodes: ${violation.nodes.length}`);
      for (const node of violation.nodes) {
        console.error(`      - ${node.html}`);
      }
    }
  }

  expect(results.violations).toHaveLength(0);
}

// =============================================================================
// Performance Helpers
// =============================================================================

/**
 * Measure page load performance
 *
 * @param page - Playwright page instance
 * @returns Performance metrics
 *
 * @example
 * ```ts
 * const metrics = await measurePerformance(page);
 * expect(metrics.loadTime).toBeLessThan(3000);
 * ```
 */
export async function measurePerformance(page: Page): Promise<{
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
}> {
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');

    return {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstContentfulPaint: fcp?.startTime || 0,
      timeToInteractive: navigation.domInteractive - navigation.fetchStart,
    };
  });

  return performanceMetrics;
}

/**
 * Assert page loads within performance budget
 *
 * @param page - Playwright page instance
 * @param budget - Performance budget in milliseconds
 */
export async function expectFastLoad(page: Page, budget = 3000): Promise<void> {
  const metrics = await measurePerformance(page);
  expect(metrics.loadTime).toBeLessThan(budget);
}

// =============================================================================
// Screenshot Helpers
// =============================================================================

/**
 * Take screenshot of current page
 *
 * @param page - Playwright page instance
 * @param name - Screenshot name
 * @returns Promise that resolves with screenshot buffer
 */
export async function takeScreenshot(page: Page, name: string): Promise<Buffer> {
  return await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Take screenshot of specific element
 *
 * @param locator - Playwright locator
 * @param name - Screenshot name
 * @returns Promise that resolves with screenshot buffer
 */
export async function takeElementScreenshot(locator: Locator, name: string): Promise<Buffer> {
  return await locator.screenshot({
    path: `test-results/screenshots/${name}.png`,
  });
}
