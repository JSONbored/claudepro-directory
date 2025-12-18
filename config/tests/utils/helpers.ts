import { Page } from '@playwright/test';

/**
 * Wait for page to be fully loaded and stable
 * 
 * Uses Playwright's built-in waiting strategies for efficiency.
 * Waits for network idle, DOM content loaded, and React hydration.
 * 
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 */
export async function waitForPageLoad(page: Page, timeout = 30000) {
  // Wait for network to be idle (all requests completed)
  await page.waitForLoadState('networkidle', { timeout });
  
  // Wait for DOM content to be loaded
  await page.waitForLoadState('domcontentloaded', { timeout });
  
  // Wait for React to hydrate (most components need this)
  await page.waitForTimeout(1000);
  
  // Wait for any remaining images to load (with timeout)
  try {
    await page.waitForFunction(
      () => {
        const images = Array.from(document.images);
        return images.every(img => img.complete || img.naturalWidth === 0);
      },
      { timeout: 5000 }
    );
  } catch {
    // Ignore timeout - images may be lazy-loaded or have errors
  }
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(200); // Wait for theme transition
}

export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};
