import { Page } from '@playwright/test';

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  // Wait for images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = resolve; // Resolve even on error to not block
              setTimeout(resolve, 5000); // Timeout after 5s
            })
        )
    );
  });
  // Wait for any animations/transitions to complete
  await page.waitForTimeout(1000);
  // Wait for any lazy-loaded content
  await page.evaluate(() => {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve(undefined);
      } else {
        window.addEventListener('load', () => resolve(undefined));
        setTimeout(() => resolve(undefined), 2000); // Timeout after 2s
      }
    });
  });
  // Final wait for stability
  await page.waitForTimeout(500);
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
