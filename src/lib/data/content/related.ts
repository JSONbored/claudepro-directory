/**
 * Related Content Data Layer - Database-First Architecture
 * Uses get_related_content() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import type { ContentCategory, GetRelatedContentReturn } from '@/src/types/database-overrides';

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
  items: GetRelatedContentReturn;
}

/**
 * Get related content via edge-cached RPC
 */
export async function getRelatedContent(input: RelatedContentInput): Promise<RelatedContentResult> {
  const currentSlug = input.currentPath.split('/').pop() || '';

  const data = await fetchCachedRpc<'get_related_content', GetRelatedContentReturn>(
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

  // RPC returns GetRelatedContentReturn directly (already properly typed)
  // Filter and return valid items, ensuring category is valid ContentCategory
  const validItems = data
    .filter((item) => item.title && item.slug && item.category)
    .map((item) => ({
      ...item,
      category: item.category as ContentCategory, // Database returns string, cast to ContentCategory
    }));

  return {
    items: validItems as GetRelatedContentReturn,
  };
}
