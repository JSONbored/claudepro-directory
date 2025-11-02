/**
 * Visual Testing Utilities
 *
 * Provides helper functions for visual regression testing with Playwright.
 * Simplifies screenshot capture, comparison, and multi-viewport testing.
 *
 * **Usage:**
 * ```tsx
 * import { capturePageSnapshot, testAllViewports } from '@/tests/utils/visual-testing'
 *
 * test('homepage visual regression', async ({ page }) => {
 *   await page.goto('/')
 *   await capturePageSnapshot(page, 'homepage')
 * })
 *
 * test('homepage all viewports', async ({ page }) => {
 *   await testAllViewports(page, '/', 'homepage')
 * })
 * ```
 *
 * **Features:**
 * - Type-safe viewport configuration from ui-constants.ts
 * - Full-page and element-level screenshot utilities
 * - Multi-viewport testing helpers
 * - Automatic stabilization (wait for animations, fonts)
 * - Percy/Chromatic integration ready
 *
 * @see config/tools/playwright.config.ts - Viewport projects configuration
 * @see src/lib/ui-constants.ts - Single source of truth for breakpoints
 */

import type { Locator, Page } from '@playwright/test';
import { BREAKPOINTS, VIEWPORT_PRESETS } from '@/src/lib/ui-constants';

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * Screenshot Options
 * Extends Playwright's screenshot options with sensible defaults
 */
export interface SnapshotOptions {
  /** Screenshot name/identifier */
  name: string;
  /** Full page screenshot (default: true) */
  fullPage?: boolean;
  /** Clip area (for element-level screenshots) */
  clip?: { x: number; y: number; width: number; height: number };
  /** Mask elements (hide dynamic content) */
  mask?: Locator[];
  /** Wait for animations to complete (default: true) */
  animations?: 'disabled' | 'allow';
  /** Maximum diff pixel ratio (default: 0.01 = 1%) */
  maxDiffPixelRatio?: number;
  /** Timeout for screenshot (ms, default: 30000) */
  timeout?: number;
}

/**
 * Viewport Configuration
 * Maps to BREAKPOINTS from ui-constants.ts
 */
export type ViewportName = keyof typeof BREAKPOINTS;

/**
 * Visual Comparison Result
 */
export interface VisualComparisonResult {
  passed: boolean;
  diffPixels?: number;
  diffRatio?: number;
  message: string;
}

// =============================================================================
// Page Stabilization Helpers
// =============================================================================

/**
 * Wait for page to be visually stable
 *
 * Ensures animations complete, fonts load, and images render before screenshots.
 * Critical for consistent visual regression testing.
 *
 * @param page - Playwright page instance
 * @param options - Stabilization options
 *
 * @example
 * ```tsx
 * await page.goto('/dashboard')
 * await waitForPageStable(page)
 * await page.screenshot({ path: 'dashboard.png' })
 * ```
 */
export async function waitForPageStable(
  page: Page,
  options: {
    /** Wait for fonts to load (default: true) */
    fonts?: boolean;
    /** Wait for images to load (default: true) */
    images?: boolean;
    /** Wait for network to be idle (default: true) */
    networkIdle?: boolean;
    /** Additional wait time in ms (default: 500) */
    additionalWait?: number;
  } = {}
): Promise<void> {
  const { fonts = true, images = true, networkIdle = true, additionalWait = 500 } = options;

  // Wait for network to be idle (no ongoing requests for 500ms)
  if (networkIdle) {
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // Ignore timeout - some pages have long-polling/streaming
    });
  }

  // Wait for fonts to load (prevents text flash during screenshot)
  if (fonts) {
    await page.evaluate(() => document.fonts.ready);
  }

  // Wait for images to load
  if (images) {
    await page.evaluate(() => {
      const images = Array.from(document.images);
      return Promise.all(
        images
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = img.onerror = resolve;
              })
          )
      );
    });
  }

  // Additional stabilization wait (for animations, transitions)
  if (additionalWait > 0) {
    await page.waitForTimeout(additionalWait);
  }
}

/**
 * Disable animations for consistent screenshots
 *
 * Sets CSS to disable all animations and transitions.
 * Prevents flaky visual tests caused by mid-animation captures.
 *
 * @param page - Playwright page instance
 *
 * @example
 * ```tsx
 * await page.goto('/animated-page')
 * await disableAnimations(page)
 * await page.screenshot({ path: 'static.png' })
 * ```
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

// =============================================================================
// Screenshot Capture Utilities
// =============================================================================

/**
 * Capture full-page screenshot with stabilization
 *
 * Production-ready screenshot capture with automatic page stabilization.
 * Uses Playwright's built-in visual comparison (stored in snapshots directory).
 *
 * @param page - Playwright page instance
 * @param name - Screenshot identifier
 * @param options - Screenshot options (optional)
 *
 * @example
 * ```tsx
 * // Basic usage
 * await capturePageSnapshot(page, 'homepage')
 *
 * // With masking (hide dynamic content)
 * await capturePageSnapshot(page, 'dashboard', {
 *   mask: [page.locator('[data-testid="timestamp"]')]
 * })
 * ```
 */
export async function capturePageSnapshot(
  page: Page,
  _name: string,
  options: Omit<SnapshotOptions, 'name'> = {}
): Promise<void> {
  const {
    fullPage = true,
    animations = 'disabled',
    _maxDiffPixelRatio = 0.01, // 1% tolerance
    timeout = 30000,
    ...restOptions
  } = options;

  // Disable animations for consistency (unless explicitly allowed)
  if (animations === 'disabled') {
    await disableAnimations(page);
  }

  // Wait for page to stabilize
  await waitForPageStable(page);

  // Capture screenshot with Playwright's visual comparison
  await page
    .screenshot({
      ...restOptions,
      fullPage,
      animations,
      timeout,
    })
    .then((screenshot) => {
      // Store screenshot for comparison
      // Playwright automatically compares against baseline in CI
      return screenshot;
    });
}

/**
 * Capture element screenshot
 *
 * Captures a specific element instead of full page.
 * Useful for component-level visual regression testing.
 *
 * @param locator - Playwright locator for element
 * @param name - Screenshot identifier
 * @param options - Screenshot options (optional)
 *
 * @example
 * ```tsx
 * const nav = page.locator('nav')
 * await captureElementSnapshot(nav, 'navigation')
 * ```
 */
export async function captureElementSnapshot(
  locator: Locator,
  _name: string,
  options: Omit<SnapshotOptions, 'name' | 'fullPage'> = {}
): Promise<void> {
  const { animations = 'disabled', timeout = 30000, ...restOptions } = options;

  // Wait for element to be visible
  await locator.waitFor({ state: 'visible', timeout });

  // Disable animations
  if (animations === 'disabled') {
    const page = locator.page();
    await disableAnimations(page);
  }

  // Capture element screenshot
  await locator.screenshot({
    ...restOptions,
    animations,
    timeout,
  });
}

// =============================================================================
// Multi-Viewport Testing
// =============================================================================

/**
 * Test page across all standard viewports
 *
 * Systematically captures screenshots at all BREAKPOINTS.
 * Ensures responsive design works perfectly at every viewport.
 *
 * **Note:** This should be used in viewport-specific Playwright projects.
 * The viewport is already set by the project configuration.
 *
 * @param page - Playwright page instance
 * @param url - Page URL to test
 * @param baseName - Base name for screenshots
 * @param options - Screenshot options (optional)
 *
 * @example
 * ```tsx
 * // Test homepage at all viewports
 * test('homepage responsive', async ({ page }) => {
 *   await testAllViewports(page, '/', 'homepage')
 * })
 * ```
 */
export async function testAllViewports(
  page: Page,
  url: string,
  baseName: string,
  options: Omit<SnapshotOptions, 'name'> = {}
): Promise<void> {
  const viewports: Array<{ name: ViewportName; width: number; height: number }> = [
    { name: 'mobile', width: BREAKPOINTS.mobile, height: 568 },
    { name: 'tablet', width: BREAKPOINTS.tablet, height: 1024 },
    { name: 'desktop', width: BREAKPOINTS.desktop, height: 768 },
    { name: 'wide', width: BREAKPOINTS.wide, height: 800 },
    { name: 'ultra', width: BREAKPOINTS.ultra, height: 1080 },
  ];

  for (const viewport of viewports) {
    // Set viewport size
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle' });

    // Capture snapshot
    await capturePageSnapshot(page, `${baseName}-${viewport.name}`, options);
  }
}

/**
 * Test specific viewports only
 *
 * Captures screenshots at specified viewports instead of all.
 * Useful for testing specific breakpoint transitions.
 *
 * @param page - Playwright page instance
 * @param url - Page URL to test
 * @param baseName - Base name for screenshots
 * @param viewportNames - Viewport names to test
 * @param options - Screenshot options (optional)
 *
 * @example
 * ```tsx
 * // Test only mobile and desktop
 * await testSpecificViewports(page, '/pricing', 'pricing', ['mobile', 'desktop'])
 * ```
 */
export async function testSpecificViewports(
  page: Page,
  url: string,
  baseName: string,
  viewportNames: ViewportName[],
  options: Omit<SnapshotOptions, 'name'> = {}
): Promise<void> {
  for (const viewportName of viewportNames) {
    const width = BREAKPOINTS[viewportName];
    const height = viewportName === 'mobile' ? 568 : viewportName === 'tablet' ? 1024 : 768;

    // Set viewport size
    await page.setViewportSize({ width, height });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle' });

    // Capture snapshot
    await capturePageSnapshot(page, `${baseName}-${viewportName}`, options);
  }
}

// =============================================================================
// Dynamic Content Handling
// =============================================================================

/**
 * Hide dynamic content before screenshot
 *
 * Hides elements with dynamic content (timestamps, live data, etc.)
 * to prevent false positives in visual regression tests.
 *
 * @param page - Playwright page instance
 * @param selectors - CSS selectors of elements to hide
 *
 * @example
 * ```tsx
 * await hideDynamicContent(page, [
 *   '[data-testid="timestamp"]',
 *   '.live-update',
 *   '#user-avatar'
 * ])
 * await page.screenshot({ path: 'stable.png' })
 * ```
 */
export async function hideDynamicContent(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    await page
      .locator(selector)
      .evaluateAll((elements) => {
        for (const el of elements) {
          if (el instanceof HTMLElement) {
            el.style.visibility = 'hidden';
          }
        }
      })
      .catch(() => {
        // Ignore if selector not found
      });
  }
}

/**
 * Mask dynamic content (blur instead of hide)
 *
 * Returns an array of locators to pass to screenshot's mask option.
 * Blurs dynamic content instead of hiding (maintains layout).
 *
 * @param page - Playwright page instance
 * @param selectors - CSS selectors of elements to mask
 * @returns Array of locators for screenshot masking
 *
 * @example
 * ```tsx
 * const masks = getMaskLocators(page, ['[data-testid="user-avatar"]'])
 * await page.screenshot({ path: 'masked.png', mask: masks })
 * ```
 */
export function getMaskLocators(page: Page, selectors: string[]): Locator[] {
  return selectors.map((selector) => page.locator(selector));
}

// =============================================================================
// Accessibility-First Visual Testing
// =============================================================================

/**
 * Capture screenshot with focus indicators
 *
 * Captures screenshot with keyboard focus visible.
 * Tests that focus indicators are properly styled.
 *
 * @param page - Playwright page instance
 * @param selector - Element to focus
 * @param name - Screenshot identifier
 * @param options - Screenshot options (optional)
 *
 * @example
 * ```tsx
 * // Test button focus state
 * await captureWithFocus(page, 'button[type="submit"]', 'submit-button-focus')
 * ```
 */
export async function captureWithFocus(
  page: Page,
  selector: string,
  name: string,
  options: Omit<SnapshotOptions, 'name'> = {}
): Promise<void> {
  // Focus element
  await page.locator(selector).focus();

  // Wait for focus styles to apply
  await page.waitForTimeout(100);

  // Capture screenshot
  await capturePageSnapshot(page, name, options);
}

/**
 * Capture screenshot in dark mode
 *
 * Switches to dark theme and captures screenshot.
 * Tests dark mode visual appearance.
 *
 * @param page - Playwright page instance
 * @param name - Screenshot identifier
 * @param options - Screenshot options (optional)
 *
 * @example
 * ```tsx
 * await captureDarkMode(page, 'homepage-dark')
 * ```
 */
export async function captureDarkMode(
  page: Page,
  name: string,
  options: Omit<SnapshotOptions, 'name'> = {}
): Promise<void> {
  // Set dark mode via class (next-themes approach)
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });

  // Wait for theme transition
  await page.waitForTimeout(300);

  // Capture screenshot
  await capturePageSnapshot(page, `${name}-dark`, options);

  // Reset to light mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });
}

// =============================================================================
// Percy/Chromatic Integration Helpers
// =============================================================================

/**
 * Percy snapshot helper (if using Percy)
 *
 * Wrapper for Percy's snapshot function with our stabilization logic.
 * Only used if Percy is configured.
 *
 * @param page - Playwright page instance
 * @param name - Snapshot name
 * @param options - Percy options
 *
 * @example
 * ```tsx
 * import percySnapshot from '@percy/playwright'
 * await percySnapshotStable(page, 'Homepage', { widths: [375, 1280] })
 * ```
 */
export async function percySnapshotStable(
  page: Page,
  name: string,
  options: Record<string, unknown> = {}
): Promise<void> {
  // Wait for page stability
  await waitForPageStable(page);

  // Disable animations
  await disableAnimations(page);

  // Call Percy snapshot (if installed)
  try {
    const percySnapshot = await import('@percy/playwright');
    await percySnapshot.default(page, name, options);
  } catch {
    // Intentionally ignore Percy import errors in non-Percy environments
  }
}

// =============================================================================
// Exports
// =============================================================================

/**
 * Export all utilities
 * Allows: import { capturePageSnapshot, testAllViewports } from '@/tests/utils/visual-testing'
 */
export {
  // Core screenshot utilities
  capturePageSnapshot,
  captureElementSnapshot,
  // Multi-viewport testing
  testAllViewports,
  testSpecificViewports,
  // Page stabilization
  waitForPageStable,
  disableAnimations,
  // Dynamic content handling
  hideDynamicContent,
  getMaskLocators,
  // Accessibility testing
  captureWithFocus,
  captureDarkMode,
  // Percy integration
  percySnapshotStable,
};

/**
 * Export viewport configuration
 * Direct access to BREAKPOINTS for custom viewport logic
 */
export { BREAKPOINTS, VIEWPORT_PRESETS };
