'use server';

/**
 * Post Actions (Community Board)
 * Server actions for creating, voting, and managing posts
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to PostRepository, VoteRepository, and CommentRepository.
 *
 * Similar to Hacker News - users can post links, text, or both
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { commentRepository } from '@/src/lib/repositories/comment.repository';
import { postRepository } from '@/src/lib/repositories/post.repository';
import { voteRepository } from '@/src/lib/repositories/vote.repository';
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

    // Check for duplicate URL submissions via repository (includes caching)
    if (url) {
      const existingResult = await postRepository.findByUrl(url);
      if (existingResult.success && existingResult.data) {
        throw new Error('This URL has already been submitted');
      }
    }

    // Create via repository (includes caching and automatic error handling)
    const result = await postRepository.create({
      user_id: user.id,
      title,
      content: content || null,
      url: url || null,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create post');
    }

    revalidatePath('/board');

    return {
      success: true,
      post: result.data,
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

    // Update via repository with ownership verification (includes caching)
    const result = await postRepository.updateByOwner(id, user.id, {
      ...(title && { title }),
      ...(content !== undefined && { content }),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to update post');
    }

    revalidatePath('/board');

    return {
      success: true,
      post: result.data,
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

    // Delete via repository with ownership verification (includes cache invalidation)
    const result = await postRepository.deleteByOwner(id, user.id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete post');
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
      // Add vote via repository (includes duplicate detection)
      const result = await voteRepository.create({
        user_id: user.id,
        post_id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to vote');
      }
    } else {
      // Remove vote via repository (includes cache invalidation)
      const result = await voteRepository.deleteByUserAndPost(user.id, post_id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove vote');
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

    // Create via repository (includes caching and automatic error handling)
    const result = await commentRepository.create({
      user_id: user.id,
      post_id,
      content,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create comment');
    }

    revalidatePath('/board');

    return {
      success: true,
      comment: result.data,
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

    // Delete via repository with ownership verification (includes cache invalidation)
    const result = await commentRepository.deleteByOwner(id, user.id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete comment');
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });
