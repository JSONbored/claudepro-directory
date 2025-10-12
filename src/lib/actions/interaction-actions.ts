'use server';

/**
 * User Interaction Tracking Actions
 * Server actions for tracking user interactions with content
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to UserInteractionRepository.
 *
 * Follows patterns from:
 * - track-view.ts (analytics tracking)
 * - bookmark-actions.ts (user data management)
 */

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { userInteractionRepository } from '@/src/lib/repositories/user-interaction.repository';
import { sessionIdSchema, toContentId } from '@/src/lib/schemas/branded-types.schema';
import {
  type TrackInteractionInput,
  trackInteractionSchema,
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

      // Track interaction via repository
      const result = await userInteractionRepository.track(
        parsedInput.content_type,
        parsedInput.content_slug,
        parsedInput.interaction_type as
          | 'view'
          | 'click'
          | 'bookmark'
          | 'share'
          | 'download'
          | 'like'
          | 'upvote'
          | 'downvote',
        user.id,
        parsedInput.session_id || undefined,
        parsedInput.metadata || {}
      );

      if (!(result.success && result.data)) {
        logger.error('Failed to track interaction', undefined, {
          content_type: parsedInput.content_type,
          content_slug: parsedInput.content_slug,
          interaction_type: parsedInput.interaction_type,
          error: result.error ?? '',
        });

        return {
          success: false,
          message: result.error || 'Failed to track interaction',
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

  // Get interactions via repository (includes caching)
  const result = await userInteractionRepository.findByUser(user.id, {
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (!result.success) {
    logger.error('Failed to fetch user interactions', undefined, {
      error: result.error ?? '',
    });
    return [];
  }

  // Transform database results to match TrackInteractionInput type
  return (result.data || []).map((item) => ({
    content_type: item.content_type as TrackInteractionInput['content_type'],
    content_slug: toContentId(item.content_slug),
    interaction_type: item.interaction_type as TrackInteractionInput['interaction_type'],
    session_id: item.session_id ? sessionIdSchema.parse(item.session_id) : undefined,
    metadata:
      typeof item.metadata === 'object' && item.metadata !== null && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, string | number | boolean>)
        : {},
  }));
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
    // Get stats via repository (includes caching)
    const result = await userInteractionRepository.getStats({ userId: user.id });

    if (!(result.success && result.data)) {
      logger.error('Failed to fetch interaction summary', undefined, {
        error: result.error ?? '',
      });
      return {
        total_interactions: 0,
        views: 0,
        copies: 0,
        bookmarks: 0,
        unique_content_items: 0,
      };
    }

    const stats = result.data;

    return {
      total_interactions: stats.total_interactions,
      views: stats.by_type.view || 0,
      copies: stats.by_type.copy || 0,
      bookmarks: stats.by_type.bookmark || 0,
      unique_content_items: stats.unique_users, // Note: This is a misnomer in the response type
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
