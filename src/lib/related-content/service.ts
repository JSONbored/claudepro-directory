/**
 * Related Content Service - Database-First Architecture
 * All scoring logic in PostgreSQL via get_related_content() RPC function.
 */

import { cache } from 'react';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
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

class RelatedContentService {
  getRelatedContent = cache(async (input: RelatedContentInput) => {
    const startTime = performance.now();
    const supabase = await createClient();
    const currentSlug = input.currentPath.split('/').pop() || '';

    const { data, error } = await supabase.rpc('get_related_content', {
      p_category: input.currentCategory,
      p_slug: currentSlug,
      p_tags: input.currentTags || [],
      p_limit: input.limit || 3,
      p_exclude_slugs: input.exclude || [],
    });

    if (error || !data) {
      logger.error('Failed to get related content', error);
      return {
        items: [],
        performance: {
          fetchTime: Math.round(performance.now() - startTime),
          cacheHit: false,
          itemCount: 0,
          algorithmVersion: 'v3.0.0-database-first',
        },
        algorithm: 'v3.0.0-database-first',
      };
    }

    type RelatedContentItem =
      Database['public']['Functions']['get_related_content']['Returns'][number];

    // Filter out items with missing required fields (database-first validation)
    const validItems = data.filter(
      (item: RelatedContentItem) => item.title && item.slug && item.category
    );

    return {
      items: validItems.map((item: RelatedContentItem) => ({
        category: item.category,
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
      performance: {
        fetchTime: Math.round(performance.now() - startTime),
        cacheHit: false,
        itemCount: validItems.length,
        algorithmVersion: 'v3.0.0-database-first',
      },
      algorithm: 'v3.0.0-database-first',
    };
  });
}

export const relatedContentService = new RelatedContentService();
