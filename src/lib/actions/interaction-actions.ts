'use server';

/**
 * User Interaction Tracking Actions
 * Server actions for tracking user interactions with content
 *
 * Follows patterns from:
 * - track-view.ts (analytics tracking)
 * - bookmark-actions.ts (user data management)
 */

import { revalidatePath } from 'next/cache';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import {
  trackInteractionSchema,
  type TrackInteractionInput,
} from '@/src/lib/schemas/personalization.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Track a user interaction with content
 *
 * Features:
 * - Rate limited: 200 requests per 60 seconds per IP (high volume for tracking)
 * - Automatic validation via Zod schema
 * - Anonymous users supported (user_id will be null)
 * - Type-safe with full inference
 *
 * Usage:
 * ```ts
 * await trackInteraction({
 *   content_type: 'agents',
 *   content_slug: 'my-agent',
 *   interaction_type: 'view',
 *   session_id: sessionId,
 *   metadata: { time_spent_seconds: 45 }
 * });
 * ```
 */
export const trackInteraction = rateLimitedAction
  .metadata({
    actionName: 'trackInteraction',
    category: 'analytics',
    rateLimit: {
      maxRequests: 200, // High volume for user tracking
      windowSeconds: 60,
    },
  })
  .schema(trackInteractionSchema)
  .action(async ({ parsedInput }: { parsedInput: TrackInteractionInput }) => {
    const supabase = await createClient();

    try {
      // Get current user (may be null for anonymous users)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Only track for authenticated users
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated - interaction not tracked',
        };
      }

      // Insert interaction
      const { error } = await supabase.from('user_interactions').insert({
        user_id: user.id,
        content_type: parsedInput.content_type,
        content_slug: parsedInput.content_slug,
        interaction_type: parsedInput.interaction_type,
        session_id: parsedInput.session_id || null,
        metadata: parsedInput.metadata || {},
      });

      if (error) {
        logger.error('Failed to track interaction', error, {
          content_type: parsedInput.content_type,
          content_slug: parsedInput.content_slug,
          interaction_type: parsedInput.interaction_type,
        });

        return {
          success: false,
          message: 'Failed to track interaction',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      logger.error(
        'Error in trackInteraction',
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        success: false,
        message: 'Failed to track interaction',
      };
    }
  });

/**
 * Get user's recent interactions
 * Useful for building user profiles and debugging
 */
export async function getUserRecentInteractions(limit = 20): Promise<TrackInteractionInput[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_interactions')
    .select('content_type, content_slug, interaction_type, session_id, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch user interactions', error);
    return [];
  }

  return data || [];
}

/**
 * Get interaction summary for a user (aggregate stats)
 * Used for building user profiles
 */
export async function getUserInteractionSummary(): Promise<{
  total_interactions: number;
  views: number;
  copies: number;
  bookmarks: number;
  unique_content_items: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      total_interactions: 0,
      views: 0,
      copies: 0,
      bookmarks: 0,
      unique_content_items: 0,
    };
  }

  try {
    // Get interaction counts by type
    const { data: interactions, error } = await supabase
      .from('user_interactions')
      .select('interaction_type, content_type, content_slug')
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to fetch interaction summary', error);
      return {
        total_interactions: 0,
        views: 0,
        copies: 0,
        bookmarks: 0,
        unique_content_items: 0,
      };
    }

    const views = interactions.filter((i) => i.interaction_type === 'view').length;
    const copies = interactions.filter((i) => i.interaction_type === 'copy').length;
    const bookmarks = interactions.filter((i) => i.interaction_type === 'bookmark').length;

    // Count unique content items
    const uniqueItems = new Set(
      interactions.map((i) => `${i.content_type}:${i.content_slug}`)
    ).size;

    return {
      total_interactions: interactions.length,
      views,
      copies,
      bookmarks,
      unique_content_items: uniqueItems,
    };
  } catch (error) {
    logger.error(
      'Error calculating interaction summary',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      total_interactions: 0,
      views: 0,
      copies: 0,
      bookmarks: 0,
      unique_content_items: 0,
    };
  }
}
