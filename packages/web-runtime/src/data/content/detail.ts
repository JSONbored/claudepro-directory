import 'server-only';

import { type content_category } from '@heyclaude/data-layer/prisma';
import {
  type GetContentAnalyticsReturns,
  type GetContentDetailCompleteReturns,
  type GetContentDetailCoreReturns,
} from '@heyclaude/database-types/postgres-types';

// Re-export types for direct imports
export type { GetContentAnalyticsReturns, GetContentDetailCompleteReturns, GetContentDetailCoreReturns };

import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

import { createDataFunction } from '../cached-data-factory.ts';

export type ContentDetailData = GetContentDetailCompleteReturns;

/**
 * Get content detail complete data
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getContentDetailComplete = createDataFunction<
  { category: string; slug: string },
  GetContentDetailCompleteReturns
>({
  serviceKey: 'content',
  methodName: 'getContentDetailComplete',
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
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getContentDetailCore = createDataFunction<
  { category: string; slug: string },
  GetContentDetailCoreReturns
>({
  serviceKey: 'content',
  methodName: 'getContentDetailCore',
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
export const getContentAnalytics = createDataFunction<
  { category: string; slug: string },
  GetContentAnalyticsReturns
>({
  serviceKey: 'content',
  methodName: 'getContentAnalytics',
  module: 'data/content/detail',
  operation: 'getContentAnalytics',
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
});
