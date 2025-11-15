'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Json } from '@/src/types/database.types';

export interface SimilarItem {
  slug: string;
  title: string;
  description?: string;
  category: string;
  score?: number;
  tags?: string[];
  similarity_factors?: Json;
  calculated_at?: string;
  url?: string;
}

export interface SimilarContentResult {
  similar_items: SimilarItem[];
  source_item: {
    slug: string;
    category: string;
  };
  algorithm_version?: string;
}

export async function getSimilarContent(input: {
  contentType: string;
  contentSlug: string;
  limit?: number;
}): Promise<SimilarContentResult | null> {
  const { contentType, contentSlug, limit = 6 } = input;

  return fetchCachedRpc<SimilarContentResult | null>(
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
