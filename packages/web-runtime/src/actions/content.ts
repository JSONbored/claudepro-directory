'use server';

/**
 * Content Actions - Database-First Architecture
 * Collections, reviews, posts with PostgreSQL RPC functions for business logic.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { optionalAuthAction, rateLimitedAction } from './safe-action.ts';
// Lazy loaded to avoid server-only side effects
// import { getPaginatedContent as getPaginatedContentData } from '../data/content/paginated.ts';
// import { getReviewsWithStatsData } from '../data/content/reviews.ts';
import { z } from 'zod';
import type { DisplayableContent } from '../types/component.types.ts';

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

const getReviewsSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
    Database['public']['Enums']['content_category'],
    ...Database['public']['Enums']['content_category'][],
  ]),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  sort_by: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Get reviews with aggregate stats - OPTIMIZED
 * Uses single RPC call instead of separate getReviews + getAggregateRating
 * Replaces 2 queries with 1
 */
export const getReviewsWithStats = optionalAuthAction
  .metadata({
    actionName: 'getReviewsWithStats',
    category: 'content',
  })
  .inputSchema(getReviewsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug, sort_by, limit, offset } = parsedInput;

    const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');

    const data = await getReviewsWithStatsData({
      contentType: content_type,
      contentSlug: content_slug,
      sortBy: sort_by,
      limit,
      offset,
      ...(ctx.userId ? { userId: ctx.userId } : {}),
    });

    if (!data) {
      throw new Error('Failed to fetch reviews. Please try again.');
    }

    return data;
  });

// ============================================
// CONTENT FETCHING ACTIONS
// ============================================

const fetchPaginatedContentSchema = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(30),
  category: z
    .enum([...CONTENT_CATEGORY_VALUES] as [
      Database['public']['Enums']['content_category'],
      ...Database['public']['Enums']['content_category'][],
    ])
    .nullable()
    .default(null),
});

/**
 * Fetch paginated content via cached RPC (get_content_paginated_slim)
 * Public action - no authentication required
 */
export const fetchPaginatedContent = rateLimitedAction
  .inputSchema(fetchPaginatedContentSchema)
  .metadata({ actionName: 'content.fetchPaginatedContent', category: 'content' })
  .action(async ({ parsedInput }) => {
    try {
      const { getPaginatedContent: getPaginatedContentData } = await import('../data/content/paginated.ts');

      const data = await getPaginatedContentData({
        category: parsedInput.category,
        limit: parsedInput.limit,
        offset: parsedInput.offset,
      });

      // get_content_paginated_slim returns content_paginated_slim_result composite type
      if (!data?.items) {
        return [];
      }
      // Return items directly - they are already properly typed as content_paginated_slim_item[]
      return data.items as DisplayableContent[];
    } catch {
      // Fallback to empty array on error (safe-action middleware handles logging)
      return [];
    }
  });

// Removed all collection and review actions - migrated to generated actions
