/**
 * Generate Real PWA Screenshots with Playwright
 *
 * PRODUCTION-GRADE:
 * - Captures real browser screenshots (not resized images)
 * - Mobile-first responsive design
 * - Optimized file sizes
 * - Proper viewport dimensions for PWA manifest
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const SCREENSHOTS = [
  {
    name: 'screenshot-mobile',
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    url: 'http://localhost:3008',
  },
  {
    name: 'screenshot-desktop',
    viewport: { width: 1920, height: 1080 }, // Desktop HD
    url: 'http://localhost:3008',
  },
];

async function generateScreenshots() {
  console.log('🚀 Starting PWA screenshot generation with Playwright...\n');

  const browser = await chromium.launch({ headless: true });

  try {
    for (const config of SCREENSHOTS) {
      console.log(
        `📸 Capturing ${config.name} (${config.viewport.width}x${config.viewport.height})...`
      );

      const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: 2, // Retina display
        colorScheme: 'dark', // Match our dark theme
      });

      const page = await context.newPage();

      // Navigate to URL
      await page.goto(config.url, { waitUntil: 'networkidle' });

      // Wait for content to fully load
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false, // Only capture viewport
      });

      // Save to public directory
      const outputPath = join(process.cwd(), 'public', `${config.name}.png`);
      await writeFile(outputPath, screenshot);

      console.log(`✅ Saved: ${outputPath}\n`);

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log('🎉 PWA screenshots generated successfully!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateScreenshots().catch((error) => {
    console.error('❌ Failed to generate screenshots:', error);
    process.exit(1);
  });
}

export { generateScreenshots };
