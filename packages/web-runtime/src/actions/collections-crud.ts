/**
 * Collections CRUD Actions - Generated from single config
 *
 * Consolidated create/update/delete actions using createCrudActionHandlers factory.
 * Uses next-safe-action directly with factory helpers for business logic.
 * Eliminates ~200 lines of repetitive boilerplate.
 */

'use server';

import type { ManageCollectionReturns } from '@heyclaude/database-types/postgres-types';
import { z } from 'zod';
import { createCrudActionHandlers } from './action-factory';
import { authedAction } from './safe-action';

// Schemas
const createCollectionSchema = z.object({
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_public: z.boolean().nullable().optional(),
});

const updateCollectionSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_public: z.boolean().nullable().optional(),
});

const deleteCollectionSchema = z.object({
  delete_id: z.string().uuid().optional(),
});

// Generate CRUD action handlers
const crudHandlers = createCrudActionHandlers<
  z.infer<typeof createCollectionSchema>,
  z.infer<typeof updateCollectionSchema>,
  z.infer<typeof deleteCollectionSchema>,
  ManageCollectionReturns,
  ManageCollectionReturns,
  ManageCollectionReturns
>({
  resource: 'collection',
  category: 'user',
  schemas: {
    create: createCollectionSchema,
    update: updateCollectionSchema,
    delete: deleteCollectionSchema,
  },
  rpcs: {
    create: 'manage_collection',
    update: 'manage_collection',
    delete: 'manage_collection',
  },
  transformArgs: {
    create: (input, ctx) => ({
      p_action: 'create',
      p_user_id: ctx.userId,
      p_create_data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        is_public: input.is_public,
      },
      p_update_data: null,
      p_delete_id: null,
      p_add_item_data: null,
      p_remove_item_id: null,
    }),
    update: (input, ctx) => ({
      p_action: 'update',
      p_user_id: ctx.userId,
      p_create_data: null,
      p_update_data: {
        id: input.id,
        name: input.name,
        slug: input.slug,
        description: input.description,
        is_public: input.is_public,
      },
      p_delete_id: null,
      p_add_item_data: null,
      p_remove_item_id: null,
    }),
    delete: (input, ctx) => ({
      p_action: 'delete',
      p_user_id: ctx.userId,
      p_create_data: null,
      p_update_data: null,
      p_delete_id: input.delete_id,
      p_add_item_data: null,
      p_remove_item_id: null,
    }),
  },
  cacheInvalidation: {
    create: {
      paths: ['/account', '/account/library'],
      tags: () => ['collections', 'users'],
    },
    update: {
      paths: (_result) => {
        const r = _result as ManageCollectionReturns | undefined;
        return [
          '/account',
          '/account/library',
          ...(r?.collection?.slug ? [`/account/library/${r.collection.slug}`] : []),
        ];
      },
      tags: () => ['collections', 'users'],
    },
    delete: {
      paths: ['/account', '/account/library'],
      tags: () => ['collections', 'users'],
    },
  },
});

// Export actions using next-safe-action directly
export const createCollection = authedAction
  .inputSchema(createCollectionSchema)
  .metadata({ actionName: 'createCollection', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.create(parsedInput, ctx);
  });

export const updateCollection = authedAction
  .inputSchema(updateCollectionSchema)
  .metadata({ actionName: 'updateCollection', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.update(parsedInput, ctx);
  });

export const deleteCollection = authedAction
  .inputSchema(deleteCollectionSchema)
  .metadata({ actionName: 'deleteCollection', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.delete(parsedInput, ctx);
  });
