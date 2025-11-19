'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import type { Database } from '@/src/types/database.types';

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
  return fetchCachedRpc<
    'get_content_paginated_slim',
    Database['public']['Functions']['get_content_paginated_slim']['Returns'] | null
  >(
    {
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
      p_offset: offset,
    },
    {
      rpcName: 'get_content_paginated_slim',
      tags: generateContentTags(category, null, ['content-paginated']),
      ttlKey: 'cache.content_paginated.ttl_seconds',
      keySuffix: generateContentCacheKey(category, null, limit, offset),
      fallback: null,
      logMeta: { category: category ?? 'all', limit, offset },
    }
  );
}
