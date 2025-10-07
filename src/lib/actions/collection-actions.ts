'use server';

/**
 * Collection Actions
 * Server actions for managing user collections
 *
 * Follows existing pattern from bookmark-actions.ts
 * Uses next-safe-action for type-safe server actions with validation
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { contentCategorySchema } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';

// =====================================================
// SCHEMAS
// =====================================================

/**
 * Collection creation/update schema
 */
const collectionSchema = z.object({
  name: nonEmptyString
    .min(2, 'Collection name must be at least 2 characters')
    .max(100, 'Collection name must be less than 100 characters')
    .transform((val: string) => val.trim()),
  slug: nonEmptyString
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform((val: string | undefined) => val?.trim()),
  is_public: z.boolean().default(false),
});

/**
 * Collection item schema
 */
const collectionItemSchema = z.object({
  collection_id: z.string().uuid('Invalid collection ID'),
  content_type: contentCategorySchema,
  content_slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val: string) => val.toLowerCase().trim()),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  order: z.number().int().min(0).default(0),
});

/**
 * Collection item reorder schema
 */
const reorderItemsSchema = z.object({
  collection_id: z.string().uuid('Invalid collection ID'),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// =====================================================
// COLLECTION CRUD ACTIONS
// =====================================================

/**
 * Create a new collection
 */
export const createCollection = rateLimitedAction
  .metadata({
    actionName: 'createCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 20,
      windowSeconds: 60,
    },
  })
  .schema(collectionSchema)
  .action(async ({ parsedInput }) => {
    const { name, slug, description, is_public } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to create collections');
    }

    // Insert collection (slug will be auto-generated if not provided)
    const { data, error } = await supabase
      .from('user_collections')
      .insert({
        user_id: user.id,
        name,
        slug: slug || undefined, // Let trigger generate if not provided
        description: description || null,
        is_public,
      })
      .select()
      .single();

    if (error) {
      // Check for duplicate slug
      if (error.code === '23505') {
        throw new Error('A collection with this slug already exists');
      }
      throw new Error(error.message);
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    if (data.is_public) {
      revalidatePath(`/u/[slug]`, 'page');
    }

    return {
      success: true,
      collection: data,
    };
  });

/**
 * Update an existing collection
 */
export const updateCollection = rateLimitedAction
  .metadata({
    actionName: 'updateCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 30,
      windowSeconds: 60,
    },
  })
  .schema(
    collectionSchema.extend({
      id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput }) => {
    const { id, name, slug, description, is_public } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to update collections');
    }

    // Update collection (RLS ensures user owns it)
    const { data, error } = await supabase
      .from('user_collections')
      .update({
        name,
        slug,
        description: description || null,
        is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A collection with this slug already exists');
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Collection not found or you do not have permission to update it');
    }

    // Revalidate relevant pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath(`/account/library/${data.slug}`);
    if (data.is_public) {
      revalidatePath(`/u/[slug]`, 'page');
    }

    return {
      success: true,
      collection: data,
    };
  });

/**
 * Delete a collection
 */
export const deleteCollection = rateLimitedAction
  .metadata({
    actionName: 'deleteCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 20,
      windowSeconds: 60,
    },
  })
  .schema(
    z.object({
      id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput }) => {
    const { id } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to delete collections');
    }

    // Delete collection (RLS ensures user owns it, CASCADE will delete items)
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath(`/u/[slug]`, 'page');

    return {
      success: true,
    };
  });

// =====================================================
// COLLECTION ITEM ACTIONS
// =====================================================

/**
 * Add an item to a collection
 */
export const addItemToCollection = rateLimitedAction
  .metadata({
    actionName: 'addItemToCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 50,
      windowSeconds: 60,
    },
  })
  .schema(collectionItemSchema)
  .action(async ({ parsedInput }) => {
    const { collection_id, content_type, content_slug, notes, order } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to add items to collections');
    }

    // Verify collection belongs to user
    const { data: collection } = await supabase
      .from('user_collections')
      .select('id')
      .eq('id', collection_id)
      .eq('user_id', user.id)
      .single();

    if (!collection) {
      throw new Error('Collection not found or you do not have permission');
    }

    // Insert item (unique constraint prevents duplicates)
    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id,
        user_id: user.id,
        content_type,
        content_slug,
        notes: notes || null,
        order,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This item is already in the collection');
      }
      throw new Error(error.message);
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath(`/account/library/[slug]`, 'page');
    revalidatePath(`/u/[slug]`, 'page');

    return {
      success: true,
      item: data,
    };
  });

/**
 * Remove an item from a collection
 */
export const removeItemFromCollection = rateLimitedAction
  .metadata({
    actionName: 'removeItemFromCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 50,
      windowSeconds: 60,
    },
  })
  .schema(
    z.object({
      id: z.string().uuid('Invalid item ID'),
      collection_id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput }) => {
    const { id, collection_id } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to remove items from collections');
    }

    // Delete item (RLS ensures user owns it)
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', id)
      .eq('collection_id', collection_id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath(`/account/library/[slug]`, 'page');
    revalidatePath(`/u/[slug]`, 'page');

    return {
      success: true,
    };
  });

/**
 * Reorder items in a collection
 */
export const reorderCollectionItems = rateLimitedAction
  .metadata({
    actionName: 'reorderCollectionItems',
    category: 'user',
    rateLimit: {
      maxRequests: 30,
      windowSeconds: 60,
    },
  })
  .schema(reorderItemsSchema)
  .action(async ({ parsedInput }) => {
    const { collection_id, items } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to reorder collection items');
    }

    // Verify collection belongs to user
    const { data: collection } = await supabase
      .from('user_collections')
      .select('id')
      .eq('id', collection_id)
      .eq('user_id', user.id)
      .single();

    if (!collection) {
      throw new Error('Collection not found or you do not have permission');
    }

    // Update order for each item
    // Note: This is not atomic, but acceptable for this use case
    // For production at scale, consider using a stored procedure
    for (const item of items) {
      await supabase
        .from('collection_items')
        .update({ order: item.order })
        .eq('id', item.id)
        .eq('collection_id', collection_id)
        .eq('user_id', user.id);
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath(`/account/library/[slug]`, 'page');
    revalidatePath(`/u/[slug]`, 'page');

    return {
      success: true,
    };
  });

// =====================================================
// QUERY HELPERS (Not rate-limited - read operations)
// =====================================================

/**
 * Get user's collections
 */
export async function getUserCollections() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get a specific collection with its items
 */
export async function getCollectionWithItems(collectionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get collection (RLS handles visibility)
  const { data: collection, error: collectionError } = await supabase
    .from('user_collections')
    .select('*')
    .eq('id', collectionId)
    .single();

  if (collectionError || !collection) {
    throw new Error('Collection not found');
  }

  // Get items
  const { data: items, error: itemsError } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('order', { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    ...collection,
    items: items || [],
    isOwner: user?.id === collection.user_id,
  };
}

/**
 * Get a public collection by user slug and collection slug
 */
export async function getPublicCollectionBySlug(userSlug: string, collectionSlug: string) {
  const supabase = await createClient();

  // First get the user
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('slug', userSlug)
    .single();

  if (!userData) {
    throw new Error('User not found');
  }

  // Get collection
  const { data: collection, error: collectionError } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userData.id)
    .eq('slug', collectionSlug)
    .eq('is_public', true)
    .single();

  if (collectionError || !collection) {
    throw new Error('Collection not found');
  }

  // Get items
  const { data: items } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collection.id)
    .order('order', { ascending: true });

  return {
    ...collection,
    items: items || [],
  };
}
