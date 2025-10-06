'use server';

/**
 * Post Actions (Community Board)
 * Server actions for creating, voting, and managing posts
 *
 * Similar to Hacker News - users can post links, text, or both
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { nonEmptyString, urlString } from '@/src/lib/schemas/primitives/base-strings';
import { createClient } from '@/src/lib/supabase/server';

// Post schema
const createPostSchema = z
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

const updatePostSchema = z.object({
  id: z.string().uuid(),
  title: nonEmptyString.min(3).max(300).optional(),
  content: z.string().max(5000).nullable().optional(),
});

/**
 * Create a new post
 */
export const createPost = rateLimitedAction
  .metadata({
    actionName: 'createPost',
    category: 'form',
  })
  .schema(createPostSchema)
  .action(async ({ parsedInput: { title, content, url } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to create posts');
    }

    // Check for duplicate URL submissions
    if (url) {
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('url', url)
        .limit(1)
        .single();

      if (existing) {
        throw new Error('This URL has already been submitted');
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title,
        content: content || null,
        url: url || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/board');

    return {
      success: true,
      post: data,
    };
  });

/**
 * Update a post (own posts only)
 */
export const updatePost = rateLimitedAction
  .metadata({
    actionName: 'updatePost',
    category: 'form',
  })
  .schema(updatePostSchema)
  .action(async ({ parsedInput: { id, title, content } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to edit posts');
    }

    const { data, error } = await supabase
      .from('posts')
      .update({
        ...(title && { title }),
        ...(content !== undefined && { content }),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/board');

    return {
      success: true,
      post: data,
    };
  });

/**
 * Delete a post (own posts only)
 */
export const deletePost = rateLimitedAction
  .metadata({
    actionName: 'deletePost',
    category: 'form',
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to delete posts');
    }

    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });

/**
 * Vote on a post (upvote/unvote toggle)
 */
export const votePost = rateLimitedAction
  .metadata({
    actionName: 'votePost',
    category: 'user',
  })
  .schema(
    z.object({
      post_id: z.string().uuid(),
      action: z.enum(['vote', 'unvote']),
    })
  )
  .action(async ({ parsedInput: { post_id, action } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to vote');
    }

    if (action === 'vote') {
      // Add vote
      const { error } = await supabase.from('votes').insert({
        user_id: user.id,
        post_id,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already voted on this post');
        }
        throw new Error(error.message);
      }
    } else {
      // Remove vote
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', post_id);

      if (error) {
        throw new Error(error.message);
      }
    }

    revalidatePath('/board');

    return {
      success: true,
      action,
    };
  });

/**
 * Create a comment on a post
 */
export const createComment = rateLimitedAction
  .metadata({
    actionName: 'createComment',
    category: 'form',
  })
  .schema(
    z.object({
      post_id: z.string().uuid(),
      content: nonEmptyString.min(1).max(2000, 'Comment must be less than 2000 characters'),
    })
  )
  .action(async ({ parsedInput: { post_id, content } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to comment');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/board');

    return {
      success: true,
      comment: data,
    };
  });

/**
 * Delete a comment (own comments only)
 */
export const deleteComment = rateLimitedAction
  .metadata({
    actionName: 'deleteComment',
    category: 'form',
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput: { id } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to delete comments');
    }

    const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });
