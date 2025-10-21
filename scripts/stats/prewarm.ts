#!/usr/bin/env tsx

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { prewarmStatsCache } from '../../src/lib/cache.server.js';
import { getAllCategoryIds } from '../../src/lib/config/category-config.js';
import { logger } from '../../src/lib/logger.js';

const PROJECT_ROOT = resolve(import.meta.dirname ?? '.', '..', '..');

async function loadTopSlugs(): Promise<Array<{ category: string; slug: string }>> {
  const filePath = resolve(PROJECT_ROOT, '.reports', 'homepage-top-slugs.json');
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed: Array<{ category: string; slug: string }> = JSON.parse(raw);
    return parsed;
  } catch (error) {
    logger.warn('No prewarm slugs report found, falling back to registry defaults', {
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    const categories = getAllCategoryIds();
    return categories.map((category) => ({ category, slug: `${category}-featured` }));
  }
}

async function main() {
  const items = await loadTopSlugs();
  if (!items.length) {
    logger.info('No items provided for stats prewarm, skipping');
    return;
  }

  const result = await prewarmStatsCache(items);
  if (result.success) {
    logger.info('Stats prewarm finished successfully', result);
  } else {
    logger.warn('Stats prewarm finished with warnings', result);
  }
}

main().catch((error) => {
  logger.error(
    'Stats prewarm script failed',
    error instanceof Error ? error : new Error(String(error))
  );
  process.exit(1);
});
