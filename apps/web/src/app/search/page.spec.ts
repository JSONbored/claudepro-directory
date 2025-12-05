import { test, expect } from '@playwright/test';
import { waitForPageLoad, setTheme, viewports } from '../../../../../config/tests/utils/helpers';

test.describe('Search Page Visual Regression', () => {
  test('search page - desktop - light mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'light');
    await page.goto('/search');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('search-desktop-light.png', {
      fullPage: true,
    });
  });
  
  test('search page - desktop - dark mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'dark');
    await page.goto('/search');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('search-desktop-dark.png', {
      fullPage: true,
    });
  });
  
  test('search page - mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/search');
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('search-mobile.png', {
      fullPage: true,
    });
  });
});
