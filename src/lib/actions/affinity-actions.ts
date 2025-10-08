'use server';

/**
 * Affinity Score Actions
 * Server actions for calculating and retrieving user affinity scores
 *
 * Features:
 * - Calculate affinity scores from interaction history
 * - Fetch top affinities for personalization
 * - Batch processing for performance
 */

import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import {
  aggregateInteractions,
  calculateAffinityScore,
  calculateUserAffinities,
  validateAffinityScore,
} from '@/src/lib/personalization/affinity-scorer';
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
    category: 'personalization',
  })
  .schema(
    z.object({
      limit: z.number().int().positive().max(100).default(50),
      min_score: z.number().min(0).max(100).default(10),
    })
  )
  .outputSchema(userAffinitiesResponseSchema)
  .action(async ({ parsedInput: { limit, min_score } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view affinities');
    }

    // Use cached function with 5 minute revalidation
    const getCachedAffinities = unstable_cache(
      async (userId: string) => {
        const { data, error } = await supabase
          .from('user_affinities')
          .select('*')
          .eq('user_id', userId)
          .gte('affinity_score', min_score)
          .order('affinity_score', { ascending: false })
          .limit(limit);

        if (error) {
          logger.error('Failed to fetch user affinities', error);
          throw new Error('Failed to fetch affinities');
        }

        return data || [];
      },
      [`user-affinities-${user.id}-${limit}-${min_score}`],
      {
        revalidate: 300, // 5 minutes
        tags: ['affinities', `user-${user.id}`],
      }
    );

    const affinities = await getCachedAffinities(user.id);

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
    category: 'personalization',
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
      // Fetch all user interactions
      const { data: interactions, error } = await supabase
        .from('user_interactions')
        .select('content_type, content_slug, interaction_type, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch interactions: ${error.message}`);
      }

      if (!interactions || interactions.length === 0) {
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
        interactionsByContent.get(key)!.interactions.push({
          interaction_type: interaction.interaction_type,
          metadata: interaction.metadata as Record<string, unknown>,
          created_at: interaction.created_at,
        });
      }

      // Calculate affinities
      const affinities = calculateUserAffinities(interactionsByContent);

      // Upsert to database
      const upsertPromises = affinities.map((affinity) => {
        if (!validateAffinityScore(affinity.affinity_score)) {
          logger.warn('Invalid affinity score calculated', {
            content_type: affinity.content_type,
            content_slug: affinity.content_slug,
            score: affinity.affinity_score,
          });
          return Promise.resolve();
        }

        return supabase.from('user_affinities').upsert(
          {
            user_id: user.id,
            content_type: affinity.content_type,
            content_slug: affinity.content_slug,
            affinity_score: affinity.affinity_score,
            based_on: affinity.breakdown,
            calculated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,content_type,content_slug',
          }
        );
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

  const { data, error } = await supabase
    .from('user_affinities')
    .select('affinity_score')
    .eq('user_id', user.id)
    .eq('content_type', contentType)
    .eq('content_slug', contentSlug)
    .single();

  if (error || !data) {
    return null;
  }

  return data.affinity_score;
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

  const { data, error } = await supabase
    .from('user_affinities')
    .select('content_type, affinity_score')
    .eq('user_id', user.id)
    .gte('affinity_score', 30); // Only meaningful affinities

  if (error || !data) {
    return [];
  }

  // Calculate average affinity per category
  const categoryScores = new Map<string, { sum: number; count: number }>();

  for (const item of data) {
    if (!categoryScores.has(item.content_type)) {
      categoryScores.set(item.content_type, { sum: 0, count: 0 });
    }
    const scores = categoryScores.get(item.content_type)!;
    scores.sum += item.affinity_score;
    scores.count += 1;
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
