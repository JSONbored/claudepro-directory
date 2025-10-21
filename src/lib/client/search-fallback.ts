/**
 * Search Fallback Module
 *
 * Extracted from search.ts for Web Worker fallback scenario.
 * This module provides the main-thread search when Web Workers aren't available.
 *
 * CONSOLIDATION NOTE:
 * - This is NOT duplication - it's a strategic split for progressive enhancement
 * - Worker uses /public/workers/search.worker.js (different runtime context)
 * - This fallback uses the same algorithm but in ES module format
 * - Shared via hook's conditional loading (useSearchWorker)
 *
 * @module lib/client/search-fallback
 */

import { UI_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import type { SearchableItem } from '@/src/lib/schemas/search.schema';

// Lazy-load fuzzysort module
let fuzzysortModule: typeof import('fuzzysort') | null = null;

async function loadFuzzysort() {
  if (!fuzzysortModule) {
    try {
      fuzzysortModule = await import('fuzzysort');
      logger.info('Fuzzysort module loaded successfully (fallback)');
    } catch (error) {
      logger.error(
        'Failed to load fuzzysort module',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
  return fuzzysortModule;
}

// Prepared items cache for performance
const preparedCache = new WeakMap<object, PreparedItem>();

interface PreparedItem {
  item: SearchableItem;
  titlePrepared: Fuzzysort.Prepared | undefined;
  namePrepared: Fuzzysort.Prepared | undefined;
  descriptionPrepared: Fuzzysort.Prepared | undefined;
  tagsPrepared: Fuzzysort.Prepared | undefined;
  categoryPrepared: Fuzzysort.Prepared | undefined;
}

/**
 * Prepare items for fast searching
 * Uses WeakMap for automatic garbage collection
 */
async function prepareItems<T extends SearchableItem>(items: T[]): Promise<PreparedItem[]> {
  const fuzzysort = await loadFuzzysort();

  return items.map((item) => {
    // Check cache first
    const cached = preparedCache.get(item);
    if (cached) {
      return cached;
    }

    // Prepare all searchable fields
    const prepared: PreparedItem = {
      item,
      titlePrepared: item.title ? fuzzysort.prepare(item.title) : undefined,
      namePrepared: item.name ? fuzzysort.prepare(item.name) : undefined,
      descriptionPrepared: item.description ? fuzzysort.prepare(item.description) : undefined,
      tagsPrepared: item.tags?.length ? fuzzysort.prepare(item.tags.join(' ')) : undefined,
      categoryPrepared: item.category ? fuzzysort.prepare(item.category) : undefined,
    };

    // Cache for future use
    preparedCache.set(item, prepared);

    return prepared;
  });
}

/**
 * Convert Fuse.js threshold to Fuzzysort threshold
 * Fuse.js: 0.0 (exact) to 1.0 (match anything)
 * Fuzzysort: -Infinity (strict) to 0 (permissive)
 */
function convertThreshold(fuseThreshold: number): number {
  if (fuseThreshold === 0) return Number.NEGATIVE_INFINITY;
  if (fuseThreshold >= 1) return 0;
  return -10000 * (1 - fuseThreshold);
}

/**
 * Search with Fuzzysort - Main thread fallback
 *
 * @param items - Array of searchable items
 * @param query - Search query string
 * @param options - Search options (Fuse.js compatible)
 * @returns Array of matching items sorted by relevance
 */
export async function searchWithFuzzysort<T extends SearchableItem>(
  items: T[],
  query: string,
  options?: {
    threshold?: number;
    limit?: number;
  }
): Promise<T[]> {
  const fuzzysort = await loadFuzzysort();

  // Handle empty query - return all items
  if (!query.trim()) {
    return items;
  }

  // Prepare items for searching
  const prepared = await prepareItems(items);

  // Convert Fuse.js threshold to Fuzzysort threshold
  const threshold = options?.threshold !== undefined ? convertThreshold(options.threshold) : -10000;

  // Build search targets
  const targets = [
    'titlePrepared',
    'namePrepared',
    'descriptionPrepared',
    'tagsPrepared',
    'categoryPrepared',
  ];

  try {
    // Perform multi-field search
    const results = fuzzysort.go(query, prepared, {
      keys: targets,
      threshold,
      limit: options?.limit ?? UI_CONFIG.pagination.maxLimit,
      all: false,
    });

    // Extract items from results
    return results.map((result: Fuzzysort.KeysResult<PreparedItem>) => result.obj.item as T);
  } catch (error) {
    logger.error(
      'Fuzzysort search failed',
      error instanceof Error ? error : new Error(String(error)),
      { query, itemCount: items.length }
    );

    // Fallback to simple filtering
    const queryLower = query.toLowerCase();
    return items.filter((item) => {
      const searchText = [
        item.title || '',
        item.name || '',
        item.description || '',
        ...(item.tags || []),
        item.category || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(queryLower);
    });
  }
}
