'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../../build-time.ts';
import { getCacheTtl } from '../../cache-config.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { createSupabaseAnonClient } from '../../supabase/server-anon.ts';
import { generateRequestId } from '../../utils/request-id.ts';
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
 */
export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_complete']['Returns'] | null> {
  'use cache';
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getContentDetailComplete',
      module: 'data/content/detail',
    });
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentDetailComplete'
    );
    reqLogger.error('Invalid category in getContentDetailComplete', normalized, {
      category,
      slug,
    });
    return null;
  }

  // Configure cache - category and slug are automatically part of cache key
  const ttl = getCacheTtl('cache.content_detail.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentDetailComplete',
    module: 'data/content/detail',
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

    reqLogger.info('getContentDetailComplete: fetched successfully', {
      category,
      slug,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetailComplete failed');
    reqLogger.error('getContentDetailComplete failed', normalized, {
      category,
      slug,
    });
    return null;
  }
}

/**
 * Get content detail core data
 *
 * Uses 'use cache' to cache content detail data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 */
export async function getContentDetailCore(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_core']['Returns'] | null> {
  'use cache';
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getContentDetailCore',
      module: 'data/content/detail',
    });
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentDetailCore'
    );
    reqLogger.error('Invalid category in getContentDetailCore', normalized, {
      category,
      slug,
    });
    return null;
  }

  // Configure cache - category and slug are automatically part of cache key
  const ttl = getCacheTtl('cache.content_detail.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentDetailCore',
    module: 'data/content/detail',
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

    reqLogger.info('getContentDetailCore: fetched successfully', {
      category,
      slug,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetailCore failed');
    reqLogger.error('getContentDetailCore failed', normalized, {
      category,
      slug,
    });
    return null;
  }
}

/**
 * Get content analytics data
 *
 * Uses 'use cache' to cache content analytics data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 */
export async function getContentAnalytics(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_analytics']['Returns'] | null> {
  'use cache';
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getContentAnalytics',
      module: 'data/content/detail',
    });
    const normalized = normalizeError(
      'Invalid category',
      'Invalid category in getContentAnalytics'
    );
    reqLogger.error('Invalid category in getContentAnalytics', normalized, {
      category,
      slug,
    });
    return null;
  }

  // Configure cache - category and slug are automatically part of cache key
  const ttl = getCacheTtl('cache.content_detail.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentAnalytics',
    module: 'data/content/detail',
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

    reqLogger.info('getContentAnalytics: fetched successfully', {
      category,
      slug,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentAnalytics failed');
    reqLogger.error('getContentAnalytics failed', normalized, {
      category,
      slug,
    });
    return null;
  }
}
