'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey } from '@/src/lib/data/helpers-utils';
import type { Database } from '@/src/types/database.types';
import type { GetGetSimilarContentReturn } from '@/src/types/database-overrides';

export async function getSimilarContent(input: {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  limit?: number;
}): Promise<GetGetSimilarContentReturn | null> {
  const { contentType, contentSlug, limit = 6 } = input;

  return fetchCachedRpc<'get_similar_content', GetGetSimilarContentReturn | null>(
    {
      p_content_type: contentType,
      p_content_slug: contentSlug,
      p_limit: limit,
    },
    {
      rpcName: 'get_similar_content',
      tags: ['content', 'similar', `content-${contentSlug}`],
      ttlKey: 'cache.content_detail.ttl_seconds',
      keySuffix: generateContentCacheKey(contentType, contentSlug, limit),
      fallback: null,
      logMeta: { contentType, contentSlug, limit },
    }
  );
}
