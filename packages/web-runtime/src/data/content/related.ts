'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { generateContentTags } from '../content-helpers.ts';

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
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

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');

  // Configure cache - use 'hours' profile for related content (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, null, ['related-content']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    operation: 'getRelatedContent',
    module: 'data/content/related',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const data = await new ContentService(client).getRelatedContent({
      p_category: category,
      p_slug: currentSlug,
      p_tags: input.currentTags ?? [],
      p_limit: input.limit ?? 3,
      p_exclude_slugs: input.exclude ?? [],
    });

    const items = data.filter((item) => Boolean(item.title && item.slug && item.category));

    reqLogger.info(
      { category, slug: currentSlug, count: items.length },
      'getRelatedContent: fetched successfully'
    );

    return {
      items,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { err: errorForLogging, category, slug: currentSlug },
      'getRelatedContent: failed'
    );
    return {
      items: [],
    };
  }
}
