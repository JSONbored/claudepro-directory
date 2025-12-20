/**
 * Reviews CRUD Actions - Generated from single config
 *
 * Consolidated create/update/delete actions using createCrudActionHandlers factory.
 * Uses next-safe-action directly with factory helpers for business logic.
 * Eliminates ~200 lines of repetitive boilerplate.
 */

'use server';

import type { ManageReviewReturns } from '@heyclaude/database-types/postgres-types';
import { z } from 'zod';
import { content_categorySchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
import { createCrudActionHandlers } from './action-factory';
import { authedAction } from './safe-action';

// Schemas
const createReviewSchema = z.object({
  content_type: content_categorySchema.nullable().optional(),
  content_slug: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  review_text: z.string().nullable().optional(),
});

const updateReviewSchema = z.object({
  review_id: z.string().uuid().nullable().optional(),
  content_type: content_categorySchema.nullable().optional(),
  content_slug: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  review_text: z.string().nullable().optional(),
});

const deleteReviewSchema = z.object({
  delete_id: z.string().uuid().nullable().optional(),
});

// Generate CRUD action handlers
const crudHandlers = createCrudActionHandlers<
  z.infer<typeof createReviewSchema>,
  z.infer<typeof updateReviewSchema>,
  z.infer<typeof deleteReviewSchema>,
  ManageReviewReturns,
  ManageReviewReturns,
  ManageReviewReturns
>({
  resource: 'review',
  category: 'user',
  schemas: {
    create: createReviewSchema,
    update: updateReviewSchema,
    delete: deleteReviewSchema,
  },
  rpcs: {
    create: 'manage_review',
    update: 'manage_review',
    delete: 'manage_review',
  },
  transformArgs: {
    create: (input, ctx) => ({
      p_action: 'create',
      p_user_id: ctx.userId,
      p_create_data: {
        content_type: input.content_type,
        content_slug: input.content_slug,
        rating: input.rating,
        review_text: input.review_text,
      },
      p_update_data: null,
      p_delete_id: null,
    }),
    update: (input, ctx) => ({
      p_action: 'update',
      p_user_id: ctx.userId,
      p_create_data: null,
      p_update_data: {
        review_id: input.review_id,
        content_type: input.content_type,
        content_slug: input.content_slug,
        rating: input.rating,
        review_text: input.review_text,
      },
      p_delete_id: null,
    }),
    delete: (input, ctx) => ({
      p_action: 'delete',
      p_user_id: ctx.userId,
      p_create_data: null,
      p_update_data: null,
      p_delete_id: input.delete_id,
    }),
  },
  cacheInvalidation: {
    create: {
      paths: (result) => {
        const r = result as ManageReviewReturns | undefined;
        return [
          ...(r?.review?.content_type && r?.review?.content_slug
            ? [`/${r.review.content_type}/${r.review.content_slug}`, `/${r.review.content_type}`]
            : []),
        ];
      },
      tags: (result) => {
        const r = result as ManageReviewReturns | undefined;
        return [
          ...(r?.review?.content_type && r?.review?.content_slug
            ? [`reviews:${r.review.content_type}:${r.review.content_slug}`]
            : []),
          'content',
          'homepage',
          'trending',
        ];
      },
    },
    update: {
      paths: (result) => {
        const r = result as ManageReviewReturns | undefined;
        return [
          ...(r?.review?.content_type && r?.review?.content_slug
            ? [`/${r.review.content_type}/${r.review.content_slug}`, `/${r.review.content_type}`]
            : []),
        ];
      },
      tags: (result) => {
        const r = result as ManageReviewReturns | undefined;
        return [
          ...(r?.review?.content_type && r?.review?.content_slug
            ? [`reviews:${r.review.content_type}:${r.review.content_slug}`]
            : []),
          'content',
          'homepage',
          'trending',
        ];
      },
    },
    delete: {
      paths: [],
      tags: () => ['content', 'homepage', 'trending'],
    },
  },
});

// Export actions using next-safe-action directly
export const createReview = authedAction
  .inputSchema(createReviewSchema)
  .metadata({ actionName: 'createReview', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.create(parsedInput, ctx);
  });

export const updateReview = authedAction
  .inputSchema(updateReviewSchema)
  .metadata({ actionName: 'updateReview', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.update(parsedInput, ctx);
  });

export const deleteReview = authedAction
  .inputSchema(deleteReviewSchema)
  .metadata({ actionName: 'deleteReview', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.delete(parsedInput, ctx);
  });
