'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { ContentCategory } from '@heyclaude/data-layer/prisma';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateContentTags } from '../content-helpers.ts';

// Use Prisma-generated enum values directly - no manual arrays!
const CONTENT_CATEGORY_VALUES = Object.values(ContentCategory) as readonly content_category[];

function isValidContentCategory(value: string): value is content_category {
  return typeof value === 'string' && CONTENT_CATEGORY_VALUES.includes(value as content_category);
}

export interface RelatedContentInput {
  currentCategory: string;
  currentKeywords?: string[];
  currentPath: string;
  currentTags?: string[];
  exclude?: string[];
  featured?: boolean;
  limit?: number;
}

export interface RelatedContentResult {
  items: Database['public']['Functions']['get_related_content']['Returns'];
}

/**
 * Get related content
 * Uses 'use cache' to cache related content. This data is public and same for all users.
 * @param input
 */
export async function getRelatedContent(input: RelatedContentInput): Promise<RelatedContentResult> {
  'use cache';

  const currentSlug = input.currentPath.split('/').pop() ?? '';
  const category = input.currentCategory;

  if (!isValidContentCategory(category)) {
    return {
      items: [],
    };
  }

  // Configure cache - use 'hours' profile for related content (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, null, ['related-content']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/related',
    operation: 'getRelatedContent',
  });

  try {
    const service = new ContentService();
    const data = await service.getRelatedContent({
      p_category: category,
      p_exclude_slugs: input.exclude ?? [],
      p_limit: input.limit ?? 3,
      p_slug: currentSlug,
      p_tags: input.currentTags ?? [],
    });

    const items = data.filter((item) => Boolean(item.title && item.slug && item.category));

    reqLogger.info(
      { category, count: items.length, slug: currentSlug },
      'getRelatedContent: fetched successfully'
    );

    return {
      items,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getRelatedContent failed');
    reqLogger.error({ category, err: normalized, slug: currentSlug }, 'getRelatedContent: failed');
    return {
      items: [],
    };
  }
}
