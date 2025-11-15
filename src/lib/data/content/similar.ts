'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetSimilarContentReturn } from '@/src/types/database-overrides';

/**
 * SimilarContentResult type alias for backward compatibility
 * @deprecated Use GetSimilarContentReturn instead
 */
export type SimilarContentResult = GetSimilarContentReturn;

export async function getSimilarContent(input: {
  contentType: string;
  contentSlug: string;
  limit?: number;
}): Promise<GetSimilarContentReturn | null> {
  const { contentType, contentSlug, limit = 6 } = input;

  return fetchCachedRpc<GetSimilarContentReturn | null>(
    {
      p_content_type: contentType,
      p_content_slug: contentSlug,
      p_limit: limit,
    },
    {
      rpcName: 'get_similar_content',
      tags: ['content', 'similar', `content-${contentSlug}`],
      ttlKey: 'cache.content_detail.ttl_seconds',
      keySuffix: `${contentType}-${contentSlug}-${limit}`,
      fallback: null,
      logMeta: { contentType, contentSlug, limit },
    }
  );
}
