/**
 * IndexNow URL Submission Script
 * Submits all site URLs to IndexNow API for instant search engine indexing
 *
 * Usage:
 *   npm run indexnow:submit
 *
 * Features:
 * - Reuses sitemap generation logic for URL collection
 * - Batch submission (max 10,000 URLs per IndexNow spec)
 * - Error handling and logging
 * - Supports Bing, Yandex, and other IndexNow-compatible search engines
 *
 * Documentation: https://www.indexnow.org/documentation
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
// Import directly from metadata files
import { agentsMetadata } from '../generated/agents-metadata.js';
import { collectionsMetadata } from '../generated/collections-metadata.js';
import { commandsMetadata } from '../generated/commands-metadata.js';
import { hooksMetadata } from '../generated/hooks-metadata.js';
import { mcpMetadata } from '../generated/mcp-metadata.js';
import { rulesMetadata } from '../generated/rules-metadata.js';
import { statuslinesMetadata } from '../generated/statuslines-metadata.js';
import { parseChangelog } from '../src/lib/changelog/parser.js';
import { APP_CONFIG, CONTENT_PATHS, MAIN_CONTENT_CATEGORIES } from '../src/lib/constants';
import { logger } from '../src/lib/logger.js';
import type { ContentItem } from '../src/lib/schemas/content/content-item-union.schema';

// IndexNow configuration
const INDEXNOW_API_KEY = '863ad0a5c1124f59a060aa77f0861518';
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const baseUrl = APP_CONFIG.url;

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Generate all site URLs (reuses sitemap logic)
 */
async function getAllUrls(): Promise<string[]> {
  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: baseUrl || '',
    lastmod: new Date().toISOString().split('T')[0] || '',
    changefreq: 'daily',
    priority: 1.0,
  });

  // Category pages
  const categories = [...MAIN_CONTENT_CATEGORIES];
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl || ''}/${category}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.8,
    });
  });

  // Static pages
  const staticPages = ['jobs', 'community', 'trending', 'submit', 'partner', 'guides', 'api-docs', 'changelog'];
  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.6,
    });
  });

  // Tools pages
  const toolPages = ['tools/config-recommender'];
  toolPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'monthly',
      priority: 0.8,
    });
  });

  // llms.txt routes for static pages
  const staticPagesWithLlmsTxt = ['api-docs', 'guides', 'tools/config-recommender'];
  staticPagesWithLlmsTxt.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}/llms.txt`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.85,
    });
  });

  // Guide pages
  const seoCategories = ['use-cases', 'tutorials', 'collections', 'categories', 'workflows', 'comparisons', 'troubleshooting'];
  seoCategories.forEach((category) => {
    try {
      const categoryPath = join(CONTENT_PATHS.guides || '', category);
      if (existsSync(categoryPath)) {
        const files = readdirSync(categoryPath);
        files.forEach((file) => {
          if (file.endsWith('.mdx')) {
            const slug = file.replace('.mdx', '');
            urls.push({
              loc: `${baseUrl}/guides/${category}/${slug}`,
              lastmod: new Date().toISOString().split('T')[0] || '',
              changefreq: 'weekly',
              priority: 0.7,
            });
            // Add llms.txt for each guide
            urls.push({
              loc: `${baseUrl}/guides/${category}/${slug}/llms.txt`,
              lastmod: new Date().toISOString().split('T')[0] || '',
              changefreq: 'weekly',
              priority: 0.7,
            });
          }
        });
      }
    } catch {
      // Directory doesn't exist yet
    }
  });

  // Changelog entries
  try {
    const changelog = await parseChangelog();
    changelog.entries.forEach((entry) => {
      urls.push({
        loc: `${baseUrl}/changelog/${entry.slug}`,
        lastmod: entry.date,
        changefreq: 'monthly',
        priority: 0.7,
      });
    });

    // Changelog RSS/Atom feeds
    urls.push(
      {
        loc: `${baseUrl}/changelog/rss.xml`,
        lastmod: new Date().toISOString().split('T')[0] || '',
        changefreq: 'daily',
        priority: 0.6,
      },
      {
        loc: `${baseUrl}/changelog/atom.xml`,
        lastmod: new Date().toISOString().split('T')[0] || '',
        changefreq: 'daily',
        priority: 0.6,
      }
    );

    // Changelog llms.txt routes
    urls.push({
      loc: `${baseUrl}/changelog/llms.txt`,
      lastmod: changelog.entries[0]?.date || new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.85,
    });

    changelog.entries.forEach((entry) => {
      urls.push({
        loc: `${baseUrl}/changelog/${entry.slug}/llms.txt`,
        lastmod: entry.date,
        changefreq: 'weekly',
        priority: 0.75,
      });
    });
  } catch {
    logger.warn('Failed to parse changelog, skipping changelog URLs');
  }

  // Content items (agents, mcp, rules, commands, hooks, statuslines)
  const allContent: ContentItem[] = [
    ...agentsMetadata,
    ...mcpMetadata,
    ...rulesMetadata,
    ...commandsMetadata,
    ...hooksMetadata,
    ...statuslinesMetadata,
  ];

  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}`,
      lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Collections
  collectionsMetadata.forEach((collection) => {
    urls.push({
      loc: `${baseUrl}/collections/${collection.slug}`,
      lastmod: (collection.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Main llms.txt index
  urls.push({
    loc: `${baseUrl}/llms.txt`,
    lastmod: new Date().toISOString().split('T')[0] || '',
    changefreq: 'daily',
    priority: 0.9,
  });

  // Category llms.txt indexes
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl}/${category}/llms.txt`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.85,
    });
  });

  // Content item llms.txt routes
  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}/llms.txt`,
      lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.75,
    });
  });

  // Collection llms.txt pages
  collectionsMetadata.forEach((collection) => {
    urls.push({
      loc: `${baseUrl}/collections/${collection.slug}/llms.txt`,
      lastmod: (collection.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.75,
    });
  });

  // Extract just the URLs
  return urls.map((url) => url.loc);
}

/**
 * Submit URLs to IndexNow API
 * Supports batching up to 10,000 URLs per request (IndexNow limit)
 */
async function submitToIndexNow(urls: string[]): Promise<void> {
  const MAX_BATCH_SIZE = 10000; // IndexNow API limit
  const batches: string[][] = [];

  // Split into batches if needed
  for (let i = 0; i < urls.length; i += MAX_BATCH_SIZE) {
    batches.push(urls.slice(i, i + MAX_BATCH_SIZE));
  }

  logger.log(`📤 Submitting ${urls.length} URLs in ${batches.length} batch(es) to IndexNow API...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) continue;

    logger.progress(`Submitting batch ${i + 1}/${batches.length} (${batch.length} URLs)...`);

    const payload = {
      host: new URL(baseUrl || '').hostname,
      key: INDEXNOW_API_KEY,
      keyLocation: `${baseUrl}/${INDEXNOW_API_KEY}.txt`,
      urlList: batch,
    };

    try {
      const response = await fetch(INDEXNOW_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.success(`✅ Batch ${i + 1}/${batches.length} submitted successfully (HTTP ${response.status})`);
      } else {
        const errorText = await response.text();
        logger.failure(
          `❌ Batch ${i + 1}/${batches.length} failed (HTTP ${response.status}): ${errorText}`
        );

        // Log specific error reasons
        if (response.status === 400) {
          logger.log('   Reason: Invalid format - check payload structure');
        } else if (response.status === 403) {
          logger.log('   Reason: Key not valid - verify key file is accessible');
        } else if (response.status === 422) {
          logger.log('   Reason: URLs don\'t belong to host or key mismatch');
        } else if (response.status === 429) {
          logger.log('   Reason: Too many requests - wait before retrying');
        }
      }
    } catch (error) {
      logger.failure(
        `❌ Batch ${i + 1}/${batches.length} failed with error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Rate limiting: Wait 1 second between batches
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    logger.log('🔍 IndexNow URL Submission Tool');
    logger.log('================================\n');

    // Get all URLs
    logger.progress('Collecting all site URLs...');
    const urls = await getAllUrls();
    logger.success(`✅ Collected ${urls.length} URLs\n`);

    // Verify key file exists
    const keyFilePath = `/workspace/public/${INDEXNOW_API_KEY}.txt`;
    if (!existsSync(keyFilePath)) {
      logger.failure(`❌ Key file not found: ${keyFilePath}`);
      logger.log(`   Create the file with content: ${INDEXNOW_API_KEY}`);
      process.exit(1);
    }
    logger.success(`✅ Key file verified: ${INDEXNOW_API_KEY}.txt\n`);

    // Submit to IndexNow
    await submitToIndexNow(urls);

    logger.log('\n✅ IndexNow submission complete!');
    logger.log(`   Submitted: ${urls.length} URLs`);
    logger.log(`   Verify at: https://www.bing.com/webmasters`);
  } catch (error) {
    logger.failure(
      `Failed to submit to IndexNow: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run if executed directly
main().catch((error: unknown) => {
  console.error('Failed to submit to IndexNow:', error);
  process.exit(1);
});