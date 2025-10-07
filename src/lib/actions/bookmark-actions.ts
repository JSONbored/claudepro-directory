'use server';

/**
 * Bookmark Actions
 * Server actions for managing user bookmarks
 *
 * Follows existing pattern from email-capture.ts and track-view.ts
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
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
    .transform((val) => val.toLowerCase().trim()),
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
  .action(async ({ parsedInput: { content_type, content_slug, notes } }) => {
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

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    return {
      success: true,
      bookmark: data,
    };
  });

/**
 * Remove a bookmark
 */
export const removeBookmark = rateLimitedAction
  .metadata({
    actionName: 'removeBookmark',
    category: 'user',
  })
  .schema(
    z.object({
      content_type: contentCategorySchema,
      content_slug: nonEmptyString,
    })
  )
  .action(async ({ parsedInput: { content_type, content_slug } }) => {
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
