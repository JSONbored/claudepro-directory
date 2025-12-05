import { test, expect } from '@playwright/test';
import { waitForPageLoad, setTheme, viewports } from '../../../../config/tests/utils/helpers';

test.describe('Homepage Visual Regression', () => {
  test('homepage - desktop - light mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'light');
    await page.goto('/');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('homepage-desktop-light.png', {
      fullPage: true,
      maxDiffPixels: 500, // Allow small differences for dynamic content
      timeout: 15000, // Increased timeout for homepage stability
    });
  });
  
  test('homepage - desktop - dark mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'dark');
    await page.goto('/');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('homepage-desktop-dark.png', {
      fullPage: true,
    });
  });
  
  test('homepage - tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
    });
  });
  
  test('homepage - mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });
});
