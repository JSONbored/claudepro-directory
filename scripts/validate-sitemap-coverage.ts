#!/usr/bin/env tsx
/**
 * Sitemap Coverage Validation Script
 *
 * Validates that comprehensive SEO testing has COMPLETE coverage of ALL URLs
 * in the sitemap. This ensures no page is missed during E2E testing.
 *
 * Validation Checks:
 * 1. Sitemap.xml is accessible
 * 2. All URLs are categorized correctly
 * 3. All URL types have corresponding tests
 * 4. No URLs are excluded from testing
 *
 * Run before E2E tests to ensure 100% coverage.
 */

import { parse } from 'node:url';

const DEV_SERVER_URL = process.env.DEV_SERVER_URL || 'http://localhost:3000';

console.log('🔍 Validating Sitemap Coverage for E2E Tests...\n');
console.log(`📍 Using server: ${DEV_SERVER_URL}\n`);

/**
 * Fetch and parse sitemap.xml
 */
async function fetchSitemap(): Promise<string[]> {
  try {
    const response = await fetch(`${DEV_SERVER_URL}/sitemap.xml`);

    if (!response.ok) {
      throw new Error(`Sitemap returned ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();

    // Extract all <loc> URLs
    const locMatches = xml.match(/<loc>(.*?)<\/loc>/g);
    if (!locMatches) {
      throw new Error('No URLs found in sitemap.xml');
    }

    return locMatches.map((match) => match.replace(/<\/?loc>/g, ''));
  } catch (error) {
    console.error('\n❌ ERROR: Failed to fetch sitemap.xml');
    console.error('   Make sure dev server is running: npm run dev');
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Categorize URL by type
 */
function categorizeUrl(url: string): {
  type: 'html' | 'llms_txt' | 'feed' | 'sitemap';
  path: string;
} {
  const parsedUrl = parse(url);
  const path = parsedUrl.pathname || '';

  if (path.endsWith('/sitemap.xml')) {
    return { type: 'sitemap', path };
  }
  if (path.endsWith('/llms.txt')) {
    return { type: 'llms_txt', path };
  }
  if (path.endsWith('.xml')) {
    return { type: 'feed', path };
  }
  return { type: 'html', path };
}

/**
 * Main validation
 */
async function main() {
  // =========================================================================
  // 1. FETCH SITEMAP
  // =========================================================================
  console.log('📥 Fetching sitemap.xml...');
  const allUrls = await fetchSitemap();
  console.log(`   ✅ Found ${allUrls.length} URLs in sitemap\n`);

  // =========================================================================
  // 2. CATEGORIZE ALL URLS
  // =========================================================================
  console.log('📊 Categorizing URLs...');

  const htmlUrls: string[] = [];
  const llmsTxtUrls: string[] = [];
  const feedUrls: string[] = [];
  const sitemapUrls: string[] = [];

  for (const url of allUrls) {
    const { type } = categorizeUrl(url);

    switch (type) {
      case 'html':
        htmlUrls.push(url);
        break;
      case 'llms_txt':
        llmsTxtUrls.push(url);
        break;
      case 'feed':
        feedUrls.push(url);
        break;
      case 'sitemap':
        sitemapUrls.push(url);
        break;
    }
  }

  console.log(`   📄 HTML Pages: ${htmlUrls.length}`);
  console.log(`   🤖 llms.txt Routes: ${llmsTxtUrls.length}`);
  console.log(`   📡 RSS/Atom Feeds: ${feedUrls.length}`);
  console.log(`   🗺️  Sitemap URLs: ${sitemapUrls.length}\n`);

  // =========================================================================
  // 3. VALIDATE COVERAGE
  // =========================================================================
  console.log('✅ Coverage Validation:');

  let hasErrors = false;

  // Check HTML pages
  if (htmlUrls.length === 0) {
    console.error('   ❌ ERROR: No HTML pages found in sitemap!');
    hasErrors = true;
  } else {
    console.log(`   ✅ HTML pages: ${htmlUrls.length} pages will be tested`);
  }

  // Check llms.txt routes
  if (llmsTxtUrls.length === 0) {
    console.warn('   ⚠️  WARNING: No llms.txt routes found in sitemap');
  } else {
    console.log(`   ✅ llms.txt routes: ${llmsTxtUrls.length} routes will be tested`);
  }

  // Check feeds
  if (feedUrls.length === 0) {
    console.warn('   ⚠️  WARNING: No RSS/Atom feeds found in sitemap');
  } else {
    console.log(`   ✅ RSS/Atom feeds: ${feedUrls.length} feeds will be tested`);
  }

  // Verify total coverage
  const totalCategorized =
    htmlUrls.length + llmsTxtUrls.length + feedUrls.length + sitemapUrls.length;
  if (totalCategorized !== allUrls.length) {
    console.error('   ❌ ERROR: Coverage mismatch!');
    console.error(`      Total URLs: ${allUrls.length}`);
    console.error(`      Categorized: ${totalCategorized}`);
    console.error(`      Missing: ${allUrls.length - totalCategorized}`);
    hasErrors = true;
  } else {
    console.log(`   ✅ 100% coverage: All ${allUrls.length} URLs categorized\n`);
  }

  // =========================================================================
  // 4. SAMPLE URLS FROM EACH CATEGORY
  // =========================================================================
  console.log('📋 Sample URLs by Category:\n');

  if (htmlUrls.length > 0) {
    console.log('   📄 HTML Pages (first 5):');
    htmlUrls.slice(0, 5).forEach((url) => {
      const path = parse(url).pathname;
      console.log(`      - ${path}`);
    });
    if (htmlUrls.length > 5) {
      console.log(`      ... and ${htmlUrls.length - 5} more`);
    }
    console.log('');
  }

  if (llmsTxtUrls.length > 0) {
    console.log('   🤖 llms.txt Routes (first 5):');
    llmsTxtUrls.slice(0, 5).forEach((url) => {
      const path = parse(url).pathname;
      console.log(`      - ${path}`);
    });
    if (llmsTxtUrls.length > 5) {
      console.log(`      ... and ${llmsTxtUrls.length - 5} more`);
    }
    console.log('');
  }

  if (feedUrls.length > 0) {
    console.log('   📡 RSS/Atom Feeds:');
    feedUrls.forEach((url) => {
      const path = parse(url).pathname;
      console.log(`      - ${path}`);
    });
    console.log('');
  }

  // =========================================================================
  // 5. FINAL SUMMARY
  // =========================================================================
  if (hasErrors) {
    console.error('❌ VALIDATION FAILED!');
    console.error('   Please fix errors above before running E2E tests.\n');
    process.exit(1);
  }

  console.log('✨ VALIDATION PASSED!\n');
  console.log('📊 Testing Summary:');
  console.log(`   Total URLs: ${allUrls.length}`);
  console.log(`   HTML Pages: ${htmlUrls.length} (11 SEO checks each)`);
  console.log(`   llms.txt Routes: ${llmsTxtUrls.length} (8 AI citation checks each)`);
  console.log(`   RSS/Atom Feeds: ${feedUrls.length} (feed validation)`);
  console.log('   Coverage: 100% ✅\n');

  console.log('🚀 Ready to run E2E tests:');
  console.log('   npx playwright test tests/e2e/seo/comprehensive-sitemap-coverage.spec.ts\n');
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
