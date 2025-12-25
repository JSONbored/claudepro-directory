/**
 * Shared Package Generator Factory
 *
 * Provides reusable patterns for package generation commands (skills, MCP servers, etc.).
 * Handles common logic: database loading, hash computation, batch processing, storage upload,
 * result logging, and summary reporting.
 */

import { performance } from 'node:perf_hooks';

import type { SupabaseClient } from '@supabase/supabase-js';

import { computeHash, hasHashChanged, setHash } from './cache.ts';
import { logger } from './logger.ts';
import { createServiceRoleClient } from './supabase.ts';

/**
 * Configuration for package generation
 */
export interface PackageGeneratorConfig<TItem, TPackageContent> {
  /** Command name for logging (e.g., 'generate-skill-packages') */
  commandName: string;
  /** Display name for items (e.g., 'skills', 'MCP servers') */
  itemName: string;
  /** Display name plural (e.g., 'skills', 'MCP servers') */
  itemNamePlural: string;
  /** Cache key prefix (e.g., 'skill:', 'mcpb:') */
  cacheKeyPrefix: string;
  /** Storage bucket name (e.g., 'skills', 'mcpb-packages') */
  storageBucket: string;
  /** File extension (e.g., '.zip', '.mcpb') */
  fileExtension: string;
  /** Concurrency level for batch processing */
  concurrency?: number;
  /** Load all items from database */
  loadItems: () => Promise<TItem[]>;
  /** Transform item to package content (string for hashing) */
  transformToPackageContent: (item: TItem) => Promise<string> | string;
  /** Check if item needs rebuild (optional override) */
  needsRebuild?: (item: TItem, contentHash: string, cacheKey: string) => boolean;
  /** Build package buffer from content */
  buildPackage: (item: TItem, content: TPackageContent) => Promise<Buffer>;
  /** Upload package to storage and update database */
  uploadAndUpdate: (
    supabase: SupabaseClient,
    item: TItem,
    packageBuffer: Buffer,
    contentHash: string
  ) => Promise<string>;
  /** Optional verification step after generation */
  verify?: (supabase: SupabaseClient, items: TItem[]) => Promise<void>;
}

/**
 * Result of package generation for a single item
 */
export interface PackageGenerationResult {
  slug: string;
  status: 'success' | 'error';
  message: string;
}

/**
 * Summary statistics for package generation
 */
export interface PackageGenerationSummary {
  total: number;
  built: number;
  skipped: number;
  failed: number;
  duration: string;
  concurrency: number;
}

const DEFAULT_CONCURRENCY = 5;

/**
 * Generic package generator factory
 *
 * Handles the complete workflow:
 * 1. Load items from database
 * 2. Compute hashes and filter changed items
 * 3. Process items in batches with concurrency
 * 4. Upload to storage and update database
 * 5. Log results and generate summary
 * 6. Optional verification step
 */
export async function generatePackages<TItem, TPackageContent>(
  config: PackageGeneratorConfig<TItem, TPackageContent>
): Promise<void> {
  const supabase = createServiceRoleClient();
  const concurrency = config.concurrency ?? DEFAULT_CONCURRENCY;

  logger.info(`🚀 Generating ${config.itemNamePlural} packages (database-first, optimized)...\n`);
  logger.info('═'.repeat(80));

  const startTime = performance.now();

  // Load items from database
  logger.info(`\n📊 Loading ${config.itemNamePlural} from database...`);
  const items = await config.loadItems();
  logger.info(`✅ Found ${items.length} ${config.itemNamePlural} in database\n`, {
    itemCount: items.length,
  });

  // Compute hashes and filter changed items
  logger.info(`🔍 Computing content hashes and filtering changed ${config.itemNamePlural}...`);
  const itemsToRebuild: Array<{ hash: string; item: TItem; content: TPackageContent }> = [];

  for (const item of items) {
    const packageContent = await config.transformToPackageContent(item);
    const hash = computeHash(packageContent);

    const cacheKey = `${config.cacheKeyPrefix}${getItemSlug(item)}`;
    const shouldRebuild = config.needsRebuild
      ? config.needsRebuild(item, hash, cacheKey)
      : hasHashChanged(cacheKey, hash);

    if (shouldRebuild) {
      itemsToRebuild.push({
        item,
        content: packageContent as TPackageContent,
        hash,
      });
    }
  }

  if (itemsToRebuild.length === 0) {
    logger.info(`✨ All ${config.itemNamePlural} up to date! No rebuild needed.\n`);
    logger.info(`💡 Content hashes match - zero packages regenerated\n`);
    return;
  }

  logger.info(`🔄 Rebuilding ${itemsToRebuild.length}/${items.length} ${config.itemNamePlural}\n`, {
    rebuilding: itemsToRebuild.length,
    total: items.length,
  });
  logger.info(`⚡ Processing ${concurrency} ${config.itemNamePlural} concurrently...\n`, {
    concurrency,
  });
  logger.info('═'.repeat(80));

  // Process items in batches
  const allResults: PackageGenerationResult[] = [];

  for (let i = 0; i < itemsToRebuild.length; i += concurrency) {
    const batch = itemsToRebuild.slice(i, i + concurrency);
    const batchResults = await processBatch(config, batch, supabase);

    allResults.push(...batchResults);

    for (const result of batchResults) {
      if (result.status === 'success') {
        logger.info(`✅ ${result.slug} (${result.message})`, {
          slug: result.slug,
          message: result.message,
        });
      } else {
        logger.error(`❌ ${result.slug}: ${result.message}`, undefined, {
          slug: result.slug,
          message: result.message,
        });
      }
    }
  }

  // Generate summary
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const successCount = allResults.filter((r) => r.status === 'success').length;
  const failCount = allResults.filter((r) => r.status === 'error').length;

  const summary: PackageGenerationSummary = {
    total: items.length,
    built: successCount,
    skipped: items.length - itemsToRebuild.length,
    failed: failCount,
    duration: `${duration}s`,
    concurrency,
  };

  logger.info(`\n${'═'.repeat(80)}`);
  logger.info('\n📊 BUILD SUMMARY:\n');
  logger.info(`   Total ${config.itemNamePlural}: ${summary.total}`);
  logger.info(`   ✅ Built: ${summary.built}/${itemsToRebuild.length}`);
  logger.info(`   ⏭️  Skipped: ${summary.skipped} (content unchanged)`);
  logger.info(`   ❌ Failed: ${summary.failed}/${itemsToRebuild.length}`);
  logger.info(`   ⏱️  Duration: ${summary.duration}`);
  logger.info(`   ⚡ Concurrency: ${summary.concurrency} parallel uploads`);
  logger.info(`   🗄️  Storage: Supabase Storage (${config.storageBucket} bucket)`, {
    total: summary.total,
    built: summary.built,
    skipped: summary.skipped,
    failed: summary.failed,
    duration: summary.duration,
    concurrency: summary.concurrency,
  });

  if (failCount > 0) {
    const failedResults = allResults.filter((r) => r.status === 'error');
    logger.error('\n❌ FAILED BUILDS:\n', undefined, {
      failCount,
      failedBuilds: failedResults.map((r) => ({
        slug: r.slug,
        message: r.message,
      })),
    });
    for (const r of failedResults) {
      logger.error(`   ${r.slug}: ${r.message}`, undefined, { slug: r.slug, message: r.message });
    }
    process.exit(1);
  }

  logger.info(`\n✨ Build complete! Next run will skip unchanged ${config.itemNamePlural}.\n`);

  // Optional verification step
  if (config.verify) {
    logger.info(`\n🔍 Verifying ${config.itemNamePlural} packages...\n`);
    await config.verify(supabase, items);
  }
}

/**
 * Process a batch of items concurrently
 */
async function processBatch<TItem, TPackageContent>(
  config: PackageGeneratorConfig<TItem, TPackageContent>,
  batch: Array<{ hash: string; item: TItem; content: TPackageContent }>,
  supabase: SupabaseClient
): Promise<PackageGenerationResult[]> {
  const results = await Promise.allSettled(
    batch.map(async ({ item, content, hash }) => {
      const buildStartTime = performance.now();

      const packageBuffer = await config.buildPackage(item, content);
      const fileSizeKB = (packageBuffer.length / 1024).toFixed(2);

      await config.uploadAndUpdate(supabase, item, packageBuffer, hash);

      const buildDuration = performance.now() - buildStartTime;
      const cacheKey = `${config.cacheKeyPrefix}${getItemSlug(item)}`;

      setHash(cacheKey, hash, {
        reason: `${config.itemName} package rebuilt`,
        duration: buildDuration,
        files: [`${getItemSlug(item)}${config.fileExtension}`],
      });

      return {
        slug: getItemSlug(item),
        status: 'success' as const,
        message: `${fileSizeKB}KB`,
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    const batchItem = batch[index];
    if (!batchItem) {
      return {
        slug: 'unknown',
        status: 'error' as const,
        message: 'Item not found at index',
      };
    }
    return {
      slug: getItemSlug(batchItem.item),
      status: 'error' as const,
      message: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}

/**
 * Extract slug from item (assumes item has slug property)
 */
function getItemSlug<TItem>(item: TItem): string {
  // Type-safe slug extraction
  if (typeof item === 'object' && item !== null && 'slug' in item) {
    const slug = (item as { slug: unknown }).slug;
    if (typeof slug === 'string') {
      return slug;
    }
  }
  throw new Error('Item must have a slug property');
}
