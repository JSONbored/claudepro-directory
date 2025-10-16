#!/usr/bin/env tsx
/**
 * Post-Build Cache Warming Script
 *
 * Warms cache with popular content after deployment to reduce initial latency.
 * Designed for production deployments to improve Time-To-First-Byte (TTFB).
 *
 * **Usage:**
 * ```bash
 * # Warm cache for all categories
 * npm run warm:cache
 *
 * # Warm cache with specific categories
 * npm run warm:cache -- --categories=agents,mcp,rules
 *
 * # Dry run (validation only)
 * npm run warm:cache -- --dry-run
 * ```
 *
 * **Environment Requirements:**
 * - KV_REST_API_URL: Upstash Redis URL
 * - KV_REST_API_TOKEN: Upstash Redis token
 * - POSTGRES_URL: Database connection string
 *
 * **Exit Codes:**
 * - 0: Success
 * - 1: Validation error or configuration missing
 * - 2: Partial failure (some categories failed)
 *
 * **Integration:**
 * Add to package.json:
 * ```json
 * {
 *   "scripts": {
 *     "warm:cache": "tsx scripts/warm-cache.ts",
 *     "postbuild": "npm run warm:cache"
 *   }
 * }
 * ```
 */

import { cacheWarmer } from '@/src/lib/cache.server';
import { logger } from '@/src/lib/logger';

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const categoriesArg = args.find((arg) => arg.startsWith('--categories='));
const specificCategories = categoriesArg
  ?.split('=')[1]
  ?.split(',')
  .map((c) => c.trim());

/**
 * Validate environment configuration
 */
function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.KV_REST_API_URL) {
    errors.push('Missing KV_REST_API_URL environment variable');
  }

  if (!process.env.KV_REST_API_TOKEN) {
    errors.push('Missing KV_REST_API_TOKEN environment variable');
  }

  if (!(process.env.POSTGRES_URL || process.env.DATABASE_URL)) {
    errors.push('Missing POSTGRES_URL or DATABASE_URL environment variable');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Main cache warming execution
 */
async function main() {
  const startTime = Date.now();

  console.log('🔥 Cache Warming Script');
  console.log('=======================\n');

  // Validate environment
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    console.error('❌ Environment validation failed:\n');
    for (const error of envCheck.errors) {
      console.error(`   • ${error}`);
    }
    console.error(
      '\n💡 Tip: Ensure all required environment variables are set in your deployment environment.'
    );
    process.exit(1);
  }

  console.log('✅ Environment validated');

  // Dry run mode
  if (isDryRun) {
    console.log('\n🔍 Running in DRY RUN mode (validation only)');
    console.log('   Cache will NOT be modified\n');
  }

  // Display configuration
  if (specificCategories && specificCategories.length > 0) {
    console.log(`\n📋 Warming specific categories: ${specificCategories.join(', ')}`);
  } else {
    console.log('\n📋 Warming all categories');
  }

  if (isDryRun) {
    console.log('\n✅ Validation successful - cache warming would proceed in production');
    console.log(`⏱️  Completed in ${Date.now() - startTime}ms\n`);
    process.exit(0);
  }

  // Execute cache warming
  console.log('\n🔄 Starting cache warming...\n');

  try {
    const result = await cacheWarmer.warmCache();

    // Check result
    if (typeof result === 'object' && 'error' in result) {
      console.error(`\n❌ Cache warming failed: ${result.error}`);
      process.exit(2);
    }

    if (typeof result === 'object' && 'message' in result) {
      console.log(`\n⚠️  ${result.message}`);
      process.exit(0);
    }

    // Success
    const stats = result as {
      status: string;
      itemsWarmed: number;
      categoriesProcessed: number;
      failedCategories: number;
      duration: number;
    };

    console.log('\n✅ Cache warming completed successfully!\n');
    console.log(`   Status: ${stats.status}`);
    console.log(`   Items warmed: ${stats.itemsWarmed}`);
    console.log(`   Categories processed: ${stats.categoriesProcessed}`);

    if (stats.failedCategories > 0) {
      console.log(`   ⚠️  Failed categories: ${stats.failedCategories}`);
    }

    console.log(`   ⏱️  Duration: ${stats.duration}ms`);
    console.log('');

    // Log for observability
    logger.info('Post-build cache warming completed', {
      itemsWarmed: stats.itemsWarmed,
      categoriesProcessed: stats.categoriesProcessed,
      failedCategories: stats.failedCategories,
      duration: stats.duration,
    });

    // Exit with appropriate code
    process.exit(stats.failedCategories > 0 ? 2 : 0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.error('\n❌ Unexpected error during cache warming:\n');
    console.error(`   ${err.message}\n`);

    if (err.stack && process.env.NODE_ENV === 'development') {
      console.error('Stack trace:');
      console.error(err.stack);
      console.error('');
    }

    logger.error('Cache warming script failed', err);
    process.exit(2);
  }
}

// Execute with error handling
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(2);
});
