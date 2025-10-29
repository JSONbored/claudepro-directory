'use server';

/**
 * Analytics Actions - Database-First Architecture
 * All business logic in PostgreSQL via RPC functions. TypeScript handles auth + URL enrichment only.
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { isValidCategory } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import { getRecommendations } from '@/src/lib/recommender/database-recommender';
import {
  publicContentSimilaritiesRowSchema,
  publicUserAffinitiesRowSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import {
  type AffinityScore,
  type ForYouFeedResponse,
  forYouFeedResponseSchema,
  forYouQuerySchema,
  type SimilarConfigsResponse,
  similarConfigsQuerySchema,
  similarConfigsResponseSchema,
  type TrackInteractionInput,
  type UsageRecommendationResponse,
  type UserAffinitiesResponse,
  usageRecommendationResponseSchema,
  userAffinitiesResponseSchema,
} from '@/src/lib/schemas/personalization.schema';
import { createClient } from '@/src/lib/supabase/server';
import { validateRows } from '@/src/lib/supabase/validators';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';
import type { Database } from '@/src/types/database.types';

type InteractionType = Database['public']['Enums']['interaction_type'];

const quizAnswersSchema = z.object({
  useCase: z.string(),
  experienceLevel: z.string(),
  toolPreferences: z.array(z.string()).min(1).max(5),
  integrations: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  timestamp: z.string().datetime().optional(),
});

type QuizAnswers = z.infer<typeof quizAnswersSchema>;

export const getForYouFeed = rateLimitedAction
  .metadata({
    actionName: 'getForYouFeed',
    category: 'content',
  })
  .schema(forYouQuerySchema)
  .outputSchema(forYouFeedResponseSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof forYouQuerySchema> }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view personalized recommendations');
    }

    try {
      const { data: feedData, error } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user.id,
        ...(parsedInput.category && { p_category: parsedInput.category }),
        p_limit: parsedInput.limit,
      });

      if (error) {
        throw new Error(`Failed to generate feed: ${error.message}`);
      }

      const feed = feedData as {
        recommendations: Array<{
          slug: string;
          title: string;
          description: string;
          category: string;
          score: number;
          source: string;
          reason: string;
          view_count: number;
          popularity: number;
          author: string;
          tags: string[];
        }>;
        total_count: number;
        sources_used: string[];
        user_has_history: boolean;
        generated_at: string;
      };

      const response: ForYouFeedResponse = {
        recommendations: feed.recommendations.map((rec) => ({
          slug: rec.slug,
          title: rec.title,
          description: rec.description,
          category: rec.category as ForYouFeedResponse['recommendations'][0]['category'],
          url: getContentItemUrl({
            category: rec.category as ForYouFeedResponse['recommendations'][0]['category'],
            slug: rec.slug,
          }),
          score: rec.score,
          source: rec.source as ForYouFeedResponse['recommendations'][0]['source'],
          reason: rec.reason,
          view_count: rec.view_count,
          popularity: rec.popularity,
          author: rec.author,
          tags: rec.tags,
        })),
        total_count: feed.total_count,
        sources_used: feed.sources_used as ForYouFeedResponse['sources_used'],
        user_has_history: feed.user_has_history,
        generated_at: feed.generated_at,
      };

      return response;
    } catch (error) {
      logger.error(
        'Failed to generate For You feed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to generate personalized feed');
    }
  });

export const getSimilarConfigs = rateLimitedAction
  .metadata({
    actionName: 'getSimilarConfigs',
    category: 'content',
  })
  .schema(similarConfigsQuerySchema)
  .outputSchema(similarConfigsResponseSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof similarConfigsQuerySchema> }) => {
    try {
      const supabase = await createClient();
      const { data: similarities_data, error: similarities_error } = await supabase
        .from('content_similarities')
        .select('*')
        .eq('content_a_type', parsedInput.content_type)
        .eq('content_a_slug', parsedInput.content_slug)
        .order('similarity_score', { ascending: false })
        .limit(parsedInput.limit);

      if (similarities_error) {
        throw new Error(`Failed to find similar content: ${similarities_error.message}`);
      }

      const validated_similarities = validateRows(
        publicContentSimilaritiesRowSchema,
        similarities_data || [],
        { schemaName: 'ContentSimilarity' }
      );

      const similarities = validated_similarities
        .map((sim) => {
          if (!isValidCategory(sim.content_b_type)) {
            logger.warn('Invalid category type in similarity data', undefined, {
              content_b_type: sim.content_b_type,
              content_a_slug: sim.content_a_slug,
              content_b_slug: sim.content_b_slug,
            });
            return null;
          }

          return {
            content_slug: sim.content_b_slug,
            content_type: sim.content_b_type,
            similarity_score: sim.similarity_score,
            calculated_at: sim.calculated_at,
            similarity_factors:
              typeof sim.similarity_factors === 'object' &&
              sim.similarity_factors !== null &&
              !Array.isArray(sim.similarity_factors)
                ? (sim.similarity_factors as Record<string, unknown>)
                : undefined,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (similarities.length > 0) {
        const response: SimilarConfigsResponse = {
          similar_items: similarities.map((sim) => ({
            slug: sim.content_slug,
            title: sim.content_slug,
            description: '',
            category: sim.content_type,
            url: getContentItemUrl({
              category: sim.content_type,
              slug: sim.content_slug,
            }),
            score: Math.round(sim.similarity_score * 100),
            source: 'similar' as const,
            reason: 'Similar to this config',
            tags: [],
          })),
          source_item: {
            slug: parsedInput.content_slug,
            category: parsedInput.content_type,
          },
          algorithm_version: 'v1.0',
        };

        return response;
      }

      return {
        similar_items: [],
        source_item: {
          slug: parsedInput.content_slug,
          category: parsedInput.content_type,
        },
        algorithm_version: 'v1.0-fallback',
      };
    } catch (error) {
      logger.error(
        'Failed to get similar configs',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to get similar configurations');
    }
  });

const usageRecommendationInputSchema = z.object({
  trigger: z.enum(['after_bookmark', 'after_copy', 'extended_time', 'category_browse']),
  content_type: z.string().optional(),
  content_slug: z.string().optional(),
  category: z.string().optional(),
  time_spent: z.number().optional(),
});

export const getUsageRecommendations = rateLimitedAction
  .metadata({
    actionName: 'getUsageRecommendations',
    category: 'content',
  })
  .schema(usageRecommendationInputSchema)
  .outputSchema(usageRecommendationResponseSchema)
  .action(
    async ({ parsedInput }: { parsedInput: z.infer<typeof usageRecommendationInputSchema> }) => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be signed in to view recommendations');
      }

      try {
        const { data, error } = await supabase.rpc('get_usage_recommendations', {
          p_user_id: user.id,
          p_trigger: parsedInput.trigger,
          ...(parsedInput.content_type && { p_content_type: parsedInput.content_type }),
          ...(parsedInput.content_slug && { p_content_slug: parsedInput.content_slug }),
          ...(parsedInput.category && { p_category: parsedInput.category }),
          p_limit: 3,
        });

        if (error) throw new Error(`Failed to generate recommendations: ${error.message}`);

        const rpcResponse = data as {
          recommendations: Array<{
            slug: string;
            title: string;
            description: string;
            category: string;
            score: number;
            source: string;
            reason: string;
            view_count: number;
            popularity: number;
            author: string;
            tags: string[];
          }>;
          trigger: string;
          context: {
            content_type: string | null;
            content_slug: string | null;
            category: string | null;
          };
        };

        const response: UsageRecommendationResponse = {
          recommendations: rpcResponse.recommendations.map((rec) => ({
            ...rec,
            category: rec.category as UsageRecommendationResponse['recommendations'][0]['category'],
            source: rec.source as UsageRecommendationResponse['recommendations'][0]['source'],
            url: getContentItemUrl({
              category:
                rec.category as UsageRecommendationResponse['recommendations'][0]['category'],
              slug: rec.slug,
            }),
          })),
          trigger: parsedInput.trigger,
          context: {
            content_type: parsedInput.content_type,
            content_slug: parsedInput.content_slug,
            category: parsedInput.category,
          },
        };

        return response;
      } catch (error) {
        logger.error(
          'Failed to generate usage recommendations',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error('Failed to generate recommendations');
      }
    }
  );

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

    // Fetch user affinities
    const { data: affinities_data, error: affinities_error } = await supabase
      .from('user_affinities')
      .select('*')
      .eq('user_id', user.id)
      .gte('affinity_score', min_score)
      .order('affinity_score', { ascending: false })
      .limit(limit);

    if (affinities_error) {
      logger.error('Failed to fetch user affinities', undefined, {
        error: affinities_error.message,
      });
      throw new Error(`Failed to fetch affinities: ${affinities_error.message}`);
    }

    const validated_affinities = validateRows(
      publicUserAffinitiesRowSchema,
      affinities_data || [],
      { schemaName: 'UserAffinity' }
    );

    const response: UserAffinitiesResponse = {
      affinities: validated_affinities as AffinityScore[],
      total_count: validated_affinities.length,
      last_calculated: validated_affinities[0]?.calculated_at || new Date().toISOString(),
    };

    return response;
  });

export const calculateUserAffinitiesAction = rateLimitedAction
  .metadata({
    actionName: 'calculateUserAffinities',
    category: 'user',
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
      const { data, error } = await supabase.rpc('update_user_affinity_scores', {
        p_user_id: user.id,
      });

      if (error) {
        throw new Error(`Failed to calculate affinities: ${error.message}`);
      }

      const result = data?.[0];
      const insertedCount = result?.inserted_count || 0;
      const updatedCount = result?.updated_count || 0;
      const totalCount = result?.total_affinity_count || 0;

      logger.info('User affinities calculated via SQL function', {
        user_id: user.id,
        inserted_count: insertedCount,
        updated_count: updatedCount,
        total_affinity_count: totalCount,
      });

      return {
        success: true,
        message: `Affinities calculated successfully (${insertedCount} new, ${updatedCount} updated)`,
        affinities_calculated: totalCount,
        inserted_count: insertedCount,
        updated_count: updatedCount,
      };
    } catch (error) {
      logger.error(
        'Failed to calculate user affinities',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to calculate affinities');
    }
  });

export async function getContentAffinity(
  contentType: string,
  contentSlug: string
): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.rpc('get_content_affinity', {
    p_user_id: user.id,
    p_content_type: contentType,
    p_content_slug: contentSlug,
  });

  return error ? null : (data ?? null);
}

export async function getUserFavoriteCategories(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase.rpc('get_user_favorite_categories', {
    p_user_id: user.id,
    p_limit: 3,
  });

  return error ? [] : (data ?? []);
}

export const trackInteraction = rateLimitedAction
  .metadata({
    actionName: 'trackInteraction' as const,
    category: 'analytics' as const,
  })
  .schema(
    z.object({
      content_type: z.string(),
      content_slug: z.string(),
      interaction_type: z.enum([
        'view',
        'click',
        'bookmark',
        'share',
        'download',
        'like',
        'upvote',
        'downvote',
      ]),
      session_id: z.string().uuid().optional(),
      metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          message: 'User not authenticated - interaction not tracked',
        };
      }

      const { error } = await supabase.from('user_interactions').insert({
        content_type: parsedInput.content_type,
        content_slug: parsedInput.content_slug,
        interaction_type: parsedInput.interaction_type as InteractionType,
        user_id: user.id,
        session_id: parsedInput.session_id || null,
        metadata: parsedInput.metadata || null,
      });

      if (error) {
        logger.error('Failed to track interaction', undefined, {
          content_type: parsedInput.content_type,
          content_slug: parsedInput.content_slug,
          interaction_type: parsedInput.interaction_type,
          error: error.message,
        });

        return {
          success: false,
          message: `Failed to track interaction: ${error.message}`,
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

export async function getUserRecentInteractions(limit = 20): Promise<TrackInteractionInput[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase.rpc('get_user_recent_interactions', {
    p_user_id: user.id,
    p_limit: limit,
  });

  if (error) {
    logger.error('Failed to fetch user interactions', error);
    return [];
  }

  const interactions = data as Array<{
    content_type: string;
    content_slug: string;
    interaction_type: string;
    session_id: string | null;
    metadata: Record<string, string | number | boolean>;
    created_at: string;
  }>;

  return interactions.map((item) => ({
    content_type: item.content_type as TrackInteractionInput['content_type'],
    content_slug: item.content_slug,
    interaction_type: item.interaction_type as TrackInteractionInput['interaction_type'],
    session_id: item.session_id || undefined,
    metadata: item.metadata || {},
  }));
}

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

  const defaultSummary = {
    total_interactions: 0,
    views: 0,
    copies: 0,
    bookmarks: 0,
    unique_content_items: 0,
  };

  if (!user) return defaultSummary;

  const { data, error } = await supabase.rpc('get_user_interaction_summary', {
    p_user_id: user.id,
  });

  if (error) {
    logger.error('Failed to fetch interaction summary', error);
    return defaultSummary;
  }

  return data as typeof defaultSummary;
}

export const generateConfigRecommendations = rateLimitedAction
  .metadata({
    actionName: 'generateConfigRecommendations',
    category: 'content',
  })
  .schema(quizAnswersSchema)
  .action(async ({ parsedInput }: { parsedInput: QuizAnswers }) => {
    const answers = parsedInput;
    const startTime = performance.now();

    try {
      const dbResults = await getRecommendations({
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
        toolPreferences: answers.toolPreferences,
        integrations: answers.integrations || [],
        focusAreas: answers.focusAreas || [],
        limit: 20,
      });

      const resultId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const response = {
        results: dbResults.map((item, index) => ({
          slug: item.slug,
          title: item.title,
          description: item.description,
          category: item.category,
          matchScore: item.match_score,
          matchPercentage: item.match_percentage,
          rank: index + 1,
          reasons: [{ type: 'use-case-match' as const, message: item.primary_reason }],
          primaryReason: item.primary_reason,
          author: item.author,
          tags: item.tags,
        })),
        totalMatches: dbResults.length,
        answers,
        id: resultId,
        generatedAt: new Date().toISOString(),
        algorithm: 'rule-based' as const,
        summary: {
          topCategory: dbResults[0]?.category || 'agents',
          avgMatchScore:
            Math.round(dbResults.reduce((sum, r) => sum + r.match_score, 0) / dbResults.length) ||
            0,
          diversityScore: Math.round((new Set(dbResults.map((r) => r.category)).size / 8) * 100),
        },
      };

      const duration = performance.now() - startTime;

      logger.info('Recommendations generated', {
        resultId: response.id,
        resultCount: response.results.length,
        totalMatches: response.totalMatches,
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
        toolPreferences: answers.toolPreferences.join(','),
        duration: `${duration.toFixed(2)}ms`,
        avgMatchScore: response.summary.avgMatchScore,
        diversityScore: response.summary.diversityScore,
      });

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const interestTags = [
          answers.useCase,
          answers.experienceLevel,
          ...answers.toolPreferences,
          ...(answers.integrations || []),
          ...(answers.focusAreas || []),
        ].filter(Boolean);

        createClient()
          .then((supabase) =>
            supabase
              .from('users')
              .update({
                interests: Array.from(new Set(interestTags)).slice(0, 10),
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)
          )
          .catch(() => {
            logger.warn('Failed to update user interests from quiz', undefined, {
              user_id: user.id,
            });
          });
      }

      return {
        success: true,
        recommendations: response,
      };
    } catch (error) {
      logger.error(
        'Failed to generate recommendations',
        error instanceof Error ? error : new Error(String(error)),
        {
          useCase: answers.useCase,
          experienceLevel: answers.experienceLevel,
        }
      );

      throw new Error('Failed to generate recommendations. Please try again.');
    }
  });

export const trackRecommendationEvent = rateLimitedAction
  .metadata({
    actionName: 'trackRecommendationEvent',
    category: 'analytics',
  })
  .schema(
    quizAnswersSchema.pick({
      useCase: true,
      experienceLevel: true,
      toolPreferences: true,
    })
  )
  .action(
    async ({
      parsedInput,
    }: {
      parsedInput: Pick<QuizAnswers, 'useCase' | 'experienceLevel' | 'toolPreferences'>;
    }) => {
      logger.info('Recommendation event tracked', {
        useCase: parsedInput.useCase,
        experienceLevel: parsedInput.experienceLevel,
        toolPreferences: parsedInput.toolPreferences.join(','),
      });

      return {
        success: true,
      };
    }
  );
