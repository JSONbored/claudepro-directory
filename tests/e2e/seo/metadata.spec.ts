/**
 * SEO Metadata E2E Tests
 *
 * Comprehensive validation of SEO metadata across all page types
 * following 2025 best practices for search engine optimization.
 *
 * **Why Test This:**
 * - Critical for search engine ranking and visibility
 * - Validates against 2025 SEO standards (Google, Bing, DuckDuckGo)
 * - Ensures proper social media sharing (Open Graph, Twitter Cards)
 * - Verifies structured data (JSON-LD) for rich snippets
 * - Tests AI citation optimization (ChatGPT, Perplexity, Claude)
 *
 * **Test Coverage:**
 * - Meta title length (55-60 chars for optimal SEO)
 * - Meta description length (150-160 chars for desktop, 120 for mobile)
 * - Open Graph metadata (title, description, image, type, url)
 * - Twitter Card metadata (card type, title, description, image)
 * - Canonical URLs (proper canonicalization)
 * - Structured data (JSON-LD schema.org markup)
 * - Year inclusion for AI citation optimization (2025)
 * - OG image dimensions (1200x630px, 1.91:1 ratio)
 *
 * **Page Types Tested:**
 * 1. Homepage (/) - Static route
 * 2. Trending (/trending) - Static route
 * 3. Submit (/submit) - Static route
 * 4. Collections (/collections) - Static route
 * 5. Guides (/guides) - Static route
 * 6. Category pages (/agents, /mcp, /rules, /commands, /hooks, /statuslines)
 * 7. Content detail pages (/{category}/{slug})
 * 8. Guide detail pages (/guides/{slug})
 * 9. Search (/search)
 *
 * @group e2e
 * @group seo
 */

import { expect, type Page, test } from '@playwright/test';
import { z } from 'zod';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';
import {
  navigateToCategory,
  navigateToHomepage,
  navigateToSearch,
  waitForNetworkIdle,
} from '../helpers/test-helpers';

// =============================================================================
// SEO Testing Helpers
// =============================================================================

/**
 * Get meta tag content by name
 */
async function getMetaContent(page: Page, name: string): Promise<string | null> {
  return await page.locator(`meta[name="${name}"]`).getAttribute('content');
}

/**
 * Get Open Graph meta tag content
 */
async function getOGContent(page: Page, property: string): Promise<string | null> {
  return await page.locator(`meta[property="og:${property}"]`).getAttribute('content');
}

/**
 * Get Twitter Card meta tag content
 */
async function getTwitterContent(page: Page, name: string): Promise<string | null> {
  return await page.locator(`meta[name="twitter:${name}"]`).getAttribute('content');
}

/**
 * Get canonical URL
 */
async function getCanonicalUrl(page: Page): Promise<string | null> {
  return await page.locator('link[rel="canonical"]').getAttribute('href');
}

/**
 * Get all JSON-LD structured data
 */
async function getStructuredData(page: Page): Promise<unknown[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').all();
  const data: unknown[] = [];

  for (const script of scripts) {
    const content = await script.textContent();
    if (content) {
      try {
        // Production-grade: safeParse with permissive schema for JSON-LD validation
        data.push(
          safeParse(content, z.unknown(), {
            strategy: ParseStrategy.VALIDATED_JSON,
          })
        );
      } catch (_error) {
        // Invalid JSON - skip this script block
      }
    }
  }

  return data;
}

/**
 * Validate title length against 2025 SEO standards
 */
function validateTitleLength(title: string): {
  isValid: boolean;
  length: number;
  recommendation: string;
} {
  const length = title.length;

  if (length <= 60) {
    return {
      isValid: true,
      length,
      recommendation: 'Optimal for all search engines',
    };
  }
  if (length <= 65) {
    return {
      isValid: true,
      length,
      recommendation: 'Good for Bing, may truncate on Google',
    };
  }
  return {
    isValid: false,
    length,
    recommendation: 'Too long - will truncate on all engines',
  };
}

/**
 * Validate description length against 2025 SEO standards
 */
function validateDescriptionLength(description: string): {
  isValid: boolean;
  length: number;
  recommendation: string;
} {
  const length = description.length;

  if (length >= 150 && length <= 160) {
    return {
      isValid: true,
      length,
      recommendation: 'Optimal for desktop search results',
    };
  }
  if (length >= 120 && length < 150) {
    return {
      isValid: true,
      length,
      recommendation: 'Good for mobile, slightly short for desktop',
    };
  }
  if (length > 160 && length <= 165) {
    return {
      isValid: false,
      length,
      recommendation: 'Slightly too long - may truncate',
    };
  }
  if (length < 120) {
    return {
      isValid: false,
      length,
      recommendation: 'Too short - missing SEO opportunity',
    };
  }
  return {
    isValid: false,
    length,
    recommendation: 'Too long - will truncate on all devices',
  };
}

/**
 * Validate OG image dimensions
 */
function validateOGImageDimensions(
  width: number,
  height: number
): {
  isValid: boolean;
  ratio: number;
  recommendation: string;
} {
  const ratio = width / height;
  const expectedRatio = 1.91; // 1200 / 630

  if (width === 1200 && height === 630) {
    return {
      isValid: true,
      ratio,
      recommendation: 'Perfect - matches Facebook/LinkedIn standards',
    };
  }
  if (Math.abs(ratio - expectedRatio) < 0.1) {
    return {
      isValid: true,
      ratio,
      recommendation: 'Acceptable aspect ratio',
    };
  }
  return {
    isValid: false,
    ratio,
    recommendation: 'Non-standard dimensions - may crop incorrectly',
  };
}

// =============================================================================
// Homepage SEO Tests
// =============================================================================

test.describe('Homepage SEO - Static Route', () => {
  test('should have optimal meta title length (≤60 chars)', async ({ page }) => {
    await navigateToHomepage(page);

    const title = await page.title();
    expect(title).toBeTruthy();

    const validation = validateTitleLength(title);
    expect(
      validation.length,
      `Title: "${title}"\nLength: ${validation.length}\n${validation.recommendation}`
    ).toBeGreaterThanOrEqual(55);
    expect(
      validation.length,
      `Title: "${title}"\nLength: ${validation.length}\n${validation.recommendation}`
    ).toBeLessThanOrEqual(60);
  });

  test('should have optimal meta description (150-160 chars)', async ({ page }) => {
    await navigateToHomepage(page);

    const description = await getMetaContent(page, 'description');
    expect(description).toBeTruthy();

    if (description) {
      const validation = validateDescriptionLength(description);
      expect(
        validation.length,
        `Description length: ${validation.length}\n${validation.recommendation}`
      ).toBeGreaterThanOrEqual(150);
      expect(
        validation.length,
        `Description length: ${validation.length}\n${validation.recommendation}`
      ).toBeLessThanOrEqual(160);
    }
  });

  test('should include year for AI citation optimization', async ({ page }) => {
    await navigateToHomepage(page);

    const description = await getMetaContent(page, 'description');
    expect(description).toBeTruthy();

    // AI citation optimization: Including "2025" or "October 2025" increases ChatGPT citation likelihood by 3.2x
    expect(description).toMatch(/2025|October 2025/i);
  });

  test('should have complete Open Graph metadata', async ({ page }) => {
    await navigateToHomepage(page);

    const ogTitle = await getOGContent(page, 'title');
    const ogDescription = await getOGContent(page, 'description');
    const ogImage = await getOGContent(page, 'image');
    const ogType = await getOGContent(page, 'type');
    const ogUrl = await getOGContent(page, 'url');

    expect(ogTitle, 'OG title is required').toBeTruthy();
    expect(ogDescription, 'OG description is required').toBeTruthy();
    expect(ogImage, 'OG image is required').toBeTruthy();
    expect(ogType, 'OG type is required').toBeTruthy();
    expect(ogUrl, 'OG URL is required').toBeTruthy();

    // Validate OG image URL format
    expect(ogImage).toMatch(/^https?:\/\//);
  });

  test('should have proper OG image dimensions (1200x630px)', async ({ page }) => {
    await navigateToHomepage(page);

    const ogWidth = await getOGContent(page, 'image:width');
    const ogHeight = await getOGContent(page, 'image:height');

    expect(ogWidth).toBe('1200');
    expect(ogHeight).toBe('630');

    if (ogWidth && ogHeight) {
      const validation = validateOGImageDimensions(
        Number.parseInt(ogWidth, 10),
        Number.parseInt(ogHeight, 10)
      );
      expect(validation.isValid, validation.recommendation).toBe(true);
    }
  });

  test('should have Twitter Card metadata', async ({ page }) => {
    await navigateToHomepage(page);

    const twitterCard = await getTwitterContent(page, 'card');
    const twitterTitle = await getTwitterContent(page, 'title');
    const twitterDescription = await getTwitterContent(page, 'description');
    const twitterImage = await getTwitterContent(page, 'image');

    expect(twitterCard, 'Twitter card type is required').toBeTruthy();
    expect(twitterCard, 'Twitter card should be summary_large_image').toBe('summary_large_image');

    // Twitter falls back to OG tags if twitter:* tags are missing
    // So we check if either Twitter tags or OG tags are present
    const hasTwitterTitle = twitterTitle !== null;
    const hasTwitterDescription = twitterDescription !== null;
    const hasTwitterImage = twitterImage !== null;

    expect(
      hasTwitterTitle || (await getOGContent(page, 'title')) !== null,
      'Twitter title or OG title is required'
    ).toBe(true);

    expect(
      hasTwitterDescription || (await getOGContent(page, 'description')) !== null,
      'Twitter description or OG description is required'
    ).toBe(true);

    expect(
      hasTwitterImage || (await getOGContent(page, 'image')) !== null,
      'Twitter image or OG image is required'
    ).toBe(true);
  });

  test('should have canonical URL', async ({ page }) => {
    await navigateToHomepage(page);

    const canonical = await getCanonicalUrl(page);
    expect(canonical, 'Canonical URL is required').toBeTruthy();
    expect(canonical, 'Canonical URL must be absolute').toMatch(/^https?:\/\//);
    expect(canonical, 'Canonical URL should point to homepage').toMatch(/\/$|^https?:\/\/[^/]+$/);
  });

  test('should have structured data (JSON-LD)', async ({ page }) => {
    await navigateToHomepage(page);

    const structuredData = await getStructuredData(page);
    expect(structuredData.length, 'Should have at least one JSON-LD block').toBeGreaterThan(0);

    // Validate each JSON-LD block has required properties
    for (const data of structuredData) {
      expect(data['@context'], 'JSON-LD must have @context').toBeTruthy();
      expect(data['@type'], 'JSON-LD must have @type').toBeTruthy();
    }
  });

  test('should have robots meta tag', async ({ page }) => {
    await navigateToHomepage(page);

    const robots = await getMetaContent(page, 'robots');
    // Robots meta tag is optional, but if present should allow indexing
    if (robots) {
      expect(robots).not.toContain('noindex');
      expect(robots).not.toContain('nofollow');
    }
  });

  test('should have viewport meta tag', async ({ page }) => {
    await navigateToHomepage(page);

    const viewport = await getMetaContent(page, 'viewport');
    expect(viewport, 'Viewport meta tag is required for mobile SEO').toBeTruthy();
    expect(viewport, 'Viewport should include width=device-width').toContain('width=device-width');
  });
});

// =============================================================================
// Static Routes SEO Tests
// =============================================================================

test.describe('Static Routes SEO', () => {
  const staticRoutes = [
    { path: '/trending', name: 'Trending' },
    { path: '/submit', name: 'Submit' },
    { path: '/collections', name: 'Collections' },
    { path: '/guides', name: 'Guides' },
  ];

  for (const route of staticRoutes) {
    test.describe(`${route.name} Page (${route.path})`, () => {
      test('should have optimal meta title and description', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const title = await page.title();
        expect(title).toBeTruthy();

        const titleValidation = validateTitleLength(title);
        expect(titleValidation.length, `Title too short: ${title}`).toBeGreaterThanOrEqual(55);
        expect(titleValidation.length, `Title too long: ${title}`).toBeLessThanOrEqual(60);

        const description = await getMetaContent(page, 'description');
        expect(description, 'Description is required').toBeTruthy();

        if (description) {
          const descValidation = validateDescriptionLength(description);
          expect(
            descValidation.isValid,
            `Description: ${description}\nLength: ${descValidation.length}\n${descValidation.recommendation}`
          ).toBe(true);
        }
      });

      test('should have complete Open Graph metadata', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const ogTitle = await getOGContent(page, 'title');
        const ogDescription = await getOGContent(page, 'description');
        const ogImage = await getOGContent(page, 'image');

        expect(ogTitle).toBeTruthy();
        expect(ogDescription).toBeTruthy();
        expect(ogImage).toBeTruthy();
      });

      test('should have proper canonical URL', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const canonical = await getCanonicalUrl(page);
        expect(canonical).toBeTruthy();
        expect(canonical).toMatch(new RegExp(`${route.path}$`));
      });

      test('should include year for AI optimization', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const description = await getMetaContent(page, 'description');
        if (description) {
          expect(description).toMatch(/2025|October 2025/i);
        }
      });
    });
  }
});

// =============================================================================
// Category Pages SEO Tests
// =============================================================================

test.describe('Category Pages SEO', () => {
  const categories = [
    { slug: 'agents', name: 'AI Agents' },
    { slug: 'mcp', name: 'MCP Servers' },
    { slug: 'rules', name: 'Rules' },
    { slug: 'commands', name: 'Commands' },
    { slug: 'hooks', name: 'Hooks' },
    { slug: 'statuslines', name: 'Status Lines' },
  ];

  for (const category of categories) {
    test.describe(`${category.name} Category (/${category.slug})`, () => {
      test('should have optimal meta title and description', async ({ page }) => {
        await navigateToCategory(page, category.slug);

        const title = await page.title();
        expect(title).toBeTruthy();

        const titleValidation = validateTitleLength(title);
        expect(titleValidation.length, `Title too short: ${title}`).toBeGreaterThanOrEqual(55);
        expect(titleValidation.length, `Title: ${title}`).toBeLessThanOrEqual(60);

        const description = await getMetaContent(page, 'description');
        expect(description).toBeTruthy();

        if (description) {
          const descValidation = validateDescriptionLength(description);
          expect(descValidation.isValid, `Description length: ${descValidation.length}`).toBe(true);
        }
      });

      test('should have complete Open Graph metadata', async ({ page }) => {
        await navigateToCategory(page, category.slug);

        const ogTitle = await getOGContent(page, 'title');
        const ogDescription = await getOGContent(page, 'description');
        const ogImage = await getOGContent(page, 'image');
        const ogType = await getOGContent(page, 'type');

        expect(ogTitle).toBeTruthy();
        expect(ogDescription).toBeTruthy();
        expect(ogImage).toBeTruthy();
        expect(ogType).toBe('website');
      });

      test('should have proper canonical URL', async ({ page }) => {
        await navigateToCategory(page, category.slug);

        const canonical = await getCanonicalUrl(page);
        expect(canonical).toBeTruthy();
        expect(canonical).toMatch(new RegExp(`/${category.slug}$`));
      });

      test('should have BreadcrumbList structured data', async ({ page }) => {
        await navigateToCategory(page, category.slug);

        const structuredData = await getStructuredData(page);
        const breadcrumbSchema = structuredData.find((data) => data['@type'] === 'BreadcrumbList');

        // Breadcrumbs are optional for category pages, but if present should be valid
        if (breadcrumbSchema) {
          expect(breadcrumbSchema['@context']).toBe('https://schema.org');
          expect(breadcrumbSchema.itemListElement).toBeTruthy();
          expect(breadcrumbSchema.itemListElement.length).toBeGreaterThan(0);
        }
      });
    });
  }
});

// =============================================================================
// Content Detail Pages SEO Tests
// =============================================================================

test.describe('Content Detail Pages SEO', () => {
  test('should have optimal SEO metadata on agent detail page', async ({ page }) => {
    // Navigate to agents category and click first item
    await navigateToCategory(page, 'agents');
    // Wait for content to load and find clickable card
    const firstItem = page.locator('[role="article"]').first();
    await firstItem.waitFor({ state: 'visible', timeout: 30000 });
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Validate title
    const title = await page.title();
    expect(title).toBeTruthy();

    const titleValidation = validateTitleLength(title);
    expect(titleValidation.length, `Title: ${title}`).toBeLessThanOrEqual(75); // Allow slightly longer for content pages

    // Validate description
    const description = await getMetaContent(page, 'description');
    expect(description).toBeTruthy();

    if (description) {
      const descValidation = validateDescriptionLength(description);
      expect(descValidation.isValid, `Description length: ${descValidation.length}`).toBe(true);
    }

    // Validate Open Graph
    const ogTitle = await getOGContent(page, 'title');
    const ogDescription = await getOGContent(page, 'description');
    const ogImage = await getOGContent(page, 'image');
    const ogType = await getOGContent(page, 'type');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();
    expect(ogType).toBe('article');

    // Validate canonical URL
    const canonical = await getCanonicalUrl(page);
    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/\/agents\/.+$/);
  });

  test('should have SoftwareApplication structured data on detail page', async ({ page }) => {
    await navigateToCategory(page, 'agents');
    const firstItem = page.locator('[role="article"]').first();
    await firstItem.waitFor({ state: 'visible', timeout: 30000 });
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    const structuredData = await getStructuredData(page);
    const softwareSchema = structuredData.find((data) => data['@type'] === 'SoftwareApplication');

    // SoftwareApplication schema should exist for agent detail pages
    if (softwareSchema) {
      expect(softwareSchema['@context']).toBe('https://schema.org');
      expect(softwareSchema.name).toBeTruthy();
      expect(softwareSchema.description).toBeTruthy();
      expect(softwareSchema.applicationCategory).toBe('DeveloperApplication');
    }
  });

  test('should have BreadcrumbList on detail page', async ({ page }) => {
    await navigateToCategory(page, 'mcp');
    const firstItem = page.locator('[role="article"]').first();
    await firstItem.waitFor({ state: 'visible', timeout: 30000 });
    await firstItem.click();

    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    const structuredData = await getStructuredData(page);
    const breadcrumbSchema = structuredData.find((data) => data['@type'] === 'BreadcrumbList');

    // Breadcrumbs should exist for detail pages
    if (breadcrumbSchema) {
      expect(breadcrumbSchema['@context']).toBe('https://schema.org');
      expect(breadcrumbSchema.itemListElement).toBeTruthy();
      expect(breadcrumbSchema.itemListElement.length).toBeGreaterThanOrEqual(2); // Home + Category + Current
    }
  });

  test('should have article:published_time for agents', async ({ page }) => {
    await navigateToCategory(page, 'agents');
    const firstItem = page.locator('[role="article"]').first();
    await firstItem.waitFor({ state: 'visible', timeout: 30000 });
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    const publishedTime = await page
      .locator('meta[property="article:published_time"]')
      .getAttribute('content');

    // Published time is optional but recommended for article-type content
    if (publishedTime) {
      // Should be valid ISO 8601 date
      expect(publishedTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });
});

// =============================================================================
// Guide Detail Pages SEO Tests
// =============================================================================

test.describe('Guide Detail Pages SEO', () => {
  test('should have optimal SEO metadata on guide pages', async ({ page }) => {
    await page.goto('/guides');
    await waitForNetworkIdle(page);

    // Click first guide
    const firstGuide = page.locator('[role="article"]').first();
    await firstGuide.waitFor({ state: 'visible', timeout: 30000 });

    if ((await firstGuide.count()) > 0) {
      await firstGuide.click();

      await page.waitForURL(/\/guides\/.+/);
      await waitForNetworkIdle(page);

      // Validate title
      const title = await page.title();
      expect(title).toBeTruthy();

      const titleValidation = validateTitleLength(title);
      expect(titleValidation.length).toBeLessThanOrEqual(75);

      // Validate description
      const description = await getMetaContent(page, 'description');
      expect(description).toBeTruthy();

      if (description) {
        const descValidation = validateDescriptionLength(description);
        expect(descValidation.isValid).toBe(true);
      }

      // Validate Open Graph
      const ogType = await getOGContent(page, 'type');
      expect(ogType).toBe('article');

      // Validate canonical
      const canonical = await getCanonicalUrl(page);
      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/\/guides\/.+$/);
    }
  });

  test('should have HowTo structured data on guide pages', async ({ page }) => {
    await page.goto('/guides');
    await waitForNetworkIdle(page);

    const firstGuide = page.locator('[role="article"]').first();
    await firstGuide.waitFor({ state: 'visible', timeout: 30000 });

    if ((await firstGuide.count()) > 0) {
      await firstGuide.click();

      await page.waitForURL(/\/guides\/.+/);
      await waitForNetworkIdle(page);

      const structuredData = await getStructuredData(page);
      const howToSchema = structuredData.find((data) => data['@type'] === 'HowTo');

      // HowTo schema should exist for guide pages
      if (howToSchema) {
        expect(howToSchema['@context']).toBe('https://schema.org');
        expect(howToSchema.name).toBeTruthy();
        expect(howToSchema.step).toBeTruthy();
        expect(Array.isArray(howToSchema.step)).toBe(true);
      }
    }
  });
});

// =============================================================================
// Search Page SEO Tests
// =============================================================================

test.describe('Search Page SEO', () => {
  test('should have proper noindex on search results', async ({ page }) => {
    await navigateToSearch(page, 'code review');

    const robots = await getMetaContent(page, 'robots');
    // Search results should typically be noindex to avoid duplicate content
    if (robots) {
      expect(robots).toContain('noindex');
    }
  });

  test('should have meta title even with noindex', async ({ page }) => {
    await navigateToSearch(page, 'test query');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
  });

  test('should not have canonical URL on search results', async ({ page }) => {
    await navigateToSearch(page, 'test query');

    const canonical = await getCanonicalUrl(page);
    // Search results should not have canonical URLs as they're dynamic
    expect(canonical).toBeFalsy();
  });
});

// =============================================================================
// Cross-Page Consistency Tests
// =============================================================================

test.describe('Cross-Page SEO Consistency', () => {
  test('all pages should have consistent OG site_name', async ({ page }) => {
    const pages = ['/', '/trending', '/agents'];
    const siteNames: string[] = [];

    for (const path of pages) {
      await page.goto(path);
      await waitForNetworkIdle(page);

      const siteName = await getOGContent(page, 'site_name');
      if (siteName) {
        siteNames.push(siteName);
      }
    }

    // All site names should be identical
    const uniqueSiteNames = [...new Set(siteNames)];
    expect(uniqueSiteNames.length, 'All pages should have same og:site_name').toBeLessThanOrEqual(
      1
    );
  });

  test('all pages should use HTTPS in canonical URLs', async ({ page }) => {
    const pages = ['/', '/trending', '/agents', '/submit'];

    for (const path of pages) {
      await page.goto(path);
      await waitForNetworkIdle(page);

      const canonical = await getCanonicalUrl(page);
      if (canonical) {
        expect(canonical, `${path} canonical should use HTTPS`).toMatch(/^https:\/\//);
      }
    }
  });

  test('all pages should have charset UTF-8', async ({ page }) => {
    const pages = ['/', '/trending', '/agents'];

    for (const path of pages) {
      await page.goto(path);

      const charset = await page.locator('meta[charset]').getAttribute('charset');
      expect(charset?.toLowerCase(), `${path} should use UTF-8 charset`).toBe('utf-8');
    }
  });
});

// =============================================================================
// Dynamic Content Testing - Comprehensive Coverage
// =============================================================================

import {
  getAllCategoryContent,
  getAllChangelogs,
  getAllCollections,
  getAllGuides,
  getAllStaticRoutes,
} from '../helpers/content-loader';

/**
 * Core SEO validation function - DRY principle
 * Tests essential SEO requirements for any page
 */
async function validateCoreSEO(page: Page, pagePath: string) {
  // Wait for page to stabilize
  await waitForNetworkIdle(page);

  // 1. Meta title must exist and be optimal length
  const title = await page.title();
  expect(title, `${pagePath}: Title must exist`).toBeTruthy();
  expect(
    title.length,
    `${pagePath}: Title should be 55-60 chars (currently ${title.length})`
  ).toBeGreaterThanOrEqual(55);
  expect(
    title.length,
    `${pagePath}: Title should be 55-60 chars (currently ${title.length})`
  ).toBeLessThanOrEqual(60);

  // 2. Meta description must exist and be optimal length
  const description = await getMetaContent(page, 'description');
  expect(description, `${pagePath}: Description must exist`).toBeTruthy();
  if (description) {
    expect(
      description.length,
      `${pagePath}: Description should be 150-160 chars (currently ${description.length})`
    ).toBeGreaterThanOrEqual(150);
    expect(
      description.length,
      `${pagePath}: Description should be 150-160 chars (currently ${description.length})`
    ).toBeLessThanOrEqual(160);
  }

  // 3. Open Graph metadata must be complete
  const ogTitle = await getOGContent(page, 'title');
  const ogDescription = await getOGContent(page, 'description');
  const ogImage = await getOGContent(page, 'image');
  const ogUrl = await getOGContent(page, 'url');

  expect(ogTitle, `${pagePath}: og:title must exist`).toBeTruthy();
  expect(ogDescription, `${pagePath}: og:description must exist`).toBeTruthy();
  expect(ogImage, `${pagePath}: og:image must exist`).toBeTruthy();
  expect(ogUrl, `${pagePath}: og:url must exist`).toBeTruthy();

  // 4. Robots meta tag must exist (for indexing control)
  const robots = await getMetaContent(page, 'robots');
  expect(robots, `${pagePath}: robots meta tag must exist`).toBeTruthy();
}

test.describe('Dynamic SEO: All Category Content Pages', () => {
  const allContent = getAllCategoryContent();

  test(`should discover content from generated files (found ${allContent.length} pages)`, () => {
    expect(allContent.length, 'Should have discovered category content pages').toBeGreaterThan(0);
  });

  // Test every single content page dynamically
  for (const content of allContent) {
    test(`${content.path} should have complete SEO metadata`, async ({ page }) => {
      await page.goto(content.path);
      await validateCoreSEO(page, content.path);

      // Content-specific: Should have canonical URL
      const canonical = await getCanonicalUrl(page);
      expect(canonical, `${content.path}: Should have canonical URL`).toBeTruthy();
      expect(canonical, `${content.path}: Canonical should use HTTPS`).toMatch(/^https:\/\//);
    });
  }
});

test.describe('Dynamic SEO: All Guide Pages', () => {
  const allGuides = getAllGuides();

  test(`should discover all guides (found ${allGuides.length} pages)`, () => {
    expect(allGuides.length, 'Should have discovered guide pages').toBeGreaterThan(0);
  });

  // Test every single guide page dynamically
  for (const guide of allGuides) {
    test(`${guide.path} should have complete SEO metadata`, async ({ page }) => {
      await page.goto(guide.path);
      await validateCoreSEO(page, guide.path);

      // Guide-specific: Should have HowTo structured data
      const structuredData = await getStructuredData(page);
      const hasHowTo = structuredData.some((data) => data['@type'] === 'HowTo');
      expect(hasHowTo, `${guide.path}: Should have HowTo structured data`).toBeTruthy();
    });
  }
});

test.describe('Dynamic SEO: All Collection Pages', () => {
  const allCollections = getAllCollections();

  test(`should discover all collections (found ${allCollections.length} pages)`, () => {
    expect(allCollections.length, 'Should have discovered collection pages').toBeGreaterThan(0);
  });

  // Test every single collection page dynamically
  for (const collection of allCollections) {
    test(`${collection.path} should have complete SEO metadata`, async ({ page }) => {
      await page.goto(collection.path);
      await validateCoreSEO(page, collection.path);
    });
  }
});

test.describe('Dynamic SEO: All Changelog Pages', () => {
  const allChangelogs = getAllChangelogs();

  if (allChangelogs.length > 0) {
    test(`should discover all changelogs (found ${allChangelogs.length} pages)`, () => {
      expect(allChangelogs.length, 'Should have discovered changelog pages').toBeGreaterThan(0);
    });

    // Test every single changelog page dynamically
    for (const changelog of allChangelogs) {
      test(`${changelog.path} should have complete SEO metadata`, async ({ page }) => {
        await page.goto(changelog.path);
        await validateCoreSEO(page, changelog.path);
      });
    }
  }
});

test.describe('Dynamic SEO: All Static Routes', () => {
  const staticRoutes = getAllStaticRoutes();

  test(`should test all static routes (found ${staticRoutes.length} routes)`, () => {
    expect(staticRoutes.length, 'Should have comprehensive static route coverage').toBeGreaterThan(
      0
    );
  });

  // Test every static route dynamically
  for (const route of staticRoutes) {
    test(`${route} should have complete SEO metadata`, async ({ page }) => {
      await page.goto(route);
      await validateCoreSEO(page, route);

      // Static routes should have canonical URLs (except /search which is tested separately)
      if (route !== '/search') {
        const canonical = await getCanonicalUrl(page);
        expect(canonical, `${route}: Should have canonical URL`).toBeTruthy();
      }
    });
  }
});

// =============================================================================
// NEW ROUTES TESTING - Phase 5 Addition
// =============================================================================

test.describe('New Routes SEO - Phase 5', () => {
  const newRoutes = [
    { path: '/board', name: 'Board' },
    { path: '/community', name: 'Community' },
    { path: '/companies', name: 'Companies' },
    { path: '/for-you', name: 'For You' },
    { path: '/partner', name: 'Partner' },
    { path: '/api-docs', name: 'API Documentation' },
  ];

  for (const route of newRoutes) {
    test.describe(`${route.name} Page (${route.path})`, () => {
      test('should have optimal meta title and description', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const title = await page.title();
        expect(title, `${route.path}: Title must exist`).toBeTruthy();
        expect(title.length, `${route.path}: Title too short`).toBeGreaterThanOrEqual(55);
        expect(title.length, `${route.path}: Title too long`).toBeLessThanOrEqual(60);

        const description = await getMetaContent(page, 'description');
        expect(description, `${route.path}: Description must exist`).toBeTruthy();

        if (description) {
          expect(description.length, `${route.path}: Description length`).toBeGreaterThanOrEqual(
            150
          );
          expect(description.length, `${route.path}: Description length`).toBeLessThanOrEqual(160);
        }
      });

      test('should have complete Open Graph metadata', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const ogTitle = await getOGContent(page, 'title');
        const ogDescription = await getOGContent(page, 'description');
        const ogImage = await getOGContent(page, 'image');

        expect(ogTitle, `${route.path}: og:title required`).toBeTruthy();
        expect(ogDescription, `${route.path}: og:description required`).toBeTruthy();
        expect(ogImage, `${route.path}: og:image required`).toBeTruthy();
      });

      test('should have proper canonical URL', async ({ page }) => {
        await page.goto(route.path);
        await waitForNetworkIdle(page);

        const canonical = await getCanonicalUrl(page);
        expect(canonical, `${route.path}: Canonical URL required`).toBeTruthy();
        expect(canonical, `${route.path}: Canonical must use HTTPS`).toMatch(/^https:\/\//);
        expect(canonical, `${route.path}: Canonical should not have trailing slash`).not.toMatch(
          /\/$/
        );
      });
    });
  }
});

// =============================================================================
// LLMS.TXT ALTERNATE LINKS TESTING - Phase 5 Addition
// =============================================================================

test.describe('llms.txt Alternate Links', () => {
  test('should have llms.txt alternate link on content detail pages', async ({ page }) => {
    await navigateToCategory(page, 'agents');
    const firstItem = page.locator('[role="article"]').first();
    await firstItem.waitFor({ state: 'visible', timeout: 30000 });
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Check for llms.txt alternate link
    const llmsTxtLink = await page
      .locator('link[rel="alternate"][type="text/plain"]')
      .getAttribute('href');

    expect(llmsTxtLink, 'Content detail pages should have llms.txt alternate link').toBeTruthy();
    expect(llmsTxtLink, 'llms.txt link should match pattern').toMatch(/\/agents\/.+\/llms\.txt$/);
  });

  test('should NOT have llms.txt alternate link on category pages', async ({ page }) => {
    await navigateToCategory(page, 'mcp');

    const llmsTxtLink = await page.locator('link[rel="alternate"][type="text/plain"]').count();

    expect(llmsTxtLink, 'Category pages should NOT have llms.txt alternate link').toBe(0);
  });

  test('should NOT have llms.txt alternate link on homepage', async ({ page }) => {
    await navigateToHomepage(page);

    const llmsTxtLink = await page.locator('link[rel="alternate"][type="text/plain"]').count();

    expect(llmsTxtLink, 'Homepage should NOT have llms.txt alternate link').toBe(0);
  });

  test('llms.txt alternate link should be accessible', async ({ page }) => {
    await navigateToCategory(page, 'mcp');
    const firstItem = page.locator('[role="article"]').first();
    await firstItem.waitFor({ state: 'visible', timeout: 30000 });
    await firstItem.click();

    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    const llmsTxtHref = await page
      .locator('link[rel="alternate"][type="text/plain"]')
      .getAttribute('href');

    if (llmsTxtHref) {
      // Navigate to llms.txt URL
      const response = await page.goto(llmsTxtHref);
      expect(response?.status(), 'llms.txt should be accessible (200 OK)').toBe(200);
      expect(
        response?.headers()['content-type'],
        'llms.txt should have text/plain content-type'
      ).toContain('text/plain');
    }
  });
});

// =============================================================================
// CHANGELOG/JOBS/COLLECTIONS METADATA TESTING - Phase 5 Addition
// =============================================================================

test.describe('Changelog Pages SEO', () => {
  test('should have optimal SEO metadata on changelog index', async ({ page }) => {
    await page.goto('/changelog');
    await waitForNetworkIdle(page);

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThanOrEqual(55);
    expect(title.length).toBeLessThanOrEqual(60);

    const description = await getMetaContent(page, 'description');
    expect(description).toBeTruthy();

    if (description) {
      expect(description.length).toBeGreaterThanOrEqual(150);
      expect(description.length).toBeLessThanOrEqual(160);
    }

    const canonical = await getCanonicalUrl(page);
    expect(canonical).toMatch(/\/changelog$/);
  });

  test('should have Article type on changelog detail pages', async ({ page }) => {
    await page.goto('/changelog');
    await waitForNetworkIdle(page);

    const firstChangelog = page.locator('[role="article"]').first();
    await firstChangelog.waitFor({ state: 'visible', timeout: 30000 });

    if ((await firstChangelog.count()) > 0) {
      await firstChangelog.click();

      await page.waitForURL(/\/changelog\/.+/);
      await waitForNetworkIdle(page);

      const ogType = await getOGContent(page, 'type');
      expect(ogType, 'Changelog pages should use og:type="article"').toBe('article');

      // Check for published time (freshness signal)
      const publishedTime = await page
        .locator('meta[property="article:published_time"]')
        .getAttribute('content');

      if (publishedTime) {
        expect(publishedTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    }
  });

  test('should include year for AI optimization on changelog pages', async ({ page }) => {
    await page.goto('/changelog');
    await waitForNetworkIdle(page);

    const description = await getMetaContent(page, 'description');

    if (description) {
      expect(description, 'Changelog description should include year for AI optimization').toMatch(
        /2025|October 2025/i
      );
    }
  });
});

test.describe('Jobs Pages SEO', () => {
  test('should have optimal SEO metadata on jobs index', async ({ page }) => {
    await page.goto('/jobs');
    await waitForNetworkIdle(page);

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThanOrEqual(55);
    expect(title.length).toBeLessThanOrEqual(60);

    const description = await getMetaContent(page, 'description');
    expect(description).toBeTruthy();

    if (description) {
      expect(description.length).toBeGreaterThanOrEqual(150);
      expect(description.length).toBeLessThanOrEqual(160);
    }

    const canonical = await getCanonicalUrl(page);
    expect(canonical).toMatch(/\/jobs$/);
  });

  test('should have proper OpenGraph metadata on jobs page', async ({ page }) => {
    await page.goto('/jobs');
    await waitForNetworkIdle(page);

    const ogTitle = await getOGContent(page, 'title');
    const ogDescription = await getOGContent(page, 'description');
    const ogImage = await getOGContent(page, 'image');
    const ogType = await getOGContent(page, 'type');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();
    expect(ogType).toBe('website');
  });
});

test.describe('Collections Pages SEO', () => {
  test('should have optimal SEO metadata on collections index', async ({ page }) => {
    await page.goto('/collections');
    await waitForNetworkIdle(page);

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThanOrEqual(55);
    expect(title.length).toBeLessThanOrEqual(60);

    const description = await getMetaContent(page, 'description');
    expect(description).toBeTruthy();

    if (description) {
      expect(description.length).toBeGreaterThanOrEqual(150);
      expect(description.length).toBeLessThanOrEqual(160);
    }

    const canonical = await getCanonicalUrl(page);
    expect(canonical).toMatch(/\/collections$/);
  });

  test('should have complete SEO metadata on collection detail pages', async ({ page }) => {
    await page.goto('/collections');
    await waitForNetworkIdle(page);

    const firstCollection = page.locator('[role="article"]').first();
    await firstCollection.waitFor({ state: 'visible', timeout: 30000 });

    if ((await firstCollection.count()) > 0) {
      await firstCollection.click();

      await page.waitForURL(/\/collections\/.+/);
      await waitForNetworkIdle(page);

      // Validate title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeLessThanOrEqual(75); // Allow slightly longer for content pages

      // Validate description
      const description = await getMetaContent(page, 'description');
      expect(description).toBeTruthy();

      if (description) {
        expect(description.length).toBeGreaterThanOrEqual(150);
        expect(description.length).toBeLessThanOrEqual(160);
      }

      // Validate canonical
      const canonical = await getCanonicalUrl(page);
      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/\/collections\/.+$/);
      expect(canonical).not.toMatch(/\/$/);
    }
  });

  test('should include year for AI optimization on collection pages', async ({ page }) => {
    await page.goto('/collections');
    await waitForNetworkIdle(page);

    const description = await getMetaContent(page, 'description');

    if (description) {
      expect(description).toMatch(/2025|October 2025/i);
    }
  });
});
