import { test, expect } from '@playwright/test';
import { waitForPageLoad, setTheme, viewports } from '../../../../../../config/tests/utils/helpers';

test.describe('Content Detail Page Visual Regression', () => {
  // Use a known content item - adjust these based on your actual content
  const testSlug = 'code-reviewer-agent';
  const testCategory = 'agents';
  
  test('content detail - desktop - light mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'light');
    await page.goto(`/${testCategory}/${testSlug}`);
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('content-detail-desktop-light.png', {
      fullPage: true,
    });
  });
  
  test('content detail - desktop - dark mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await setTheme(page, 'dark');
    await page.goto(`/${testCategory}/${testSlug}`);
    await waitForPageLoad(page);
    
    await expect(page).toHaveScreenshot('content-detail-desktop-dark.png', {
      fullPage: true,
    });
  });
  
  test('content detail - tabs section', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto(`/${testCategory}/${testSlug}`);
    await waitForPageLoad(page);
    
    const tabs = page.locator('[data-testid="content-tabs"]');
    if (await tabs.count() > 0) {
      await expect(tabs).toHaveScreenshot('content-detail-tabs.png');
    }
  });
  
  test('content detail - code block', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto(`/${testCategory}/${testSlug}`);
    await waitForPageLoad(page);
    
    // Navigate to code tab if needed
    const codeTab = page.locator('[data-testid="tab-trigger"]').filter({ hasText: /code/i }).first();
    if (await codeTab.count() > 0) {
      await codeTab.click();
      await page.waitForTimeout(500);
    }
    
    const codeBlock = page.locator('[data-testid="code-block"]').first();
    if (await codeBlock.count() > 0) {
      await expect(codeBlock).toHaveScreenshot('content-detail-code-block.png');
    }
  });
});
