import 'server-only';

import { type content_category } from '@prisma/client';
import {
  type GetContentAnalyticsReturns,
  type GetContentDetailCompleteReturns,
} from '@heyclaude/database-types/postgres-types';

import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

import { createDataFunction } from '../cached-data-factory.ts';

// Re-export types for direct imports

export type ContentDetailData = GetContentDetailCompleteReturns;

/**
 * Get content detail complete data
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getContentDetailComplete = createDataFunction<
  { category: string; slug: string },
  GetContentDetailCompleteReturns
>({
  methodName: 'getContentDetailComplete',
  module: 'data/content/detail',
  operation: 'getContentDetailComplete',
  serviceKey: 'content',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
});

/**
 * Get content detail core data
 * Simple data fetching function - pages control caching with 'use cache' directive
 * NOTE: This function uses GetContentDetailCompleteReturns since GetContentDetailCore was removed
 */
export const getContentDetailCore = createDataFunction<
  { category: string; slug: string },
  GetContentDetailCompleteReturns
>({
  methodName: 'getContentDetailCore',
  module: 'data/content/detail',
  operation: 'getContentDetailCore',
  serviceKey: 'content',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
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
  methodName: 'getContentAnalytics',
  module: 'data/content/detail',
  operation: 'getContentAnalytics',
  serviceKey: 'content',
  transformArgs: (args) => ({
    p_category: args.category as content_category,
    p_slug: args.slug,
  }),
  validate: (args) => isValidCategory(args.category),
  validateError: 'Invalid category',
});

export {
  type GetContentAnalyticsReturns,
  type GetContentDetailCompleteReturns,
} from '@heyclaude/database-types/postgres-types';

// Re-export GetContentDetailCoreReturns as alias for GetContentDetailCompleteReturns
export type GetContentDetailCoreReturns = GetContentDetailCompleteReturns;
