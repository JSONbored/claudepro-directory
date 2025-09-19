import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function generateOGScreenshot() {
  console.log('🚀 Launching browser to capture site screenshot...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to OG image dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2, // Higher quality
    });

    // Navigate to your local site
    console.log('📸 Navigating to site...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for content to fully load
    await page.waitForSelector('.grid', { timeout: 5000 });

    // Hide cookie banner or other overlays if they exist
    await page.evaluate(() => {
      // Remove any fixed position elements that might overlay
      const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
      fixedElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    });

    // Scroll down slightly to show the main content
    await page.evaluate(() => window.scrollBy(0, 50));

    // Take screenshot
    console.log('📷 Taking screenshot...');
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      encoding: 'binary',
    });

    // Save to public directory
    const outputPath = path.join(process.cwd(), 'public', 'og-screenshot.png');
    await fs.writeFile(outputPath, screenshotBuffer);

    console.log('✅ Screenshot saved to:', outputPath);
    console.log('🎨 You can now use this as your OG image!');

    // Also generate a Twitter-optimized version (slightly different aspect ratio if needed)
    const twitterPath = path.join(process.cwd(), 'public', 'twitter-screenshot.png');
    await fs.writeFile(twitterPath, screenshotBuffer);
    console.log('🐦 Twitter image saved to:', twitterPath);
  } catch (error) {
    console.error('❌ Error generating screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
generateOGScreenshot().catch(console.error);
