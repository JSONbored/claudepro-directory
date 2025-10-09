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

// Import directly from metadata files
import { existsSync } from 'fs';
import { agentsMetadata } from '../generated/agents-metadata.js';
import { collectionsMetadata } from '../generated/collections-metadata.js';
import { commandsMetadata } from '../generated/commands-metadata.js';
import { hooksMetadata } from '../generated/hooks-metadata.js';
import { mcpMetadata } from '../generated/mcp-metadata.js';
import { rulesMetadata } from '../generated/rules-metadata.js';
import { statuslinesMetadata } from '../generated/statuslines-metadata.js';
import { extractUrlStrings, generateAllSiteUrls } from '../src/lib/build/url-generator.js';
import { APP_CONFIG } from '../src/lib/constants';
import { logger } from '../src/lib/logger.js';

// IndexNow configuration
const INDEXNOW_API_KEY = '863ad0a5c1124f59a060aa77f0861518';
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const baseUrl = APP_CONFIG.url;

/**
 * Generate all site URLs using centralized URL generator
 */
async function getAllUrls(): Promise<string[]> {
  const sitemapUrls = await generateAllSiteUrls(
    {
      agentsMetadata,
      collectionsMetadata,
      commandsMetadata,
      hooksMetadata,
      mcpMetadata,
      rulesMetadata,
      statuslinesMetadata,
    },
    {
      baseUrl,
      includeGuides: true,
      includeChangelog: true,
      includeLlmsTxt: true,
      includeTools: true,
    }
  );

  // Extract just the URL strings for IndexNow
  return extractUrlStrings(sitemapUrls);
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
        logger.success(
          `✅ Batch ${i + 1}/${batches.length} submitted successfully (HTTP ${response.status})`
        );
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
          logger.log("   Reason: URLs don't belong to host or key mismatch");
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
    logger.log('   Verify at: https://www.bing.com/webmasters');
  } catch (error) {
    logger.failure(
      `Failed to submit to IndexNow: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run if executed directly
main().catch((error: unknown) => {
  logger.failure(
    `Failed to submit to IndexNow: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
