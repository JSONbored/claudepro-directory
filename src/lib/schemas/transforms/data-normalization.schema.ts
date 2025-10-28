/**
 * Data Normalization Transform Schemas
 *
 * Client-side input schemas with proper TypeScript inference.
 * Uses reusable transform functions from sanitization-transforms.ts.
 *
 * Architecture:
 * - Database constraints enforce validation (length, pattern, range)
 * - Generated schemas provide base types from database
 * - Transform functions normalize data (trim, toLowerCase)
 * - Server-only fields omitted (user_id, timestamps)
 *
 * Pattern: Database schema → Omit server fields → Add transforms → Client input schema
 *
 * @module lib/schemas/transforms/data-normalization
 */

import { z } from 'zod';
import {
  publicBookmarksInsertSchema,
  publicCollectionItemsInsertSchema,
  publicPostsUpdateSchema,
  publicReviewRatingsInsertSchema,
  publicUserCollectionsInsertSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import { nonEmptyString, urlString } from '@/src/lib/schemas/primitives';
import {
  normalizeString,
  trimOptionalString,
  trimString,
} from '@/src/lib/schemas/primitives/sanitization-transforms';

// ============================================================================
// Bookmark Schemas
// ============================================================================

/**
 * Bookmark insert (client-side input)
 * Server adds: user_id, id, created_at
 */
export const bookmarkInsertTransformSchema = publicBookmarksInsertSchema
  .omit({ user_id: true, id: true, created_at: true })
  .extend({
    content_slug: z.string().transform(normalizeString),
    notes: z.string().optional().transform(trimOptionalString),
  });

/**
 * Remove bookmark (query parameters)
 */
export const removeBookmarkSchema = z.object({
  content_type: z.string(),
  content_slug: z.string(),
});

// ============================================================================
// Collection Schemas
// ============================================================================

/**
 * Collection insert (client-side input)
 * Server adds: user_id, id, created_at, updated_at, counts
 */
export const collectionInsertTransformSchema = publicUserCollectionsInsertSchema
  .omit({
    user_id: true,
    id: true,
    created_at: true,
    updated_at: true,
    view_count: true,
    bookmark_count: true,
    item_count: true,
  })
  .extend({
    name: z.string().transform(trimString),
    slug: z.string().transform(normalizeString),
    description: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val?.trim() ?? null),
    is_public: z.boolean().default(false),
  });

/**
 * Collection item insert (client-side input)
 * Server adds: user_id, id, added_at
 */
export const collectionItemInsertTransformSchema = publicCollectionItemsInsertSchema
  .omit({ user_id: true, id: true, added_at: true })
  .extend({
    content_slug: z.string().transform(normalizeString),
    notes: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val?.trim() ?? null),
    order: z.number().int().min(0).default(0),
  });

/**
 * Reorder collection items
 */
export const reorderItemsSchema = z.object({
  collection_id: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// ============================================================================
// Review Schemas
// ============================================================================

/**
 * Review rating insert (client-side input)
 * Server adds: user_id, id, created_at, updated_at, helpful_count
 */
export const reviewInsertTransformSchema = publicReviewRatingsInsertSchema
  .omit({
    user_id: true,
    id: true,
    created_at: true,
    updated_at: true,
    helpful_count: true,
  })
  .extend({
    content_slug: z.string().transform(normalizeString),
    review_text: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val?.trim() ?? null),
  });

/**
 * Review update (partial, with ID for identification)
 */
export const reviewUpdateInputSchema = reviewInsertTransformSchema.partial().extend({
  review_id: z.string().uuid(),
});

/**
 * Review delete
 */
export const reviewDeleteSchema = z.object({
  review_id: z.string().uuid(),
});

/**
 * Helpful vote
 */
export const helpfulVoteSchema = z.object({
  review_id: z.string().uuid(),
  helpful: z.boolean(),
});

/**
 * Get reviews (query parameters)
 */
export const getReviewsSchema = z.object({
  content_type: z.string(),
  content_slug: z.string(),
  sort_by: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// Post Schemas
// ============================================================================

/**
 * Create post (client-side input)
 * Business rule: Must have either content or URL
 */
export const createPostSchema = z
  .object({
    title: nonEmptyString.min(3).max(300, 'Title must be less than 300 characters'),
    content: z
      .string()
      .max(5000, 'Content must be less than 5000 characters')
      .nullable()
      .optional(),
    url: urlString.nullable().optional(),
  })
  .refine((data) => data.content || data.url, {
    message: 'Post must have either content or a URL',
  });

/**
 * Update post (partial, with ID for identification)
 */
export const updatePostSchema = publicPostsUpdateSchema
  .extend({
    title: z.string().min(3).max(300).optional(),
    content: z.string().max(5000).nullable().optional(),
  })
  .extend({
    id: z.string().uuid(),
  });

// ============================================================================
// Type Exports
// ============================================================================

export type BookmarkInsertTransform = z.infer<typeof bookmarkInsertTransformSchema>;
export type RemoveBookmark = z.infer<typeof removeBookmarkSchema>;

export type CollectionInsertTransform = z.infer<typeof collectionInsertTransformSchema>;
export type CollectionItemInsertTransform = z.infer<typeof collectionItemInsertTransformSchema>;
export type ReorderItems = z.infer<typeof reorderItemsSchema>;

export type ReviewInsertTransform = z.infer<typeof reviewInsertTransformSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateInputSchema>;
export type ReviewDelete = z.infer<typeof reviewDeleteSchema>;
export type HelpfulVote = z.infer<typeof helpfulVoteSchema>;
export type GetReviews = z.infer<typeof getReviewsSchema>;

export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
