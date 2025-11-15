'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { DisplayableContent } from '@/src/lib/types/component.types';

interface PaginatedContentParams {
  category?: string | null;
  limit: number;
  offset: number;
}

interface PaginatedContentResponse {
  items?: DisplayableContent[];
  total_count?: number;
}

export async function getPaginatedContent({
  category,
  limit,
  offset,
}: PaginatedContentParams): Promise<PaginatedContentResponse | null> {
  return fetchCachedRpc<PaginatedContentResponse | null>(
    {
      p_category: category,
      p_limit: limit,
      p_offset: offset,
    },
    {
      rpcName: 'get_content_paginated_slim',
      tags: ['content', 'content-paginated', category ? `content-${category}` : 'content-all'],
      ttlKey: 'cache.content_paginated.ttl_seconds',
      keySuffix: `${category ?? 'all'}-${limit}-${offset}`,
      fallback: null,
      logMeta: { category: category ?? 'all', limit, offset },
    }
  );
}
