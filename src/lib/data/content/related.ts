/**
 * Related Content Data Layer - Database-First Architecture
 * Uses get_related_content() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import type { Database } from '@/src/types/database.types';

export interface RelatedContentInput {
  currentPath: string;
  currentCategory: string;
  currentTags?: string[];
  currentKeywords?: string[];
  featured?: boolean;
  limit?: number;
  exclude?: string[];
}

export interface RelatedContentResult {
  items: Database['public']['Functions']['get_related_content']['Returns'];
}

/**
 * Get related content via edge-cached RPC
 */
export async function getRelatedContent(input: RelatedContentInput): Promise<RelatedContentResult> {
  const currentSlug = input.currentPath.split('/').pop() || '';

  const data = await fetchCachedRpc<
    'get_related_content',
    Database['public']['Functions']['get_related_content']['Returns']
  >(
    {
      p_category: input.currentCategory,
      p_slug: currentSlug,
      p_tags: input.currentTags || [],
      p_limit: input.limit || 3,
      p_exclude_slugs: input.exclude || [],
    },
    {
      rpcName: 'get_related_content',
      tags: generateContentTags(input.currentCategory, null, ['related-content']),
      ttlKey: 'cache.related_content.ttl_seconds',
      keySuffix: generateContentCacheKey(input.currentCategory, currentSlug, input.limit || 3),
      useAuthClient: false,
      fallback: [],
      logMeta: { category: input.currentCategory, slug: currentSlug },
    }
  );

  // Filter out invalid items (handle nullable fields from composite type)
  const validItems = data.filter((item) => Boolean(item.title && item.slug && item.category));

  return {
    items: validItems,
  };
}
