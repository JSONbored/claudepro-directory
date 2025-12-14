'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { ContentCategory } from '@heyclaude/data-layer/prisma';
import type {
  GetContentDetailCompleteReturns,
  GetContentDetailCoreReturns,
  GetContentAnalyticsReturns,
} from '@heyclaude/database-types/postgres-types/functions';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateContentTags } from '../content-helpers.ts';

// Use Prisma-generated enum values directly - no manual arrays!
const CONTENT_CATEGORY_VALUES = Object.values(ContentCategory) as readonly content_category[];

function isValidContentCategory(value: string): value is content_category {
  return typeof value === 'string' && CONTENT_CATEGORY_VALUES.includes(value as content_category);
}

export type ContentDetailData = GetContentDetailCompleteReturns;

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
}): Promise<GetContentDetailCompleteReturns | null> {
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
    const service = new ContentService();
    const result = await service.getContentDetailComplete({ 
      p_category: category as content_category, 
      p_slug: slug 
    });

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
}): Promise<GetContentDetailCoreReturns | null> {
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
    const service = new ContentService();
    const result = await service.getContentDetailCore({ 
      p_category: category as content_category, 
      p_slug: slug 
    });

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
}): Promise<GetContentAnalyticsReturns | null> {
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
    const service = new ContentService();
    const result = await service.getContentAnalytics({ 
      p_category: category as content_category, 
      p_slug: slug 
    });

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
