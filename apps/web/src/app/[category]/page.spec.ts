import { test, expect } from '@playwright/test';
import { waitForPageLoad, setTheme, viewports } from '../../../../../config/tests/utils/helpers';

test.describe('Category Page Visual Regression', () => {
  // Test with a known category
  const testCategory = 'agents';
  
  test('category page - desktop - light mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'light');
    await page.goto(`/${testCategory}`);
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('category-desktop-light.png', {
      fullPage: true,
    });
  });
  
  test('category page - desktop - dark mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'dark');
    await page.goto(`/${testCategory}`);
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('category-desktop-dark.png', {
      fullPage: true,
    });
  });
  
  test('category page - mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto(`/${testCategory}`);
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('category-mobile.png', {
      fullPage: true,
    });
  });
});
