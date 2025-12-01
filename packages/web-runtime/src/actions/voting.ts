'use server';

/**
 * Voting Actions
 *
 * Handles "I use this" voting for content items.
 * Supports both authenticated users and anonymous sessions.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { z } from 'zod';

import { logger, normalizeError } from '../entries/core.ts';
import { optionalAuthAction } from './safe-action.ts';

// Use enum values directly from @heyclaude/database-types Constants
// Exclude 'jobs' and 'changelog' from votable categories
const VOTABLE_CATEGORIES = Constants.public.Enums.content_category.filter(
  (cat) => cat !== 'jobs' && cat !== 'changelog'
) as [string, ...string[]];

const toggleContentVoteSchema = z.object({
  content_slug: z.string().min(1).max(200),
  content_type: z.enum(VOTABLE_CATEGORIES),
  session_id: z.string().optional(), // For anonymous users
});

export type ToggleContentVoteInput = z.infer<typeof toggleContentVoteSchema>;

export type ToggleContentVoteResult = {
  success: boolean;
  voted: boolean;
  newCount: number;
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
};

/**
 * Toggle "I use this" vote for a content item
 *
 * - Authenticated users: vote is linked to their user_id
 * - Anonymous users: vote is linked to their session_id
 *
 * @returns The new vote state and updated count
 */
export const toggleContentVote = optionalAuthAction
  .metadata({ actionName: 'toggleContentVote', category: 'content' })
  .schema(toggleContentVoteSchema)
  .action(async ({ parsedInput, ctx }): Promise<ToggleContentVoteResult> => {
    const { content_slug, content_type, session_id } = parsedInput;
    const userId = ctx.userId;

    // For anonymous users, session_id is required
    if (!userId && !session_id) {
      throw new Error('Session ID required for anonymous voting');
    }

    try {
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const supabase = await createSupabaseServerClient();

      // Build RPC args - only include defined optional params
      const rpcArgs: {
        p_content_slug: string;
        p_content_type: Database['public']['Enums']['content_category'];
        p_user_id?: string;
        p_session_id?: string;
      } = {
        p_content_slug: content_slug,
        p_content_type: content_type as Database['public']['Enums']['content_category'],
      };

      if (userId) {
        rpcArgs.p_user_id = userId;
      } else if (session_id) {
        rpcArgs.p_session_id = session_id;
      }

      const { data, error } = await supabase.rpc('toggle_content_vote', rpcArgs);

      if (error) {
        const normalized = normalizeError(error, 'Failed to toggle vote');
        logger.error('toggleContentVote RPC failed', normalized, {
          contentSlug: content_slug,
          contentType: content_type,
          hasUserId: Boolean(userId),
          hasSessionId: Boolean(session_id),
        });
        throw normalized;
      }

      const result = data as Database['public']['CompositeTypes']['toggle_content_vote_result'];

      if (!result?.success) {
        throw new Error('Vote toggle failed - content may not exist');
      }

      return {
        success: true,
        voted: result.voted ?? false,
        newCount: result.new_count ?? 0,
        contentSlug: result.content_slug ?? content_slug,
        contentType: (result.content_type ??
          content_type) as Database['public']['Enums']['content_category'],
      };
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to toggle content vote');
      logger.error('toggleContentVote failed', normalized, {
        contentSlug: content_slug,
        contentType: content_type,
      });
      throw normalized;
    }
  });

const getContentVoteSchema = z.object({
  content_slug: z.string().min(1).max(200),
  content_type: z.enum(VOTABLE_CATEGORIES),
  session_id: z.string().optional(),
});

/**
 * Check if user/session has voted on content
 */
export const getContentVote = optionalAuthAction
  .metadata({ actionName: 'getContentVote', category: 'content' })
  .schema(getContentVoteSchema)
  .action(async ({ parsedInput, ctx }): Promise<boolean> => {
    const { content_slug, content_type, session_id } = parsedInput;
    const userId = ctx.userId;

    // If no identifier, user hasn't voted
    if (!userId && !session_id) {
      return false;
    }

    try {
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const supabase = await createSupabaseServerClient();

      // Build RPC args - only include defined optional params
      const rpcArgs: {
        p_content_slug: string;
        p_content_type: Database['public']['Enums']['content_category'];
        p_user_id?: string;
        p_session_id?: string;
      } = {
        p_content_slug: content_slug,
        p_content_type: content_type as Database['public']['Enums']['content_category'],
      };

      if (userId) {
        rpcArgs.p_user_id = userId;
      } else if (session_id) {
        rpcArgs.p_session_id = session_id;
      }

      const { data, error } = await supabase.rpc('get_user_content_vote', rpcArgs);

      if (error) {
        logger.warn('getContentVote RPC failed', {
          error: error.message,
          contentSlug: content_slug,
          contentType: content_type,
        });
        return false;
      }

      return Boolean(data);
    } catch (error) {
      logger.warn('getContentVote failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentSlug: content_slug,
        contentType: content_type,
      });
      return false;
    }
  });
