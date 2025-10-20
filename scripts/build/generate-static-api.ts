#!/usr/bin/env node
/**
 * Static API Generator
 * 
 * Pre-generates static JSON files for all content API endpoints.
 * These are served from CDN (free, instant) instead of serverless functions.
 * 
 * Benefits:
 * - Zero function invocations for API reads (20-30% cost savings)
 * - Instant response times (CDN vs serverless cold start)
 * - No rate limiting needed (static files)
 * - Better SEO (faster API responses)
 * 
 * Generated files: public/static-api/*.json
 * 
 * @module scripts/build/generate-static-api
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllCategoryIds } from '../../src/lib/config/category-config.js';
import { getContentByCategory } from '../../src/lib/content/content-loaders.js';
import { logger } from '../../src/lib/logger.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT_DIR, 'public', 'static-api');

/**
 * Generate static API file for a single category
 */
async function generateCategoryAPI(category: string): Promise<void> {
  try {
    const data = await getContentByCategory(category);
    
    // Match the format of /api/[contentType] route
    const apiResponse = {
      [category]: data.map((item) => ({
        ...item,
        type: category.slice(0, -1), // 'agents' → 'agent'
        url: `https://claudepro.directory/${category}/${item.slug}`,
      })),
      count: data.length,
      lastUpdated: new Date().toISOString(),
      _meta: {
        generated: 'static',
        source: 'build',
        cache: 'immutable',
      },
    };
    
    // Write JSON file
    const filename = `${category}.json`;
    const filepath = join(OUTPUT_DIR, filename);
    
    await writeFile(
      filepath,
      JSON.stringify(apiResponse, null, 2),
      'utf-8'
    );
    
    console.log(`   ✓ ${filename.padEnd(20)} (${data.length} items, ${Math.round(JSON.stringify(apiResponse).length / 1024)} KB)`);
  } catch (error) {
    logger.error(
      `Failed to generate static API for ${category}`,
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Main generation function
 */
export async function generateStaticAPI(): Promise<void> {
  const startTime = performance.now();
  
  console.log('📦 Generating static API files...\n');
  
  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });
  
  // Get all categories
  const categories = getAllCategoryIds();
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Output: public/static-api/\n`);
  
  // Generate all category APIs in parallel
  await Promise.all(
    categories.map((category) => generateCategoryAPI(category))
  );
  
  const duration = Math.round(performance.now() - startTime);
  
  console.log(`\n✓ Static API generation complete`);
  console.log(`   Files: ${categories.length}`);
  console.log(`   Time: ${duration}ms`);
  console.log(`   Output: public/static-api/*.json\n`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStaticAPI().catch((error) => {
    console.error('❌ Static API generation failed:', error);
    process.exit(1);
  });
}
