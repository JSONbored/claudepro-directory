'use server';

import { ContentService } from '@heyclaude/data-layer';
import type { ContentPaginatedSlimResult } from '@heyclaude/database-types/postgres-types';
import type { content_category } from '@heyclaude/data-layer/prisma';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateContentTags } from '../content-helpers.ts';

interface PaginatedContentParameters {
  category?: null | string;
  limit: number;
  offset: number;
}

// Prisma enum values for validation
const CONTENT_CATEGORY_VALUES: readonly content_category[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

function toContentCategory(value: null | string | undefined): content_category | undefined {
  if (!value) return undefined;
  const lowered = value.trim().toLowerCase();
  // Type guard: Check if lowered is a valid content_category
  // Use proper type guard with explicit check
  for (const validCategory of CONTENT_CATEGORY_VALUES) {
    if (lowered === validCategory) {
      return validCategory;
    }
  }
  return undefined;
}

/**
 * Get paginated content.
 * Uses 'use cache' to cache paginated content lists. This data is public and same for all users.
 *
 * @param params - Pagination and category filter parameters
 * @param params.category - Optional category filter (null, string, or undefined)
 * @param params.limit - Maximum number of results to return
 * @param params.offset - Number of results to skip
 * @returns Promise resolving to paginated content result or null
 */
export async function getPaginatedContent({
  category,
  limit,
  offset,
}: PaginatedContentParameters): Promise<ContentPaginatedSlimResult | null> {
  'use cache';

  const normalizedCategory = category ? toContentCategory(category) : undefined;

  // Configure cache - use 'static' profile for paginated content (changes daily)
  cacheLife('static'); // 1 day stale, 6 hours revalidate, 30 days expire
  const tags = generateContentTags(normalizedCategory ?? null, null, ['content-paginated']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/paginated',
    operation: 'getPaginatedContent',
  });

  try {
    const rpcArgs = {
      ...(normalizedCategory ? { p_category: normalizedCategory } : {}),
      p_limit: limit,
      p_offset: offset,
    };

    reqLogger.info(
      { category: normalizedCategory ?? category ?? 'all', limit, offset, rpcArgs },
      'getPaginatedContent: calling RPC get_content_paginated_slim'
    );

    const service = new ContentService();
    const result = await service.getContentPaginatedSlim(rpcArgs);

    reqLogger.info(
      {
        category: normalizedCategory ?? category ?? 'all',
        hasItems: Boolean(result?.items),
        hasPagination: Boolean(result?.pagination),
        hasResult: Boolean(result),
        itemsLength: Array.isArray(result?.items) ? result.items.length : 0,
        limit,
        offset,
        paginationTotal: result?.pagination?.total_count ?? null,
        resultKeys: result ? Object.keys(result) : [],
      },
      'getPaginatedContent: RPC call completed'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getPaginatedContent failed');
    reqLogger.error(
      { category: normalizedCategory ?? category ?? 'all', err: normalized, limit, offset },
      'getPaginatedContent: failed'
    );
    return null;
  }
}
