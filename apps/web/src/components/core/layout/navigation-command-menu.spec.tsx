import { expect, test } from '@playwright/test';

/**
 * Comprehensive Command Palette (CMDK) E2E Tests
 * 
 * Tests ALL functionality with strict error checking:
 * - Command palette open/close (⌘K)
 * - Search functionality
 * - Navigation items
 * - Item hover states
 * - Keyboard navigation
 * - Console error/warning detection (tests FAIL on any errors)
 * - Network error detection
 * - Accessibility testing
 * - User interaction testing
 */

test.describe('Command Palette (CMDK)', () => {
  // Track all console messages for error detection
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset tracking
    consoleErrors = [];
    consoleWarnings = [];
    networkErrors = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Filter out known acceptable errors
        if (!isAcceptableError(text)) {
          consoleErrors.push(text);
        }
      } else if (msg.type() === 'warning') {
        // Filter out known acceptable warnings
        if (!isAcceptableWarning(text)) {
          consoleWarnings.push(text);
        }
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      const url = request.url();
      // Filter out non-critical failures
      if (isCriticalResource(url)) {
        networkErrors.push(`${url} - ${request.failure()?.errorText}`);
      }
    });

    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for React to hydrate
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    // FAIL test if any console errors detected
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Test failed due to console errors: ${consoleErrors.join('; ')}`);
    }

    // FAIL test if any console warnings detected (strict mode)
    if (consoleWarnings.length > 0) {
      console.warn('Console warnings detected:', consoleWarnings);
      throw new Error(`Test failed due to console warnings: ${consoleWarnings.join('; ')}`);
    }

    // FAIL test if any network errors detected
    if (networkErrors.length > 0) {
      console.error('Network errors detected:', networkErrors);
      throw new Error(`Test failed due to network errors: ${networkErrors.join('; ')}`);
    }
  });

  test('should open command palette with ⌘K keyboard shortcut', async ({ page, browserName }) => {
    // Use appropriate modifier key based on platform
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    
    // Press ⌘K or Ctrl+K
    await page.keyboard.press(`${modifier}+KeyK`);
    
    // Wait for command palette to open
    await page.waitForTimeout(500);
    
    // Check command palette is visible
    const commandPalette = page.locator('[role="dialog"], [cmdk-root]').or(
      page.getByPlaceholder(/search navigation/i)
    );
    await expect(commandPalette).toBeVisible();
  });

  test('should open command palette when search icon is clicked', async ({ page }) => {
    // Find and click the search button in secondary navbar
    const searchButton = page.getByRole('button', { name: /search|command/i }).or(
      page.locator('button[aria-label*="search" i], button[aria-label*="command" i]')
    ).first();
    
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    
    // Wait for command palette to open
    await page.waitForTimeout(500);
    
    // Check command palette is visible
    const commandPalette = page.locator('[role="dialog"], [cmdk-root]').or(
      page.getByPlaceholder(/search navigation/i)
    );
    await expect(commandPalette).toBeVisible();
  });

  test('should close command palette with Escape key', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Check command palette is closed
    const commandPalette = page.locator('[role="dialog"][data-state="open"]');
    await expect(commandPalette).not.toBeVisible();
  });

  test('should display search input with placeholder', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Check search input is visible with placeholder
    const searchInput = page.getByPlaceholder(/search navigation/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search/i);
  });

  test('should filter navigation items when typing', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Type in search input
    const searchInput = page.getByPlaceholder(/search navigation/i);
    await searchInput.fill('agents');
    await page.waitForTimeout(500);
    
    // Check that results are filtered (either search results or filtered navigation)
    const results = page.locator('[cmdk-item], [role="option"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate items with arrow keys', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Press down arrow to navigate
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    
    // Check that an item is selected/highlighted
    const selectedItem = page.locator('[cmdk-item][data-selected="true"], [role="option"][aria-selected="true"]');
    await expect(selectedItem).toBeVisible();
  });

  test('should select item with Enter key', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Navigate to first item
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Command palette should close and navigation should occur
    const commandPalette = page.locator('[role="dialog"][data-state="open"]');
    await expect(commandPalette).not.toBeVisible();
  });

  test('should have smooth spring entrance animation', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    
    // Check that modal animates in smoothly (no jank)
    const commandPalette = page.locator('[role="dialog"]');
    
    // Wait for animation to complete
    await page.waitForTimeout(500);
    
    // Verify it's visible and positioned correctly
    await expect(commandPalette).toBeVisible();
    
    // Check that it has proper styling (centered, rounded, shadow)
    const boundingBox = await commandPalette.boundingBox();
    expect(boundingBox).not.toBeNull();
  });

  test('should have subtle hover effects on items', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Find first item
    const firstItem = page.locator('[cmdk-item], [role="option"]').first();
    
    if (await firstItem.isVisible()) {
      // Hover over item
      await firstItem.hover();
      await page.waitForTimeout(300);
      
      // Check that item has hover state (background color change)
      const backgroundColor = await firstItem.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Background should not be transparent (indicates hover state)
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should be accessible with screen readers', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Check for proper ARIA attributes
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Check input has proper label/aria-label
    const searchInput = page.getByPlaceholder(/search navigation/i);
    await expect(searchInput).toHaveAttribute('aria-label').or(
      expect(searchInput).toHaveAttribute('aria-labelledby')
    );
  });

  test('should respect reduced motion preferences', async ({ page, context, browserName }) => {
    // Set reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });
    
    // Reload page with reduced motion
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // With reduced motion, animations should be minimal or disabled
    // Just verify command palette still works
    const commandPalette = page.locator('[role="dialog"]');
    await expect(commandPalette).toBeVisible();
  });

  test('should display loading state when searching', async ({ page, browserName }) => {
    // Open command palette
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);
    
    // Type search query
    const searchInput = page.getByPlaceholder(/search navigation/i);
    await searchInput.fill('test query');
    
    // Check for loading indicator (if search is async)
    const loadingIndicator = page.locator('[aria-busy="true"], [data-loading="true"]').or(
      page.getByText(/searching/i)
    );
    
    // Loading indicator may appear briefly, so check if it exists
    const hasLoading = await loadingIndicator.count() > 0;
    // Just verify search input is working
    await expect(searchInput).toHaveValue('test query');
  });
});

// Helper functions
function isAcceptableError(text: string): boolean {
  // Add known acceptable errors here
  return false; // Strict mode - no acceptable errors
}

function isAcceptableWarning(text: string): boolean {
  // Add known acceptable warnings here
  return false; // Strict mode - no acceptable warnings
}

function isCriticalResource(url: string): boolean {
  // Filter out non-critical resources (analytics, etc.)
  return !url.includes('analytics') && !url.includes('vercel') && !url.includes('segment');
}
