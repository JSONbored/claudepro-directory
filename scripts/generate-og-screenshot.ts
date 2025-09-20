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

    // Set viewport to exactly OG image dimensions
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
    await page.waitForSelector('h1', { timeout: 5000 });

    // Optimize layout specifically for OG image
    await page.evaluate(() => {
      // Remove navigation completely
      const nav = document.querySelector('nav');
      if (nav) {
        nav.remove();
      }

      // Remove any fixed/sticky elements
      const fixedElements = document.querySelectorAll(
        '[style*="position: fixed"], [style*="position: sticky"]'
      );
      fixedElements.forEach((el) => {
        el.remove();
      });

      // Find and style the main content area
      const main = document.querySelector('main');
      if (main) {
        (main as HTMLElement).style.padding = '2rem';
        (main as HTMLElement).style.display = 'flex';
        (main as HTMLElement).style.flexDirection = 'column';
        (main as HTMLElement).style.alignItems = 'center';
        (main as HTMLElement).style.justifyContent = 'center';
        (main as HTMLElement).style.minHeight = '100vh';
        (main as HTMLElement).style.textAlign = 'center';
      }

      // Style the main heading
      const h1 = document.querySelector('h1');
      if (h1) {
        (h1 as HTMLElement).style.fontSize = '3.5rem';
        (h1 as HTMLElement).style.lineHeight = '1.1';
        (h1 as HTMLElement).style.marginBottom = '1.5rem';
        (h1 as HTMLElement).style.fontWeight = '700';
        (h1 as HTMLElement).style.textAlign = 'center';
        (h1 as HTMLElement).style.maxWidth = '95%';
      }

      // Style the description
      const description = document.querySelector('main p');
      if (description) {
        (description as HTMLElement).style.fontSize = '1.2rem';
        (description as HTMLElement).style.lineHeight = '1.5';
        (description as HTMLElement).style.marginBottom = '2rem';
        (description as HTMLElement).style.opacity = '0.8';
        (description as HTMLElement).style.maxWidth = '80%';
        (description as HTMLElement).style.textAlign = 'center';
      }

      // Hide search and filter elements
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) {
        const searchContainer = searchInput.closest('div[class*="search"], div[class*="input"]');
        if (searchContainer) {
          (searchContainer as HTMLElement).style.display = 'none';
        }
      }

      // Hide stats/counts section for cleaner look
      const statsSection = document.querySelector(
        '[class*="grid"]:has([class*="Expert"], [class*="MCP"], [class*="Agent"])'
      );
      if (statsSection) {
        (statsSection as HTMLElement).style.display = 'none';
      }

      // Ensure proper background
      document.body.style.background = '#0a0a0a';
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';

      // Add a subtle gradient overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.background =
        'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(0,0,0,0.8) 100%)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '-1';
      document.body.appendChild(overlay);
    });

    // Wait for layout changes
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Take screenshot
    console.log('📷 Taking screenshot...');
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      encoding: 'binary',
      fullPage: false,
    });

    // Save to public directory
    const outputPath = path.join(process.cwd(), 'public', 'og-screenshot.png');
    await fs.writeFile(outputPath, screenshotBuffer);

    console.log('✅ Screenshot saved to:', outputPath);
    console.log('🎨 You can now use this as your OG image!');

    // Also generate a Twitter-optimized version
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
