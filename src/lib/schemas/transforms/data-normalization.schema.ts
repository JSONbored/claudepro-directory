/**
 * Client input transform schemas - database validates, this only normalizes.
 */

import { z } from 'zod';
import {
  publicBookmarksInsertSchema,
  publicCollectionItemsInsertSchema,
  publicPostsUpdateSchema,
  publicReviewRatingsInsertSchema,
  publicUserCollectionsInsertSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import {
  normalizeString,
  trimOptionalString,
  trimString,
} from '@/src/lib/schemas/primitives/sanitization-transforms';

export const bookmarkInsertTransformSchema = publicBookmarksInsertSchema
  .omit({ user_id: true, id: true, created_at: true })
  .extend({
    content_slug: z.string().transform(normalizeString),
    notes: z.string().optional().transform(trimOptionalString),
  });

export const removeBookmarkSchema = z.object({
  content_type: z.string(),
  content_slug: z.string(),
});

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

export const collectionItemInsertTransformSchema = publicCollectionItemsInsertSchema
  .omit({ user_id: true, id: true, added_at: true })
  .extend({
    content_slug: z.string().transform(normalizeString),
    notes: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val?.trim() ?? null),
  });

export const reorderItemsSchema = z.object({
  collection_id: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    })
  ),
});

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

export const reviewUpdateInputSchema = reviewInsertTransformSchema.partial().extend({
  review_id: z.string().uuid(),
});

export const reviewDeleteSchema = z.object({
  review_id: z.string().uuid(),
});

export const helpfulVoteSchema = z.object({
  review_id: z.string().uuid(),
  helpful: z.boolean(),
});

export const getReviewsSchema = z.object({
  content_type: z.string(),
  content_slug: z.string(),
  sort_by: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const createPostSchema = z
  .object({
    title: z.string(),
    content: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .refine((data) => data.content || data.url, {
    message: 'Post must have either content or a URL',
  });

export const updatePostSchema = publicPostsUpdateSchema.extend({
  id: z.string().uuid(),
});

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
