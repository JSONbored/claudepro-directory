/**
 * Collection Items Actions - Consolidated
 * 
 * All collection item operations (add, remove, reorder) in one file.
 * Uses next-safe-action directly with factory helpers for business logic.
 */

'use server';

// Removed unused ManageCollectionReturns import
import { manageCollectionReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/manage_collection';
import { reorderCollectionItemsReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/reorder_collection_items';
import { z } from 'zod';
import { content_categorySchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action';

// Add item schema
const addItemToCollectionSchema = z.object({
  collection_id: z.string().uuid().nullable().optional(),
  content_type: content_categorySchema.nullable().optional(),
  content_slug: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  order: z.number().nullable().optional(),
});

// Remove item schema
const removeItemFromCollectionSchema = z.object({
  remove_item_id: z.string().uuid().optional(),
});

// Reorder items schema
const reorderCollectionItemsSchema = z.object({
  collection_id: z.string().uuid(),
  items: z.array(z.any()),
});

// Add item to collection
export const addItemToCollection = authedAction
  .inputSchema(addItemToCollectionSchema)
  .outputSchema(manageCollectionReturnsSchema)
  .metadata({ actionName: 'addItemToCollection', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof manageCollectionReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_action': 'add_item',
      'p_user_id': ctx.userId,
      'p_create_data': null,
      'p_update_data': null,
      'p_delete_id': null,
      'p_add_item_data': {
        'collection_id': parsedInput.collection_id,
        'content_type': parsedInput.content_type,
        'content_slug': parsedInput.content_slug,
        'notes': parsedInput.notes,
        'order': parsedInput.order,
      },
      'p_remove_item_id': null,
    };
    
    const result = await runRpc<z.infer<typeof manageCollectionReturnsSchema>>(
      'manage_collection',
      args,
      {
        action: 'addItemToCollection.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account/library');
    if (result?.collection?.slug) {
      revalidatePath(`/account/library/${result.collection.slug}`);
    }
    revalidateTag('collections', 'default');
    revalidateTag('users', 'default');
    
    return result;
  });

// Remove item from collection
export const removeItemFromCollection = authedAction
  .inputSchema(removeItemFromCollectionSchema)
  .outputSchema(manageCollectionReturnsSchema)
  .metadata({ actionName: 'removeItemFromCollection', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof manageCollectionReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_action': 'remove_item',
      'p_user_id': ctx.userId,
      'p_create_data': null,
      'p_update_data': null,
      'p_delete_id': null,
      'p_add_item_data': null,
      'p_remove_item_id': parsedInput.remove_item_id,
    };
    
    const result = await runRpc<z.infer<typeof manageCollectionReturnsSchema>>(
      'manage_collection',
      args,
      {
        action: 'removeItemFromCollection.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account/library');
    if (result?.collection?.slug) {
      revalidatePath(`/account/library/${result.collection.slug}`);
    }
    revalidateTag('collections', 'default');
    revalidateTag('users', 'default');
    
    return result;
  });

// Reorder collection items
export const reorderCollectionItems = authedAction
  .inputSchema(reorderCollectionItemsSchema)
  .outputSchema(reorderCollectionItemsReturnsSchema)
  .metadata({ actionName: 'reorderCollectionItems', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof reorderCollectionItemsReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');
    
    const args = {
      'p_collection_id': parsedInput.collection_id,
      'p_user_id': ctx.userId,
      'p_items': parsedInput.items,
    };
    
    const result = await runRpc<z.infer<typeof reorderCollectionItemsReturnsSchema>>(
      'reorder_collection_items',
      args,
      {
        action: 'reorderCollectionItems.rpc',
        userId: ctx.userId,
      }
    );
    
    // Cache invalidation
    revalidatePath('/account/library');
    revalidateTag('collections', 'default');
    revalidateTag('users', 'default');
    
    return result;
  });
