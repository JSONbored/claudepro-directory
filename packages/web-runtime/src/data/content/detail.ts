'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../../build-time.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { createSupabaseAnonClient } from '../../supabase/server-anon.ts';
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

export type ContentDetailData =
  Database['public']['Functions']['get_content_detail_complete']['Returns'];

/**
 * Get content detail complete data
 *
 * Uses 'use cache' to cache content detail data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 * @param input
 * @param input.category
 * @param input.slug
 */
export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_complete']['Returns'] | null> {
  'use cache';
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const reqLogger = logger.child({
      module: 'data/content/detail',
      operation: 'getContentDetailComplete',
    });
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentDetailComplete'
    );
    reqLogger.error(
      { category, err: normalized, slug },
      'Invalid category in getContentDetailComplete'
    );
    return null;
  }

  // Configure cache - use 'hours' profile for content detail (changes every 4 hours)
  // Category and slug are automatically part of cache key
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/detail',
    operation: 'getContentDetailComplete',
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

    const service = new ContentService(client);
    const result = await service.getContentDetailComplete({ p_category: category, p_slug: slug });

    reqLogger.info(
      { category, hasResult: Boolean(result), slug },
      'getContentDetailComplete: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetailComplete failed');
    reqLogger.error({ category, err: normalized, slug }, 'getContentDetailComplete failed');
    return null;
  }
}

/**
 * Get content detail core data
 *
 * Uses 'use cache' to cache content detail data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 * @param input
 * @param input.category
 * @param input.slug
 */
export async function getContentDetailCore(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_core']['Returns'] | null> {
  'use cache';
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const reqLogger = logger.child({
      module: 'data/content/detail',
      operation: 'getContentDetailCore',
    });
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentDetailCore'
    );
    reqLogger.error(
      { category, err: normalized, slug },
      'Invalid category in getContentDetailCore'
    );
    return null;
  }

  // Configure cache - use 'hours' profile for content detail core (changes every 4 hours)
  // Category and slug are automatically part of cache key
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/detail',
    operation: 'getContentDetailCore',
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

    const service = new ContentService(client);
    const result = await service.getContentDetailCore({ p_category: category, p_slug: slug });

    reqLogger.info(
      { category, hasResult: Boolean(result), slug },
      'getContentDetailCore: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetailCore failed');
    reqLogger.error({ category, err: normalized, slug }, 'getContentDetailCore failed');
    return null;
  }
}

/**
 * Get content analytics data
 *
 * Uses 'use cache' to cache content analytics data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 * @param input
 * @param input.category
 * @param input.slug
 */
export async function getContentAnalytics(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_analytics']['Returns'] | null> {
  'use cache';
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const reqLogger = logger.child({
      module: 'data/content/detail',
      operation: 'getContentAnalytics',
    });
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentAnalytics'
    );
    reqLogger.error({ category, err: normalized, slug }, 'Invalid category in getContentAnalytics');
    return null;
  }

  // Configure cache - use 'hours' profile for content analytics (changes every 4 hours)
  // Category and slug are automatically part of cache key
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/detail',
    operation: 'getContentAnalytics',
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

    const service = new ContentService(client);
    const result = await service.getContentAnalytics({ p_category: category, p_slug: slug });

    reqLogger.info(
      { category, hasResult: Boolean(result), slug },
      'getContentAnalytics: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentAnalytics failed');
    reqLogger.error({ category, err: normalized, slug }, 'getContentAnalytics failed');
    return null;
  }
}
