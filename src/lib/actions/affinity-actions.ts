'use server';

/**
 * Affinity Score Actions
 * Server actions for calculating and retrieving user affinity scores
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * Database operations delegated to UserAffinityRepository and UserInteractionRepository.
 *
 * Features:
 * - Calculate affinity scores from interaction history
 * - Fetch top affinities for personalization
 * - Batch processing for performance
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import {
  calculateUserAffinities,
  validateAffinityScore,
} from '@/src/lib/personalization/affinity-scorer';
import { userAffinityRepository } from '@/src/lib/repositories/user-affinity.repository';
import { userInteractionRepository } from '@/src/lib/repositories/user-interaction.repository';
import {
  type AffinityScore,
  type UserAffinitiesResponse,
  userAffinitiesResponseSchema,
} from '@/src/lib/schemas/personalization.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Get user's top affinity scores
 * Cached for performance (5 minute TTL)
 */
export const getUserAffinities = rateLimitedAction
  .metadata({
    actionName: 'getUserAffinities',
    category: 'user',
  })
  .schema(
    z.object({
      limit: z.number().int().positive().max(100).default(50),
      min_score: z.number().min(0).max(100).default(10),
    })
  )
  .outputSchema(userAffinitiesResponseSchema)
  .action(async ({ parsedInput }: { parsedInput: { limit: number; min_score: number } }) => {
    const { limit, min_score } = parsedInput;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view affinities');
    }

    // Fetch via repository (includes 5-minute caching automatically)
    const result = await userAffinityRepository.findByUser(user.id, {
      minScore: min_score,
      limit,
      sortBy: 'affinity_score',
      sortOrder: 'desc',
    });

    if (!result.success) {
      logger.error('Failed to fetch user affinities', undefined, { error: result.error ?? '' });
      throw new Error('Failed to fetch affinities');
    }

    const affinities = result.data || [];

    const response: UserAffinitiesResponse = {
      affinities: affinities as AffinityScore[],
      total_count: affinities.length,
      last_calculated: affinities[0]?.calculated_at || new Date().toISOString(),
    };

    return response;
  });

/**
 * Calculate and update affinity scores for current user
 * This is an expensive operation and should be called sparingly
 * (typically via cron job or after significant interaction events)
 */
export const calculateUserAffinitiesAction = rateLimitedAction
  .metadata({
    actionName: 'calculateUserAffinities',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // Very limited - expensive operation
      windowSeconds: 3600, // Per hour
    },
  })
  .schema(z.void())
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to calculate affinities');
    }

    try {
      // Fetch all user interactions via repository (includes caching)
      const interactionsResult = await userInteractionRepository.findByUser(user.id, {
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      if (!interactionsResult.success) {
        throw new Error(
          `Failed to fetch interactions: ${interactionsResult.error || 'Unknown error'}`
        );
      }

      const interactions = interactionsResult.data || [];

      if (interactions.length === 0) {
        return {
          success: true,
          message: 'No interactions found',
          affinities_calculated: 0,
        };
      }

      // Group interactions by content item
      const interactionsByContent = new Map<
        string,
        {
          content_type: string;
          content_slug: string;
          interactions: Array<{
            interaction_type: string;
            metadata: Record<string, unknown>;
            created_at: string;
          }>;
        }
      >();

      for (const interaction of interactions) {
        const key = `${interaction.content_type}:${interaction.content_slug}`;
        if (!interactionsByContent.has(key)) {
          interactionsByContent.set(key, {
            content_type: interaction.content_type,
            content_slug: interaction.content_slug,
            interactions: [],
          });
        }
        const contentData = interactionsByContent.get(key);
        if (contentData) {
          contentData.interactions.push({
            interaction_type: interaction.interaction_type,
            metadata: interaction.metadata as Record<string, unknown>,
            created_at: interaction.created_at,
          });
        }
      }

      // Calculate affinities
      const affinities = calculateUserAffinities(interactionsByContent);

      // Upsert to database via repository
      const upsertPromises = affinities.map(async (affinity) => {
        if (!validateAffinityScore(affinity.affinity_score)) {
          logger.warn('Invalid affinity score calculated', undefined, {
            content_type: affinity.content_type,
            content_slug: affinity.content_slug,
            score: affinity.affinity_score,
          });
          return;
        }

        const result = await userAffinityRepository.upsert(
          user.id,
          affinity.content_type,
          affinity.content_slug,
          affinity.affinity_score,
          affinity.breakdown as Record<string, unknown>
        );

        if (!result.success) {
          logger.error('Failed to upsert affinity', undefined, {
            content_type: affinity.content_type,
            content_slug: affinity.content_slug,
            error: result.error ?? '',
          });
        }
      });

      await Promise.all(upsertPromises);

      logger.info('User affinities calculated', {
        user_id: user.id,
        affinities_count: affinities.length,
        total_interactions: interactions.length,
      });

      return {
        success: true,
        message: 'Affinities calculated successfully',
        affinities_calculated: affinities.length,
      };
    } catch (error) {
      logger.error(
        'Failed to calculate user affinities',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to calculate affinities');
    }
  });

/**
 * Get affinity score for a specific content item
 * Used for displaying personalization info to users
 */
export async function getContentAffinity(
  contentType: string,
  contentSlug: string
): Promise<number | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch via repository (includes caching)
  const result = await userAffinityRepository.findByUserAndContent(
    user.id,
    contentType,
    contentSlug
  );

  if (!(result.success && result.data)) {
    return null;
  }

  return result.data.affinity_score;
}

/**
 * Get user's favorite categories based on affinity scores
 * Returns top 3 categories by average affinity
 */
export async function getUserFavoriteCategories(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch via repository (includes caching)
  const result = await userAffinityRepository.findByUser(user.id, {
    minScore: 30, // Only meaningful affinities
  });

  if (!result.success) {
    return [];
  }

  const data = result.data || [];

  if (data.length === 0) {
    return [];
  }

  // Calculate average affinity per category
  const categoryScores = new Map<string, { sum: number; count: number }>();

  for (const item of data) {
    if (!categoryScores.has(item.content_type)) {
      categoryScores.set(item.content_type, { sum: 0, count: 0 });
    }
    const scores = categoryScores.get(item.content_type);
    if (scores) {
      scores.sum += item.affinity_score;
      scores.count += 1;
    }
  }

  // Sort by average score
  const sortedCategories = Array.from(categoryScores.entries())
    .map(([category, scores]) => ({
      category,
      avgScore: scores.sum / scores.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
    .map((item) => item.category);

  return sortedCategories;
}
