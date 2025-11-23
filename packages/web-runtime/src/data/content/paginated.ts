'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { ContentService } from '@heyclaude/data-layer';
import { generateContentCacheKey, generateContentTags } from '../content-helpers.ts';

interface PaginatedContentParams {
  category?: string | null;
  limit: number;
  offset: number;
}

export async function getPaginatedContent({
  category,
  limit,
  offset,
}: PaginatedContentParams): Promise<
  Database['public']['Functions']['get_content_paginated_slim']['Returns'] | null
> {
  return fetchCached(
    (client) => new ContentService(client).getContentPaginatedSlim(category ?? null, limit, offset),
    {
      key: generateContentCacheKey(category, null, limit, offset),
      tags: generateContentTags(category, null, ['content-paginated']),
      ttlKey: 'cache.content_paginated.ttl_seconds',
      fallback: null,
      logMeta: { category: category ?? 'all', limit, offset },
    }
  );
}
