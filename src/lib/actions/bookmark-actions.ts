'use server';

/**
 * Bookmark Actions
 * Server actions for managing user bookmarks
 *
 * Follows existing pattern from email-capture.ts and track-view.ts
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { contentCategorySchema } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';

// Bookmark schema
const bookmarkSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val: string) => val.toLowerCase().trim()),
  notes: z.string().max(500).optional(),
});

/**
 * Add a bookmark
 */
export const addBookmark = rateLimitedAction
  .metadata({
    actionName: 'addBookmark',
    category: 'user',
  })
  .schema(bookmarkSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof bookmarkSchema> }) => {
    const { content_type, content_slug, notes } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to bookmark content');
    }

    // Insert bookmark (unique constraint will prevent duplicates)
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        content_type,
        content_slug,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate (unique constraint violation)
      if (error.code === '23505') {
        throw new Error('You have already bookmarked this content');
      }
      throw new Error(error.message);
    }

    // Track interaction for personalization
    try {
      await supabase.from('user_interactions').insert({
        user_id: user.id,
        content_type,
        content_slug,
        interaction_type: 'bookmark',
        metadata: {},
      });
    } catch (_err) {
      // Non-critical - log but don't fail
      logger.warn('Failed to track bookmark interaction', undefined, {
        content_type,
        content_slug,
      });
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    // OPTIMIZATION: Invalidate personalization caches
    // User bookmarked content → For You feed should update recommendations
    revalidatePath('/for-you'); // Invalidates For You feed page

    return {
      success: true,
      bookmark: data,
    };
  });

/**
 * Remove a bookmark
 */
const removeBookmarkSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: nonEmptyString,
});

export const removeBookmark = rateLimitedAction
  .metadata({
    actionName: 'removeBookmark',
    category: 'user',
  })
  .schema(removeBookmarkSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof removeBookmarkSchema> }) => {
    const { content_type, content_slug } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to remove bookmarks');
    }

    // Delete bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('content_type', content_type)
      .eq('content_slug', content_slug);

    if (error) {
      throw new Error(error.message);
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    // OPTIMIZATION: Invalidate personalization caches
    // User removed bookmark → For You feed should update recommendations
    revalidateTag(`user-${user.id}`); // Invalidates getUserAffinities cache
    revalidatePath('/for-you'); // Invalidates For You feed page

    return {
      success: true,
    };
  });

/**
 * Check if content is bookmarked
 * Note: This is a server action for client components
 */
export async function isBookmarked(content_type: string, content_slug: string): Promise<boolean> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_type', content_type)
    .eq('content_slug', content_slug)
    .single();

  return !error && !!data;
}

/**
 * Add multiple bookmarks at once (bulk operation)
 * Useful for "save all recommendations" feature
 */
export const addBookmarkBatch = rateLimitedAction
  .metadata({
    actionName: 'addBookmarkBatch',
    category: 'user',
    rateLimit: {
      maxRequests: 10, // Limited to prevent abuse
      windowSeconds: 60,
    },
  })
  .schema(
    z.object({
      items: z
        .array(
          z.object({
            content_type: contentCategorySchema,
            content_slug: nonEmptyString,
          })
        )
        .min(1)
        .max(20), // Max 20 bookmarks at once
    })
  )
  .action(
    async ({
      parsedInput,
    }: {
      parsedInput: { items: Array<{ content_type: string; content_slug: string }> };
    }) => {
      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be signed in to bookmark content');
      }

      try {
        // Prepare batch insert
        const bookmarksToInsert = parsedInput.items.map((item) => ({
          user_id: user.id,
          content_type: item.content_type,
          content_slug: item.content_slug,
          notes: null,
        }));

        // Batch insert (will skip duplicates due to unique constraint)
        const { data, error } = await supabase
          .from('bookmarks')
          .upsert(bookmarksToInsert, {
            onConflict: 'user_id,content_type,content_slug',
            ignoreDuplicates: true,
          })
          .select();

        if (error) {
          logger.error('Failed to batch bookmark', error);
          throw new Error('Failed to save bookmarks');
        }

        // Track interactions for each bookmark (non-blocking)
        const interactionPromises = parsedInput.items.map((item) =>
          supabase
            .from('user_interactions')
            .insert({
              user_id: user.id,
              content_type: item.content_type,
              content_slug: item.content_slug,
              interaction_type: 'bookmark',
              metadata: { source: 'bulk_save' },
            })
            .then(({ error: intError }) => {
              if (intError) {
                logger.warn('Failed to track batch bookmark interaction', undefined, {
                  content_type: item.content_type,
                  content_slug: item.content_slug,
                });
              }
            })
        );

        // Fire and forget interaction tracking
        Promise.all(interactionPromises).catch(() => {
          // Non-critical
        });

        // Revalidate pages
        revalidatePath('/account');
        revalidatePath('/account/library');

        // OPTIMIZATION: Invalidate personalization caches
        // Bulk bookmark operation → For You feed should update recommendations
        revalidateTag(`user-${user.id}`); // Invalidates getUserAffinities cache
        revalidatePath('/for-you'); // Invalidates For You feed page

        return {
          success: true,
          saved_count: data?.length || 0,
          total_requested: parsedInput.items.length,
        };
      } catch (error) {
        logger.error(
          'Batch bookmark failed',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error('Failed to save bookmarks');
      }
    }
  );
