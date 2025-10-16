#!/usr/bin/env tsx

/**
 * SEO Title Optimization Script
 * Enhances underutilized titles by updating source JSON/MDX files directly
 *
 * Usage:
 *   npm run optimize:titles           # Run optimization
 *   npm run optimize:titles --dry-run # Preview without changes
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { logger } from '../../src/lib/logger.js';
import type { ContentCategory } from '../../src/lib/schemas/shared.schema.js';
import { type ContentItem, enhanceTitle } from '../../src/lib/seo/title-enhancer.js';
import { ParseStrategy, safeParse } from '../../src/lib/utils/data.utils.js';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Content item schema for JSON file parsing (Zod)
 * Production-grade runtime validation with permissive passthrough
 */
const contentItemSchema = z
  .object({
    title: z.string().optional(),
    seoTitle: z.string().optional(),
    slug: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
  })
  .passthrough();

interface OptimizationStats {
  total: number;
  enhanced: number;
  skipped: number;
  failed: number;
}

/**
 * Update seoTitle in JSON file
 */
async function updateJsonFile(filePath: string, seoTitle: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  // Production-grade: safeParse with Zod validation
  const data = safeParse(content, contentItemSchema, {
    strategy: ParseStrategy.VALIDATED_JSON,
  });

  // Add or update seoTitle field (insert after title if exists)
  if (data.seoTitle) {
    // Update existing seoTitle
    data.seoTitle = seoTitle;
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  } else {
    // Parse and rebuild to insert seoTitle in correct position
    const lines = content.split('\n');
    const titleIndex = lines.findIndex((line) => line.includes('"title":'));

    if (titleIndex !== -1) {
      lines.splice(titleIndex + 1, 0, `  "seoTitle": "${seoTitle}",`);
      await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
    } else {
      // Fallback: just add it
      data.seoTitle = seoTitle;
      await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    }
  }
}

/**
 * Update seoTitle in MDX frontmatter
 */
async function updateMdxFile(filePath: string, seoTitle: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }

  const frontmatter = frontmatterMatch[1];
  const hasSeoTitle = frontmatter.includes('seoTitle:');

  let newFrontmatter: string;
  if (hasSeoTitle) {
    // Update existing seoTitle
    newFrontmatter = frontmatter.replace(/seoTitle:\s*["'].*["']/, `seoTitle: "${seoTitle}"`);
  } else {
    // Add seoTitle after title
    const lines = frontmatter.split('\n');
    const titleIndex = lines.findIndex((line) => line.startsWith('title:'));
    if (titleIndex !== -1) {
      lines.splice(titleIndex + 1, 0, `seoTitle: "${seoTitle}"`);
      newFrontmatter = lines.join('\n');
    } else {
      newFrontmatter = `${frontmatter}\nseoTitle: "${seoTitle}"`;
    }
  }

  const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);

  await fs.writeFile(filePath, newContent, 'utf-8');
}

/**
 * Optimize JSON content files
 */
async function optimizeJsonContent(
  category: ContentCategory,
  contentDir: string
): Promise<OptimizationStats> {
  const stats: OptimizationStats = {
    total: 0,
    enhanced: 0,
    skipped: 0,
    failed: 0,
  };
  const categoryDir = path.join(contentDir, category);

  if (!existsSync(categoryDir)) {
    logger.info(`Skipping ${category} - directory not found`);
    return stats;
  }

  const files = await fs.readdir(categoryDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  for (const file of jsonFiles) {
    const filePath = path.join(categoryDir, file);
    stats.total++;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Production-grade: safeParse with Zod validation
      const data = safeParse(content, contentItemSchema, {
        strategy: ParseStrategy.VALIDATED_JSON,
      }) as ContentItem;
      data.category = category;

      const result = enhanceTitle(data, category);

      if (result.enhanced && result.enhancedTitle) {
        if (DRY_RUN) {
          logger.info(`[DRY RUN] ${file}:`);
          logger.info(`  ${result.originalTitle} → ${result.enhancedTitle}`);
          logger.info(
            `  Strategy: ${result.strategy}, Gain: +${result.gain} chars (${result.finalLength} total)`
          );
        } else {
          await updateJsonFile(filePath, result.enhancedTitle);
          logger.success(`✅ ${file}: ${result.originalTitle} → ${result.enhancedTitle}`);
        }
        stats.enhanced++;
      } else {
        stats.skipped++;
      }
    } catch (error) {
      logger.error(
        `Failed to process ${file}:`,
        error instanceof Error ? error : new Error(String(error))
      );
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Optimize MDX guide files
 */
async function optimizeGuides(contentDir: string): Promise<OptimizationStats> {
  const stats: OptimizationStats = {
    total: 0,
    enhanced: 0,
    skipped: 0,
    failed: 0,
  };
  const guidesDir = path.join(contentDir, 'guides');

  if (!existsSync(guidesDir)) {
    logger.info('Skipping guides - directory not found');
    return stats;
  }

  const guideCategories = await fs.readdir(guidesDir);

  for (const guideCategory of guideCategories) {
    const categoryPath = path.join(guidesDir, guideCategory);
    const stat = await fs.stat(categoryPath);

    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(categoryPath);
    const mdxFiles = files.filter((f) => f.endsWith('.mdx'));

    for (const file of mdxFiles) {
      const filePath = path.join(categoryPath, file);
      stats.total++;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

        if (!frontmatterMatch) {
          stats.skipped++;
          continue;
        }

        const frontmatter: { title?: string; seoTitle?: string } = {};
        const lines = frontmatterMatch[1].split('\n');

        for (const line of lines) {
          const titleMatch = line.match(/^title:\s*["'](.+)["']/);
          const seoTitleMatch = line.match(/^seoTitle:\s*["'](.+)["']/);
          if (titleMatch) frontmatter.title = titleMatch[1];
          if (seoTitleMatch) frontmatter.seoTitle = seoTitleMatch[1];
        }

        const item: ContentItem = {
          title: frontmatter.title || file.replace('.mdx', ''),
          seoTitle: frontmatter.seoTitle,
          slug: file.replace('.mdx', ''),
          tags: [], // Guides typically don't have tags in frontmatter
          category: 'guides',
        };

        const result = enhanceTitle(item, 'guides' as ContentCategory);

        if (result.enhanced && result.enhancedTitle) {
          if (DRY_RUN) {
            logger.info(`[DRY RUN] ${file}:`);
            logger.info(`  ${result.originalTitle} → ${result.enhancedTitle}`);
            logger.info(
              `  Strategy: ${result.strategy}, Gain: +${result.gain} chars (${result.finalLength} total)`
            );
          } else {
            await updateMdxFile(filePath, result.enhancedTitle);
            logger.success(`✅ ${file}: ${result.originalTitle} → ${result.enhancedTitle}`);
          }
          stats.enhanced++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        logger.error(
          `Failed to process ${file}:`,
          error instanceof Error ? error : new Error(String(error))
        );
        stats.failed++;
      }
    }
  }

  return stats;
}

/**
 * Main optimization function
 */
async function main(): Promise<void> {
  const contentDir = path.join(process.cwd(), 'content');

  logger.progress('SEO Title Optimization');
  if (DRY_RUN) {
    logger.log('DRY RUN MODE - No files will be modified');
  }

  const categories: ContentCategory[] = [
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'collections',
  ];

  const allStats: OptimizationStats = {
    total: 0,
    enhanced: 0,
    skipped: 0,
    failed: 0,
  };

  // Optimize each category
  for (const category of categories) {
    logger.progress(`Processing ${category}...`);
    const stats = await optimizeJsonContent(category, contentDir);

    allStats.total += stats.total;
    allStats.enhanced += stats.enhanced;
    allStats.skipped += stats.skipped;
    allStats.failed += stats.failed;

    if (stats.total > 0) {
      logger.log(`${category} processed`, {
        total: stats.total,
        enhanced: stats.enhanced,
        skipped: stats.skipped,
        failed: stats.failed,
      });
    }
  }

  // Optimize guides
  logger.progress('Processing guides...');
  const guideStats = await optimizeGuides(contentDir);
  allStats.total += guideStats.total;
  allStats.enhanced += guideStats.enhanced;
  allStats.skipped += guideStats.skipped;
  allStats.failed += guideStats.failed;

  if (guideStats.total > 0) {
    logger.log('Guides processed', {
      total: guideStats.total,
      enhanced: guideStats.enhanced,
      skipped: guideStats.skipped,
      failed: guideStats.failed,
    });
  }

  // Final summary
  logger.log('Optimization Summary', {
    total_files: allStats.total,
    enhanced: allStats.enhanced,
    enhancement_percentage: `${((allStats.enhanced / allStats.total) * 100).toFixed(1)}%`,
    skipped: allStats.skipped,
    failed: allStats.failed,
  });

  if (DRY_RUN) {
    logger.log('Run without --dry-run to apply changes');
  } else {
    logger.success('Optimization complete! Run `npm run validate:titles` to verify.');
  }
}

main().catch((error: unknown) => {
  logger.failure(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
