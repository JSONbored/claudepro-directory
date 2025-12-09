'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { generateContentTags } from '../content-helpers.ts';

interface PaginatedContentParameters {
  category?: null | string;
  limit: number;
  offset: number;
}

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function toContentCategory(
  value: null | string | undefined
): Database['public']['Enums']['content_category'] | undefined {
  if (!value) return undefined;
  const lowered = value.trim().toLowerCase();
  return CONTENT_CATEGORY_VALUES.includes(
    lowered as Database['public']['Enums']['content_category']
  )
    ? (lowered as Database['public']['Enums']['content_category'])
    : undefined;
}

/**
 * Get paginated content
 * Uses 'use cache' to cache paginated content lists. This data is public and same for all users.
 * @param root0
 * @param root0.category
 * @param root0.limit
 * @param root0.offset
 */
export async function getPaginatedContent({
  category,
  limit,
  offset,
}: PaginatedContentParameters): Promise<
  Database['public']['Functions']['get_content_paginated_slim']['Returns'] | null
> {
  'use cache';

  const normalizedCategory = category ? toContentCategory(category) : undefined;

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');

  // Configure cache - use 'static' profile for paginated content (changes daily)
  cacheLife('static'); // 1 day stale, 6 hours revalidate, 30 days expire
  const tags = generateContentTags(normalizedCategory ?? null, null, ['content-paginated']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    operation: 'getPaginatedContent',
    module: 'data/content/paginated',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const rpcArgs = {
      ...(normalizedCategory ? { p_category: normalizedCategory } : {}),
      p_limit: limit,
      p_offset: offset,
    };

    reqLogger.info('getPaginatedContent: calling RPC get_content_paginated_slim', {
      category: normalizedCategory ?? category ?? 'all',
      limit,
      offset,
      rpcArgs,
    });

    const result = await new ContentService(client).getContentPaginatedSlim(rpcArgs);

    reqLogger.info('getPaginatedContent: RPC call completed', {
      category: normalizedCategory ?? category ?? 'all',
      limit,
      offset,
      hasResult: Boolean(result),
      hasItems: Boolean(result?.items),
      itemsLength: Array.isArray(result?.items) ? result.items.length : 0,
      hasPagination: Boolean(result?.pagination),
      paginationTotal: result?.pagination?.total_count ?? null,
      resultKeys: result ? Object.keys(result) : [],
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error('getPaginatedContent: failed', errorForLogging, {
      category: normalizedCategory ?? category ?? 'all',
      limit,
      offset,
    });
    return null;
  }
}
