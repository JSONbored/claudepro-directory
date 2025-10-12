'use server';

/**
 * Collection Actions
 * Server actions for managing user collections
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to CollectionRepository.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { collectionRepository } from '@/src/lib/repositories/collection.repository';
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
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
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
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
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

    // Create collection via repository
    const result = await collectionRepository.create({
      user_id: user.id,
      name,
      slug: slug ?? name.toLowerCase().replace(/\s+/g, '-'),
      description: description ?? null,
      is_public,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      item_count: 0,
      bookmark_count: 0,
      view_count: 0,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create collection');
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    if (result.data?.is_public) {
      revalidatePath('/u/[slug]', 'page');
    }

    return {
      success: true,
      collection: result.data,
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

    // Verify ownership (RLS will enforce, but check early for better UX)
    const existingResult = await collectionRepository.findById(id);
    if (!(existingResult.success && existingResult.data)) {
      throw new Error('Collection not found or you do not have permission to update it');
    }

    if (existingResult.data.user_id !== user.id) {
      throw new Error('You do not have permission to update this collection');
    }

    // Build update object conditionally to avoid exactOptionalPropertyTypes issues
    const updateData: {
      name: string;
      slug?: string;
      description: string | null;
      is_public: boolean;
    } = {
      name,
      description: description ?? null,
      is_public,
    };

    if (slug !== undefined) {
      updateData.slug = slug;
    }

    // Update collection via repository
    const result = await collectionRepository.update(id, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update collection');
    }

    // Revalidate relevant pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    // Ensure data exists before accessing properties
    if (!result.data) {
      throw new Error('Update succeeded but no data returned');
    }

    revalidatePath(`/account/library/${result.data.slug}`);
    if (result.data.is_public) {
      revalidatePath('/u/[slug]', 'page');
    }

    return {
      success: true,
      collection: result.data,
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

    // Verify ownership before deletion
    const existingResult = await collectionRepository.findById(id);
    if (!(existingResult.success && existingResult.data)) {
      throw new Error('Collection not found or you do not have permission to delete it');
    }

    if (existingResult.data.user_id !== user.id) {
      throw new Error('You do not have permission to delete this collection');
    }

    // Delete collection via repository (CASCADE will delete items)
    const result = await collectionRepository.delete(id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete collection');
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath('/u/[slug]', 'page');

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
    const collectionResult = await collectionRepository.findById(collection_id);
    if (!(collectionResult.success && collectionResult.data)) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collectionResult.data.user_id !== user.id) {
      throw new Error('You do not have permission to add items to this collection');
    }

    // Add item via repository (unique constraint prevents duplicates)
    const result = await collectionRepository.addItem({
      collection_id,
      user_id: user.id,
      content_type,
      content_slug,
      notes: notes || null,
      order,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to add item to collection');
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
      item: result.data,
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

    // Verify collection ownership
    const collectionResult = await collectionRepository.findById(collection_id);
    if (!(collectionResult.success && collectionResult.data)) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collectionResult.data.user_id !== user.id) {
      throw new Error('You do not have permission to remove items from this collection');
    }

    // Remove item via repository
    const result = await collectionRepository.removeItem(id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to remove item from collection');
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

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
    const collectionResult = await collectionRepository.findById(collection_id);
    if (!(collectionResult.success && collectionResult.data)) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collectionResult.data.user_id !== user.id) {
      throw new Error('You do not have permission to reorder items in this collection');
    }

    // OPTIMIZATION: Batch operation (N queries → batch operation)
    // Repository handles batch updates efficiently using Promise.all
    // Performance gain: Significant for collections with 10-50 items
    const result = await collectionRepository.reorderItems(collection_id, items);

    if (!result.success) {
      throw new Error(result.error || 'Failed to reorder collection items');
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

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

  const result = await collectionRepository.findByUser(user.id, {
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user collections');
  }

  return result.data || [];
}

/**
 * Get a specific collection with its items
 */
export async function getCollectionWithItems(collectionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get collection with items via repository (includes caching)
  const result = await collectionRepository.findByIdWithItems(collectionId);

  if (!(result.success && result.data)) {
    throw new Error(result.error || 'Collection not found');
  }

  return {
    ...result.data,
    isOwner: user?.id === result.data.user_id,
  };
}

/**
 * Get a public collection by user slug and collection slug
 */
export async function getPublicCollectionBySlug(userSlug: string, collectionSlug: string) {
  const supabase = await createClient();

  // First get the user (still needs direct query as users table has no repository yet)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('slug', userSlug)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  // Get collection by user and slug
  const collectionResult = await collectionRepository.findByUserAndSlug(
    userData.id,
    collectionSlug
  );

  if (!(collectionResult.success && collectionResult.data)) {
    throw new Error(collectionResult.error || 'Collection not found');
  }

  // Verify collection is public
  if (!collectionResult.data.is_public) {
    throw new Error('Collection not found');
  }

  // Get items
  const itemsResult = await collectionRepository.getItems(collectionResult.data.id, {
    sortBy: 'order',
    sortOrder: 'asc',
  });

  return {
    ...collectionResult.data,
    items: itemsResult.success ? itemsResult.data || [] : [],
  };
}
