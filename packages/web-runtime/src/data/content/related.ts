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

  const { getCacheTtl } = await import('../../cache-config.ts');
  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache
  const ttl = getCacheTtl('cache.related_content.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  const tags = generateContentTags(category, null, ['related-content']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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

    reqLogger.info('getRelatedContent: fetched successfully', {
      category,
      slug: currentSlug,
      count: items.length,
    });

    return {
      items,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getRelatedContent: failed', errorForLogging, {
      category,
      slug: currentSlug,
    });
    return {
      items: [],
    };
  }
}
