'use server';

/**
 * Content Actions - Database-First Architecture
 * Collections, reviews, posts with PostgreSQL RPC functions for business logic.
 */

import { optionalAuthAction, rateLimitedAction } from './safe-action.ts';
import { z } from 'zod';
import type { DisplayableContent } from '../types/component.types.ts';
import { content_categorySchema } from '../prisma-zod-schemas.ts';

const getReviewsSchema = z.object({
  content_type: content_categorySchema,
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
    const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');

    const data = await getReviewsWithStatsData({
      contentType: parsedInput.content_type,
      contentSlug: parsedInput.content_slug,
      sortBy: parsedInput.sort_by,
      limit: parsedInput.limit,
      offset: parsedInput.offset,
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
  category: content_categorySchema
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
    
    // Type assertion: ContentPaginatedSlimItem[] is structurally compatible with DisplayableContent[]
    // DisplayableContent is a union type that includes EnrichedContentItem and other content types.
    // ContentPaginatedSlimItem has all required fields (slug, title, category, etc.) that DisplayableContent
    // expects, but TypeScript can't verify the structural compatibility without the assertion.
    // This is safe because ContentPaginatedSlimItem is a subset of DisplayableContent's requirements.
    return data.items as DisplayableContent[];
  });

// Removed all collection and review actions - migrated to generated actions
