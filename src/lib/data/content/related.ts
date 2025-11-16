/**
 * Related Content Data Layer - Database-First Architecture
 * Uses get_related_content() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import type { Database } from '@/src/types/database.types';
import type { ContentCategory, GetRelatedContentReturn } from '@/src/types/database-overrides';

type RelatedContentItem = Database['public']['Functions']['get_related_content']['Returns'][number];

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

  const data = await fetchCachedRpc<RelatedContentItem[]>(
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

  const validItems = data.filter((item) => item.title && item.slug && item.category);

  return {
    items: validItems.map((item): GetRelatedContentReturn[number] => ({
      category: item.category as ContentCategory,
      slug: item.slug,
      title: item.title,
      description: item.description || '',
      author: item.author || 'Community',
      date_added: item.date_added
        ? new Date(item.date_added).toISOString()
        : new Date().toISOString(),
      tags: item.tags || [],
      score: Number(item.score) || 0,
      match_type: item.match_type || 'same_category',
      views: Number(item.views) || 0,
      matched_tags: item.matched_tags || [],
    })),
  };
}
