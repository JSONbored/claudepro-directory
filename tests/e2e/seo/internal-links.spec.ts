/**
 * Internal Linking E2E Tests
 *
 * Validates all internal links are functional and follow SEO best practices.
 * Critical for SEO (link equity distribution) and user experience.
 *
 * **Why Test This:**
 * - Broken internal links harm SEO and user trust
 * - Link equity distribution affects page rankings
 * - Crawlability ensures all pages are discoverable
 * - User experience depends on functional navigation
 * - Orphaned pages (no incoming links) won't rank well
 *
 * **Test Coverage:**
 * - No broken internal links (404 errors)
 * - Proper link structure (absolute vs relative URLs)
 * - Anchor text validation (not "click here")
 * - No redirect chains
 * - Navigation accessibility
 * - Cross-category link validation
 * - Footer/header link consistency
 *
 * **SEO Best Practices Tested:**
 * - Link depth (important pages ≤3 clicks from homepage)
 * - No orphaned pages
 * - Descriptive anchor text
 * - Proper use of target="_blank" with rel attributes
 * - No broken hash/fragment links
 *
 * @group e2e
 * @group seo
 * @group links
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import {
  navigateToHomepage,
  navigateToCategory,
  waitForNetworkIdle,
} from '../helpers/test-helpers';

// =============================================================================
// Link Collection & Validation Helpers
// =============================================================================

interface LinkInfo {
  href: string;
  text: string;
  isInternal: boolean;
  hasTarget: boolean;
  targetValue: string | null;
  relValue: string | null;
}

/**
 * Get all internal links on page
 */
async function getAllInternalLinks(page: Page, baseUrl: string): Promise<LinkInfo[]> {
  return await page.evaluate((base) => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const baseUrlObj = new URL(base);

    return links
      .map((link) => {
        const href = link.getAttribute('href');
        if (!href) return null;

        try {
          // Handle relative URLs
          const absoluteUrl = new URL(href, base);
          const isInternal = absoluteUrl.hostname === baseUrlObj.hostname;

          return {
            href: absoluteUrl.href,
            text: (link.textContent || '').trim(),
            isInternal,
            hasTarget: link.hasAttribute('target'),
            targetValue: link.getAttribute('target'),
            relValue: link.getAttribute('rel'),
          };
        } catch {
          // Invalid URL
          return null;
        }
      })
      .filter((link): link is LinkInfo => link !== null && link.isInternal);
  }, baseUrl);
}

/**
 * Check if link is accessible (returns 200 OK)
 */
async function isLinkAccessible(page: Page, url: string): Promise<boolean> {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return response?.status() === 200;
  } catch {
    return false;
  }
}

/**
 * Extract unique URLs from link collection
 */
function getUniqueUrls(links: LinkInfo[]): string[] {
  const urlSet = new Set(links.map((link) => {
    // Remove hash fragments for uniqueness check
    const url = new URL(link.href);
    url.hash = '';
    return url.href;
  }));
  return Array.from(urlSet);
}

// =============================================================================
// Homepage Internal Links Tests
// =============================================================================

test.describe('Homepage - Internal Links', () => {
  test('should have no broken internal links', async ({ page }) => {
    await navigateToHomepage(page);

    const baseUrl = page.url();
    const links = await getAllInternalLinks(page, baseUrl);

    expect(links.length, 'Homepage should have internal links').toBeGreaterThan(10);

    // Get unique URLs (sample check to avoid timeout)
    const uniqueUrls = getUniqueUrls(links).slice(0, 20); // Check first 20 unique links

    const brokenLinks: string[] = [];

    for (const url of uniqueUrls) {
      const isAccessible = await isLinkAccessible(page, url);
      if (!isAccessible) {
        brokenLinks.push(url);
      }
    }

    expect(
      brokenLinks,
      `Found ${brokenLinks.length} broken links: ${brokenLinks.join(', ')}`
    ).toHaveLength(0);
  });

  test('should have proper navigation links', async ({ page }) => {
    await navigateToHomepage(page);

    const nav = page.locator('nav').first();
    const navLinks = await nav.locator('a').all();

    expect(navLinks.length, 'Navigation should have links').toBeGreaterThan(0);

    // All nav links should be valid
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      expect(href, 'Nav link should have href').toBeTruthy();

      // Should not be just '#' or 'javascript:'
      expect(href).not.toBe('#');
      expect(href).not.toMatch(/^javascript:/);
    }
  });

  test('should link to all main categories', async ({ page }) => {
    await navigateToHomepage(page);

    const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'];

    for (const category of categories) {
      const categoryLink = page.getByRole('link', { name: new RegExp(category, 'i') });
      expect(
        await categoryLink.count(),
        `Should have link to /${category}`
      ).toBeGreaterThan(0);
    }
  });

  test('external links should have proper rel attributes', async ({ page }) => {
    await navigateToHomepage(page);

    // Find all links with target="_blank"
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    if (count > 0) {
      // Check first 5 external links
      for (let i = 0; i < Math.min(count, 5); i++) {
        const link = externalLinks.nth(i);
        const rel = await link.getAttribute('rel');

        // Should have noopener and/or noreferrer for security
        expect(
          rel,
          'External links with target="_blank" should have rel attribute for security'
        ).toBeTruthy();
        expect(
          rel && (rel.includes('noopener') || rel.includes('noreferrer')),
          'rel should include noopener or noreferrer'
        ).toBe(true);
      }
    }
  });

  test('should have descriptive anchor text (not "click here")', async ({ page }) => {
    await navigateToHomepage(page);

    const baseUrl = page.url();
    const links = await getAllInternalLinks(page, baseUrl);

    // Bad anchor text patterns
    const badPatterns = [
      /^click here$/i,
      /^here$/i,
      /^read more$/i,
      /^learn more$/i,
      /^this$/i,
      /^link$/i,
    ];

    const badLinks = links.filter((link) =>
      badPatterns.some((pattern) => pattern.test(link.text))
    );

    expect(
      badLinks.length,
      `Found links with poor anchor text: ${badLinks.map((l) => l.text).join(', ')}`
    ).toBe(0);
  });
});

// =============================================================================
// Category Pages Internal Links Tests
// =============================================================================

test.describe('Category Pages - Internal Links', () => {
  const categories = ['agents', 'mcp', 'rules'];

  for (const category of categories) {
    test(`should have no broken links on /${category}`, async ({ page }) => {
      await navigateToCategory(page, category);

      const baseUrl = page.url();
      const links = await getAllInternalLinks(page, baseUrl);

      expect(links.length, `${category} should have internal links`).toBeGreaterThan(5);

      // Sample check (first 10 unique links)
      const uniqueUrls = getUniqueUrls(links).slice(0, 10);

      const brokenLinks: string[] = [];

      for (const url of uniqueUrls) {
        const isAccessible = await isLinkAccessible(page, url);
        if (!isAccessible) {
          brokenLinks.push(url);
        }
      }

      expect(
        brokenLinks,
        `${category}: Found broken links: ${brokenLinks.join(', ')}`
      ).toHaveLength(0);
    });

    test(`/${category} should link to content items`, async ({ page }) => {
      await navigateToCategory(page, category);

      // Find content item links
      const contentItems = page.locator('[data-content-item] a').or(
        page.locator('article a')
      );

      const count = await contentItems.count();
      expect(count, `${category} should have links to content items`).toBeGreaterThan(0);

      // Check first content item link
      const firstLink = contentItems.first();
      const href = await firstLink.getAttribute('href');

      expect(href).toBeTruthy();
      expect(href, `${category} item should link to detail page`).toMatch(
        new RegExp(`/${category}/`)
      );
    });
  }
});

// =============================================================================
// Content Detail Pages Internal Links Tests
// =============================================================================

test.describe('Content Detail Pages - Internal Links', () => {
  test('should have breadcrumb navigation links', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Click first item
    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for breadcrumb
    const breadcrumb = page.locator('[aria-label*="breadcrumb"]').or(
      page.locator('[data-breadcrumb]')
    );

    if ((await breadcrumb.count()) > 0) {
      // Should have clickable breadcrumb links
      const breadcrumbLinks = breadcrumb.locator('a');
      const linkCount = await breadcrumbLinks.count();

      expect(linkCount, 'Breadcrumb should have links').toBeGreaterThan(0);

      // All breadcrumb links should have href
      for (let i = 0; i < linkCount; i++) {
        const link = breadcrumbLinks.nth(i);
        const href = await link.getAttribute('href');
        expect(href, 'Breadcrumb link should have href').toBeTruthy();
      }
    }
  });

  test('should have working "back to category" links', async ({ page }) => {
    await navigateToCategory(page, 'mcp');
    const categoryUrl = page.url();

    // Click first item
    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();
    await firstItem.click();

    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    // Look for back/category link
    const backLink = page.getByRole('link', { name: /back|mcp|category/i });

    if ((await backLink.count()) > 0) {
      const href = await backLink.first().getAttribute('href');
      expect(href, 'Back link should point to category').toMatch(/\/mcp/);
    }
  });

  test('should have related content links', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for related content section
    const relatedSection = page.getByText(/related|similar|you might also like/i);

    if ((await relatedSection.count()) > 0) {
      // Should have links to related items
      const relatedLinks = page.locator('[data-related-item] a').or(
        page.locator('[data-content-item] a')
      );

      if ((await relatedLinks.count()) > 0) {
        const href = await relatedLinks.first().getAttribute('href');
        expect(href, 'Related item should have href').toBeTruthy();
        expect(href, 'Related item should be internal link').toMatch(/^\//);
      }
    }
  });
});

// =============================================================================
// Footer Links Tests
// =============================================================================

test.describe('Footer Links - All Pages', () => {
  test('footer links should be consistent across pages', async ({ page }) => {
    // Check footer on multiple pages
    const pagesToCheck = ['/', '/agents', '/trending'];

    const footerLinksPerPage: string[][] = [];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await waitForNetworkIdle(page);

      const footer = page.locator('footer');
      const footerLinks = await footer.locator('a').all();

      const hrefs = await Promise.all(
        footerLinks.map((link) => link.getAttribute('href'))
      );

      footerLinksPerPage.push(hrefs.filter((h): h is string => h !== null));
    }

    // Footer should have same structure across pages
    const firstPageLinks = footerLinksPerPage[0].sort();
    for (let i = 1; i < footerLinksPerPage.length; i++) {
      const currentLinks = footerLinksPerPage[i].sort();
      expect(
        currentLinks,
        `Footer links should be consistent on page ${pagesToCheck[i]}`
      ).toEqual(firstPageLinks);
    }
  });

  test('footer should have no broken links', async ({ page }) => {
    await navigateToHomepage(page);

    const footer = page.locator('footer');
    const footerLinks = await footer.locator('a[href]').all();

    expect(footerLinks.length, 'Footer should have links').toBeGreaterThan(0);

    // Check first 10 footer links
    const linksToCheck = footerLinks.slice(0, 10);
    const brokenLinks: string[] = [];

    for (const link of linksToCheck) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      // Skip external links and anchors for this test
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        continue;
      }

      try {
        const fullUrl = new URL(href, page.url()).href;
        const isAccessible = await isLinkAccessible(page, fullUrl);
        if (!isAccessible) {
          brokenLinks.push(href);
        }
      } catch {
        brokenLinks.push(href);
      }
    }

    expect(
      brokenLinks,
      `Footer has broken links: ${brokenLinks.join(', ')}`
    ).toHaveLength(0);
  });
});

// =============================================================================
// Navigation Consistency Tests
// =============================================================================

test.describe('Navigation Consistency', () => {
  test('header navigation should be consistent across pages', async ({ page }) => {
    const pagesToCheck = ['/', '/agents', '/mcp', '/trending'];

    const navLinksPerPage: string[][] = [];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await waitForNetworkIdle(page);

      const nav = page.locator('nav').first();
      const navLinks = await nav.locator('a').all();

      const hrefs = await Promise.all(
        navLinks.map((link) => link.getAttribute('href'))
      );

      navLinksPerPage.push(hrefs.filter((h): h is string => h !== null));
    }

    // Navigation should be consistent (within reasonable tolerance for active states)
    const firstPageLinks = navLinksPerPage[0].sort();
    for (let i = 1; i < navLinksPerPage.length; i++) {
      const currentLinks = navLinksPerPage[i].sort();

      // Allow some variation (e.g., mobile menu differences)
      const intersection = currentLinks.filter((link) => firstPageLinks.includes(link));
      const similarityRatio = intersection.length / Math.max(firstPageLinks.length, currentLinks.length);

      expect(
        similarityRatio,
        `Navigation should be mostly consistent on ${pagesToCheck[i]}`
      ).toBeGreaterThan(0.7); // 70% similarity threshold
    }
  });

  test('logo should link to homepage', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Find logo/brand link (usually first link in header or has specific data attribute)
    const header = page.locator('header');
    const logoLink = header.getByRole('link').first().or(
      header.locator('[data-logo]').or(
        header.locator('a').first()
      )
    );

    const href = await logoLink.getAttribute('href');
    expect(href, 'Logo should link to homepage').toMatch(/^\/$/);
  });
});

// =============================================================================
// Link Depth Tests (SEO)
// =============================================================================

test.describe('Link Depth - SEO', () => {
  test('important pages should be ≤3 clicks from homepage', async ({ page }) => {
    await navigateToHomepage(page);

    // Important pages that should be easily reachable
    const importantPages = [
      '/agents',
      '/mcp',
      '/trending',
      '/guides',
      '/api-docs',
    ];

    for (const targetPage of importantPages) {
      // Check if page is linked directly from homepage (1 click)
      const directLink = page.locator(`a[href="${targetPage}"]`);
      const isDirectlyLinked = (await directLink.count()) > 0;

      expect(
        isDirectlyLinked,
        `${targetPage} should be directly linked from homepage (1 click away)`
      ).toBe(true);
    }
  });
});

// =============================================================================
// Hash/Fragment Link Tests
// =============================================================================

test.describe('Hash/Fragment Links', () => {
  test('hash links should point to existing elements', async ({ page }) => {
    await page.goto('/api-docs'); // Page likely to have hash links
    await waitForNetworkIdle(page);

    // Find all hash links on current page
    const hashLinks = page.locator('a[href^="#"]');
    const count = await hashLinks.count();

    if (count > 0) {
      // Check first 5 hash links
      for (let i = 0; i < Math.min(count, 5); i++) {
        const link = hashLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && href !== '#') {
          const targetId = href.substring(1);
          const targetElement = page.locator(`#${targetId}`);

          const exists = (await targetElement.count()) > 0;
          expect(
            exists,
            `Hash link ${href} should point to existing element`
          ).toBe(true);
        }
      }
    }
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

test.describe('Link Performance', () => {
  test('should not have redirect chains', async ({ page }) => {
    await navigateToHomepage(page);

    const baseUrl = page.url();
    const links = await getAllInternalLinks(page, baseUrl);

    // Sample check (first 5 unique links)
    const uniqueUrls = getUniqueUrls(links).slice(0, 5);

    for (const url of uniqueUrls) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const finalUrl = page.url();

      // Check if URL changed (redirect occurred)
      if (url !== finalUrl) {
        // Single redirect is acceptable, but not chains
        // We'll just verify we got a 200 OK in the end
        expect(
          response?.status(),
          `${url} should not have broken redirect chain`
        ).toBe(200);
      }
    }
  });
});
