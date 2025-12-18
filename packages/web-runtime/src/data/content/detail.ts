'use server';

import { type content_category } from '@heyclaude/data-layer/prisma';
import {
  type GetContentAnalyticsReturns,
  type GetContentDetailCompleteReturns,
  type GetContentDetailCoreReturns,
} from '@heyclaude/database-types/postgres-types';

// Re-export types for direct imports
export type { GetContentAnalyticsReturns, GetContentDetailCompleteReturns, GetContentDetailCoreReturns };

import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

import { createCachedDataFunction, generateContentTags } from '../cached-data-factory.ts';

export type ContentDetailData = GetContentDetailCompleteReturns;

/**
 * Get content detail complete data
 *
 * Uses 'use cache' to cache content detail data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 */
export const getContentDetailComplete = createCachedDataFunction<
  { category: string; slug: string },
  GetContentDetailCompleteReturns
>({
  serviceKey: 'content',
  methodName: 'getContentDetailComplete',
  cacheMode: 'public',
  cacheLife: 'medium', // 1hr stale, 15min revalidate, 1 day expire - optimized for SEO
  cacheTags: (args) => generateContentTags(args.category, args.slug),
  module: 'data/content/detail',
  operation: 'getContentDetailComplete',
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
});

/**
 * Get content detail core data
 *
 * Uses 'use cache' to cache content detail data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 */
export const getContentDetailCore = createCachedDataFunction<
  { category: string; slug: string },
  GetContentDetailCoreReturns
>({
  serviceKey: 'content',
  methodName: 'getContentDetailCore',
  cacheMode: 'public',
  cacheLife: 'medium', // 1hr stale, 15min revalidate, 1 day expire - optimized for SEO
  cacheTags: (args) => generateContentTags(args.category, args.slug),
  module: 'data/content/detail',
  operation: 'getContentDetailCore',
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
});

/**
 * Get content analytics data
 *
 * Uses 'use cache' to cache content analytics data. Category and slug become part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 */
export const getContentAnalytics = createCachedDataFunction<
  { category: string; slug: string },
  GetContentAnalyticsReturns
>({
  serviceKey: 'content',
  methodName: 'getContentAnalytics',
  cacheMode: 'public',
  cacheLife: 'medium', // 1hr stale, 15min revalidate, 1 day expire - optimized for SEO
  cacheTags: (args) => generateContentTags(args.category, args.slug),
  module: 'data/content/detail',
  operation: 'getContentAnalytics',
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
});
