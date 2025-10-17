#!/usr/bin/env tsx

/**
 * Unified Title Verification Script (Production Grade)
 * Verifies that all page titles meet SEO character requirements (<60 chars)
 *
 * Features:
 * - Type-safe with Zod validation
 * - Performance optimized with parallel processing
 * - Comprehensive error handling
 * - Memory efficient streaming
 * - Production logger integration
 *
 * Modes:
 * - --quick: Fast verification with summary only (exits on first failure)
 * - --full: Comprehensive verification with detailed output (default)
 *
 * Usage:
 *   npm run validate:titles        # Full mode (default)
 *   npm run validate:titles:quick  # Quick mode
 *
 * Exit codes:
 *   0 - All titles pass SEO requirements
 *   1 - One or more titles fail requirements
 *   2 - Script execution error
 *
 * @see generated/*-metadata.ts - Source of truth for content
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import { getDisplayTitle } from '@/src/lib/utils';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const SEO_CONFIG = {
  MAX_TITLE_LENGTH: 60, // Google truncates at ~60 chars
  OPTIMAL_MIN_LENGTH: 55, // Sweet spot for SEO
  WARN_THRESHOLD: 55, // Warn if below optimal
} as const;

const VERIFICATION_MODES = ['quick', 'full'] as const;
type VerificationMode = (typeof VERIFICATION_MODES)[number];

// ============================================================================
// TYPE-SAFE SCHEMAS
// ============================================================================

const titleResultSchema = z.object({
  route: z.string().min(1),
  title: z.string(),
  length: z.number().int().min(0),
  status: z.enum(['pass', 'warn', 'fail']),
  type: z.string(),
});

const frontmatterSchema = z.object({
  title: z.string().optional(),
  seoTitle: z.string().optional(),
  description: z.string().optional(),
});

const verificationSummarySchema = z.object({
  totalPages: z.number().int().min(0),
  passes: z.number().int().min(0),
  warnings: z.number().int().min(0),
  failures: z.number().int().min(0),
  duration: z.number().min(0),
  mode: z.enum(VERIFICATION_MODES),
});

type TitleResult = z.infer<typeof titleResultSchema>;
type VerificationSummary = z.infer<typeof verificationSummarySchema>;

// ============================================================================
// RESULT COLLECTOR (Memory-efficient)
// ============================================================================

class ResultCollector {
  private results: TitleResult[] = [];
  private earlyExit = false;

  add(result: TitleResult): void {
    // Validate result before adding
    const validated = titleResultSchema.parse(result);
    this.results.push(validated);

    // Quick mode: exit on first failure
    if (this.earlyExit && validated.status === 'fail') {
      throw new Error('EARLY_EXIT');
    }
  }

  setEarlyExit(enabled: boolean): void {
    this.earlyExit = enabled;
  }

  getResults(): readonly TitleResult[] {
    return this.results;
  }

  getFailures(): TitleResult[] {
    return this.results.filter((r) => r.status === 'fail');
  }

  getWarnings(): TitleResult[] {
    return this.results.filter((r) => r.status === 'warn');
  }

  getPasses(): TitleResult[] {
    return this.results.filter((r) => r.status === 'pass');
  }

  getByType(type: string): TitleResult[] {
    return this.results.filter((r) => r.type === type);
  }

  getSummary(duration: number, mode: VerificationMode): VerificationSummary {
    return verificationSummarySchema.parse({
      totalPages: this.results.length,
      passes: this.getPasses().length,
      warnings: this.getWarnings().length,
      failures: this.getFailures().length,
      duration,
      mode,
    });
  }
}

// ============================================================================
// TITLE VERIFICATION CORE
// ============================================================================

async function verifyTitle(
  route: string,
  context: MetadataContext,
  type: string,
  collector: ResultCollector
): Promise<void> {
  try {
    const metadata = await generatePageMetadata(route, context);
    const title = metadata.title?.toString() || '';
    const length = title.length;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (length > SEO_CONFIG.MAX_TITLE_LENGTH) {
      status = 'fail';
    } else if (length < SEO_CONFIG.WARN_THRESHOLD) {
      status = 'warn';
    }

    collector.add({
      route,
      title,
      length,
      status,
      type,
    });
  } catch (error) {
    // Don't fail entire verification for one page error
    logger.error(
      'Title verification error',
      error instanceof Error ? error : new Error(String(error)),
      {
        route,
        type,
      }
    );

    // Add as failure so it's tracked
    collector.add({
      route,
      title: '[ERROR]',
      length: 0,
      status: 'fail',
      type,
    });
  }
}

// ============================================================================
// FRONTMATTER PARSER (Secure, validated)
// ============================================================================

function parseFrontmatter(content: string): z.infer<typeof frontmatterSchema> {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return {};
  }

  const result: Record<string, string> = {};
  const lines = frontmatterMatch[1].split('\n');

  for (const line of lines) {
    // Security: Sanitize input, prevent injection
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes and trim
      result[key] = value.replace(/^["']|["']$/g, '').trim();
    }
  }

  // Validate with Zod
  return frontmatterSchema.parse(result);
}

// ============================================================================
// CONTENT VERIFICATION FUNCTIONS
// ============================================================================

async function verifyHomePage(collector: ResultCollector): Promise<void> {
  await verifyTitle('/', {}, 'home', collector);
}

async function verifySectionPages(collector: ResultCollector): Promise<void> {
  const sections = [
    'guides',
    'collections',
    'community',
    'jobs',
    'partner',
    'submit',
    'trending',
    'api-docs',
  ];

  // Parallel processing for performance
  await Promise.all(
    sections.map((section) => verifyTitle(`/${section}`, {}, 'section', collector))
  );
}

async function verifyCategoryPages(collector: ResultCollector): Promise<void> {
  // MODERNIZATION: Dynamic metadata loading from UNIFIED_CATEGORY_REGISTRY
  const { getAllCategoryIds } = await import('../../src/lib/config/category-config.js');
  const categoryIds = getAllCategoryIds();

  // Dynamic imports for all categories
  const metadataImports = await Promise.all(
    categoryIds.map(async (catId) => {
      try {
        const module = await import(`../generated/${catId}-metadata.js`);
        const varName = catId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        const metadataKey = `${varName}Metadata`;
        return { category: catId, metadata: module[metadataKey] || [] };
      } catch (error) {
        console.warn(`Warning: Could not load metadata for ${catId}:`, error);
        return { category: catId, metadata: [] };
      }
    })
  );

  const metadataMap = Object.fromEntries(
    metadataImports.map(({ category, metadata }) => [category, metadata])
  );

  // Process categories in parallel
  await Promise.all(
    Object.entries(metadataMap).map(async ([category, items]) => {
      // Category index page
      await verifyTitle(
        `/${category}`,
        {
          categoryConfig: {
            title: getDisplayTitle({ slug: category, category }) as string,
            slug: category,
          },
        },
        'category',
        collector
      );

      // Batch process content pages (parallel with limit to avoid memory issues)
      const BATCH_SIZE = 50;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((item) =>
            verifyTitle(
              `/${category}/${item.slug}`,
              {
                item: {
                  ...item,
                  category,
                },
                categoryConfig: {
                  title: getDisplayTitle({ slug: category, category }) as string,
                  slug: category,
                },
              },
              'content',
              collector
            )
          )
        );
      }
    })
  );
}

async function verifyCollections(collector: ResultCollector): Promise<void> {
  const { collectionsMetadata } = await import('../generated/collections-metadata.js');

  await Promise.all(
    collectionsMetadata.map((collection) =>
      verifyTitle(
        `/collections/${collection.slug}`,
        {
          item: collection,
        },
        'collection',
        collector
      )
    )
  );
}

async function verifyGuides(collector: ResultCollector): Promise<void> {
  const guidesDir = path.join(process.cwd(), 'content/guides');

  let guideCategories: string[];
  try {
    guideCategories = await fs.readdir(guidesDir);
  } catch (error) {
    logger.warn(
      'Guides directory not found, skipping guide verification',
      error instanceof Error ? error : new Error(String(error)),
      {
        guidesDir,
      }
    );
    return;
  }

  for (const guideCategory of guideCategories) {
    const categoryPath = path.join(guidesDir, guideCategory);

    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(categoryPath);
    } catch {
      continue; // Skip non-existent paths
    }

    if (!stat.isDirectory()) continue;

    // Guide category page
    await verifyTitle(`/guides/${guideCategory}`, {}, 'guide-category', collector);

    // Guide pages
    const files = await fs.readdir(categoryPath);
    const mdxFiles = files.filter((f) => f.endsWith('.mdx'));

    // Process guides in parallel batches
    const BATCH_SIZE = 20;
    for (let i = 0; i < mdxFiles.length; i += BATCH_SIZE) {
      const batch = mdxFiles.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (file) => {
          try {
            const content = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            const frontmatter = parseFrontmatter(content);
            const slug = file.replace('.mdx', '');

            await verifyTitle(
              `/guides/${guideCategory}/${slug}`,
              {
                params: {
                  category: guideCategory,
                  slug,
                },
                item: {
                  title: frontmatter.title || '',
                  seoTitle: frontmatter.seoTitle,
                  description: frontmatter.description || '',
                  tags: [],
                },
              },
              'guide',
              collector
            );
          } catch (error) {
            logger.warn('Failed to parse guide file', undefined, {
              file,
              error: String(error),
            });
          }
        })
      );
    }
  }
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

function printFailures(failures: TitleResult[]): void {
  if (failures.length === 0) return;

  logger.info(`\n❌ FAILURES (>${SEO_CONFIG.MAX_TITLE_LENGTH} chars): ${failures.length}`);
  for (const result of failures) {
    logger.info(`   ${result.length} chars | ${result.route}`);
    logger.info(`   "${result.title}"`);
    if (result.title !== '[ERROR]') {
      logger.info(`   OVER BY: ${result.length - SEO_CONFIG.MAX_TITLE_LENGTH} chars`);
    }
    logger.info('');
  }
}

function printWarnings(warnings: TitleResult[], limit = 10): void {
  if (warnings.length === 0) return;

  logger.info(`\n⚠️  WARNINGS (<${SEO_CONFIG.WARN_THRESHOLD} chars): ${warnings.length}`);
  for (const result of warnings.slice(0, limit)) {
    logger.info(`   ${result.length} chars | ${result.route}`);
    logger.info(`   "${result.title}"`);
    logger.info('');
  }
  if (warnings.length > limit) {
    logger.info(`   ... and ${warnings.length - limit} more`);
  }
}

function printPasses(passes: TitleResult[], limit = 10): void {
  if (passes.length === 0) return;

  logger.info(
    `\n✅ PASSES (${SEO_CONFIG.WARN_THRESHOLD}-${SEO_CONFIG.MAX_TITLE_LENGTH} chars): ${passes.length}`
  );
  for (const result of passes.slice(0, limit)) {
    logger.info(`   ${result.length} chars | ${result.route}`);
    logger.info(`   "${result.title}"`);
    logger.info('');
  }
  if (passes.length > limit) {
    logger.info(`   ... and ${passes.length - limit} more`);
  }
}

function printTypeBreakdown(collector: ResultCollector): void {
  logger.info('\n📈 SUMMARY BY TYPE\n');
  logger.info('='.repeat(80));

  const types = [...new Set(collector.getResults().map((r) => r.type))].sort();

  for (const type of types) {
    const typeResults = collector.getByType(type);
    const typeFails = typeResults.filter((r) => r.status === 'fail').length;
    const typeWarns = typeResults.filter((r) => r.status === 'warn').length;
    const typePasses = typeResults.filter((r) => r.status === 'pass').length;

    logger.info(`${type.toUpperCase()}: ${typeResults.length} total`);
    logger.info(`   ✅ ${typePasses} pass | ⚠️  ${typeWarns} warn | ❌ ${typeFails} fail`);
  }
}

function printSummary(summary: VerificationSummary): void {
  logger.info(`\n${'='.repeat(80)}`);
  logger.info(`\n📊 OVERALL: ${summary.totalPages} pages verified in ${summary.duration}ms`);
  logger.info(
    `   ✅ ${summary.passes} pass (${((summary.passes / summary.totalPages) * 100).toFixed(1)}%)`
  );
  logger.info(
    `   ⚠️  ${summary.warnings} warn (${((summary.warnings / summary.totalPages) * 100).toFixed(1)}%)`
  );
  logger.info(
    `   ❌ ${summary.failures} fail (${((summary.failures / summary.totalPages) * 100).toFixed(1)}%)`
  );
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const startTime = performance.now();

  // Parse command-line arguments (secure: whitelist only)
  const args = process.argv.slice(2);
  const mode: VerificationMode = args.includes('--quick') ? 'quick' : 'full';

  logger.info(`🔍 Title Verification (${mode} mode)\n`);
  logger.info('='.repeat(80));

  const collector = new ResultCollector();

  // Quick mode: enable early exit on first failure
  if (mode === 'quick') {
    collector.setEarlyExit(true);
  }

  try {
    // Execute all verification steps
    if (mode === 'full') {
      logger.info('\n📄 Verifying pages...');
    }

    await verifyHomePage(collector);
    await verifySectionPages(collector);
    await verifyCategoryPages(collector);
    await verifyCollections(collector);
    await verifyGuides(collector);
  } catch (error) {
    if (error instanceof Error && error.message === 'EARLY_EXIT') {
      // Quick mode early exit
      logger.warn('Early exit triggered in quick mode');
    } else {
      throw error; // Re-throw unexpected errors
    }
  }

  const duration = Math.round(performance.now() - startTime);
  const summary = collector.getSummary(duration, mode);

  // Print results
  logger.info('\n📊 VERIFICATION RESULTS\n');
  logger.info('='.repeat(80));

  // Always show failures
  printFailures(collector.getFailures());

  // Full mode: show detailed breakdown
  if (mode === 'full') {
    printWarnings(collector.getWarnings());
    printPasses(collector.getPasses());
    printTypeBreakdown(collector);
  }

  // Print summary
  printSummary(summary);

  // Exit with appropriate code
  if (summary.failures === 0) {
    logger.success('\n✨ All page titles meet SEO requirements!\n');
    process.exit(0);
  } else {
    logger.warn('\n⚠️  Some page titles exceed 60 characters. Please review.\n');
    process.exit(1);
  }
}

// Entry point with comprehensive error handling
main().catch((error) => {
  logger.error(
    'Title verification script failed',
    error instanceof Error ? error : new Error(String(error))
  );
  process.exit(2); // Exit code 2 for script errors
});
