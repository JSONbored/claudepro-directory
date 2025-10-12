'use server';

/**
 * Analytics Actions
 * Consolidated server actions for all analytics-related functionality
 *
 * Consolidates: Personalization (3 actions), Affinity (4 actions), Interaction (3 actions), Recommender (2 actions)
 */

import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { statsRedis } from '@/src/lib/cache';
import { logger } from '@/src/lib/logger';
import {
  calculateUserAffinities,
  validateAffinityScore,
} from '@/src/lib/personalization/affinity-scorer';
import {
  buildUserContext,
  generateColdStartRecommendations,
  generateForYouFeed,
  hasPersonalizationData,
} from '@/src/lib/personalization/for-you-feed';
import type { PersonalizedContentItem } from '@/src/lib/personalization/types';
import { getUsageBasedRecommendations } from '@/src/lib/personalization/usage-based-recommender';
import { generateRecommendations } from '@/src/lib/recommender/algorithm';
import { bookmarkRepository } from '@/src/lib/repositories/bookmark.repository';
import { contentSimilarityRepository } from '@/src/lib/repositories/content-similarity.repository';
import { userRepository } from '@/src/lib/repositories/user.repository';
import { userAffinityRepository } from '@/src/lib/repositories/user-affinity.repository';
import { userInteractionRepository } from '@/src/lib/repositories/user-interaction.repository';
import { sessionIdSchema, toContentId } from '@/src/lib/schemas/branded-types.schema';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import {
  type AffinityScore,
  type ForYouFeedResponse,
  forYouFeedResponseSchema,
  forYouQuerySchema,
  type SimilarConfigsResponse,
  similarConfigsQuerySchema,
  similarConfigsResponseSchema,
  type TrackInteractionInput,
  trackInteractionSchema,
  type UsageRecommendationResponse,
  type UserAffinitiesResponse,
  usageRecommendationResponseSchema,
  userAffinitiesResponseSchema,
} from '@/src/lib/schemas/personalization.schema';
import { type QuizAnswers, quizAnswersSchema } from '@/src/lib/schemas/recommender.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';
import { batchFetch, batchMap } from '@/src/lib/utils/batch.utils';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

// ============================================
// PERSONALIZATION ACTIONS
// ============================================

/**
 * Get personalized "For You" feed
 * Combines affinity, collaborative filtering, trending, and interests
 */
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
      // Use cached function with 5 minute revalidation
      const getCachedFeed = unstable_cache(
        async (userId: string) => {
          // Load all content
          const [
            agentsData,
            mcpData,
            rulesData,
            commandsData,
            hooksData,
            statuslinesData,
            collectionsData,
          ] = await batchFetch([
            lazyContentLoaders.agents(),
            lazyContentLoaders.mcp(),
            lazyContentLoaders.rules(),
            lazyContentLoaders.commands(),
            lazyContentLoaders.hooks(),
            lazyContentLoaders.statuslines(),
            lazyContentLoaders.collections(),
          ]);

          const allContent: UnifiedContentItem[] = [
            ...agentsData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'agents' as const,
            })),
            ...mcpData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'mcp' as const,
            })),
            ...rulesData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'rules' as const,
            })),
            ...commandsData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'commands' as const,
            })),
            ...hooksData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'hooks' as const,
            })),
            ...statuslinesData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'statuslines' as const,
            })),
            ...collectionsData.map((item: Record<string, unknown>) => ({
              ...item,
              category: 'collections' as const,
            })),
          ] as UnifiedContentItem[];

          // Enrich with view counts
          const enrichedContent = await statsRedis.enrichWithViewCounts(allContent);

          // Fetch user affinities via repository (includes caching)
          const affinitiesResult = await userAffinityRepository.findByUser(userId, {
            minScore: 20,
            limit: 50,
            sortBy: 'affinity_score',
            sortOrder: 'desc',
          });

          const affinities = affinitiesResult.success
            ? (affinitiesResult.data || []).map((a) => ({
                content_type: a.content_type,
                content_slug: a.content_slug,
                affinity_score: a.affinity_score,
              }))
            : [];

          // Fetch bookmarks via repository (includes caching)
          const bookmarksResult = await bookmarkRepository.findByUser(userId);
          const bookmarks = bookmarksResult.success
            ? (bookmarksResult.data || []).map((b) => ({
                content_type: b.content_type,
                content_slug: b.content_slug,
              }))
            : [];

          // Fetch recent views (last 7 days) via repository (includes caching)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recentViewsResult = await userInteractionRepository.findByUser(userId, {
            limit: 1000, // Large limit to capture all recent views
            sortBy: 'created_at',
            sortOrder: 'desc',
          });

          const recentViews = recentViewsResult.success
            ? (recentViewsResult.data || [])
                .filter(
                  (interaction) =>
                    interaction.interaction_type === 'view' &&
                    new Date(interaction.created_at) >= sevenDaysAgo
                )
                .map((interaction) => ({
                  content_type: interaction.content_type,
                  content_slug: interaction.content_slug,
                }))
            : [];

          // Fetch user profile interests
          const { data: profile } = await supabase
            .from('users')
            .select('interests')
            .eq('id', userId)
            .single();

          const profileInterests = (profile?.interests as string[]) || [];

          // Get favorite categories from affinities
          const categoryScores = new Map<string, number[]>();
          for (const aff of affinities || []) {
            if (!categoryScores.has(aff.content_type)) {
              categoryScores.set(aff.content_type, []);
            }
            const scores = categoryScores.get(aff.content_type);
            if (scores) {
              scores.push(aff.affinity_score);
            }
          }

          const favoriteCategories = Array.from(categoryScores.entries())
            .map(([cat, scores]) => ({
              category: cat,
              avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 3)
            .map((item) => item.category);

          // Build user context
          const userContext = buildUserContext(
            userId,
            affinities || [],
            bookmarks || [],
            recentViews || [],
            profileInterests,
            favoriteCategories
          );

          // Get trending items
          const trendingKeys = await batchMap(
            ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'],
            async (cat: string) => {
              const trending = await statsRedis.getTrending(cat, 10);
              return trending.map((slug: string) => `${cat}:${slug}`);
            }
          );
          const trendingSet = new Set<string>(trendingKeys.flat());

          // Check if user has sufficient personalization data
          const hasHistory = hasPersonalizationData(userContext);

          let recommendations: Array<
            UnifiedContentItem & {
              recommendation_source?: PersonalizedContentItem['recommendation_source'];
              recommendation_reason?: string;
              affinity_score?: number;
            }
          >;
          if (hasHistory) {
            // Generate personalized recommendations
            // Note: Collaborative recommendations would require pre-computed data
            const collaborativeRecs = new Map<string, number>(); // Placeholder

            recommendations = generateForYouFeed(
              enrichedContent,
              userContext,
              collaborativeRecs,
              trendingSet,
              {
                limit: parsedInput.limit,
                ...(parsedInput.category ? { category_filter: parsedInput.category } : {}),
                exclude_bookmarked: parsedInput.exclude_bookmarked,
              }
            );
          } else {
            // Cold start: use trending + interests
            recommendations = generateColdStartRecommendations(
              enrichedContent,
              profileInterests,
              trendingSet,
              parsedInput.limit
            );
          }

          const response: ForYouFeedResponse = {
            recommendations: recommendations.map(
              (
                rec: UnifiedContentItem & {
                  recommendation_source?: PersonalizedContentItem['recommendation_source'];
                  recommendation_reason?: string;
                  affinity_score?: number;
                }
              ) => ({
                slug: toContentId(rec.slug),
                title: rec.title || rec.name || rec.slug,
                description: rec.description,
                category: rec.category,
                url: getContentItemUrl({ category: rec.category, slug: rec.slug }),
                score: rec.affinity_score || 50,
                source: rec.recommendation_source || 'trending',
                reason: rec.recommendation_reason,
                view_count: (rec as UnifiedContentItem & { viewCount?: number }).viewCount,
                popularity: rec.popularity,
                author: rec.author,
                tags: rec.tags || [],
              })
            ),
            total_count: recommendations.length,
            sources_used: [
              ...new Set(
                recommendations.map(
                  (
                    r: UnifiedContentItem & {
                      recommendation_source?: PersonalizedContentItem['recommendation_source'];
                    }
                  ) => r.recommendation_source || 'trending'
                )
              ),
            ],
            user_has_history: hasHistory,
            generated_at: new Date().toISOString(),
          };

          return response;
        },
        [`for-you-feed-${user.id}-${parsedInput.limit}-${parsedInput.category || 'all'}`],
        {
          revalidate: 300, // 5 minutes
          tags: ['personalization', `user-${user.id}`],
        }
      );

      return await getCachedFeed(user.id);
    } catch (error) {
      logger.error(
        'Failed to generate For You feed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to generate personalized feed');
    }
  });

/**
 * Get similar configurations for a content item
 */
export const getSimilarConfigs = rateLimitedAction
  .metadata({
    actionName: 'getSimilarConfigs',
    category: 'content',
  })
  .schema(similarConfigsQuerySchema)
  .outputSchema(similarConfigsResponseSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof similarConfigsQuerySchema> }) => {
    try {
      // Check database for pre-computed similarities via repository (includes caching)
      const similaritiesResult = await contentSimilarityRepository.findSimilarContent(
        parsedInput.content_type,
        parsedInput.content_slug,
        {
          limit: parsedInput.limit,
          sortBy: 'similarity_score',
          sortOrder: 'desc',
        }
      );

      const similarities = similaritiesResult.success ? similaritiesResult.data : null;

      if (similarities && similarities.length > 0) {
        // Return pre-computed similarities
        const response: SimilarConfigsResponse = {
          similar_items: similarities.map((sim) => ({
            slug: toContentId(sim.content_slug),
            title: sim.content_slug, // Will be enriched by client
            description: '',
            category: sim.content_type as ContentCategory,
            url: getContentItemUrl({
              category: sim.content_type as ContentCategory,
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

      // Fallback: No pre-computed data, return empty
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

/**
 * Get usage-based recommendations
 * Triggered by specific user actions
 */
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

      try {
        // Load all content
        const [
          agentsData,
          mcpData,
          rulesData,
          commandsData,
          hooksData,
          statuslinesData,
          collectionsData,
        ] = await batchFetch([
          lazyContentLoaders.agents(),
          lazyContentLoaders.mcp(),
          lazyContentLoaders.rules(),
          lazyContentLoaders.commands(),
          lazyContentLoaders.hooks(),
          lazyContentLoaders.statuslines(),
          lazyContentLoaders.collections(),
        ]);

        const allContent: UnifiedContentItem[] = [
          ...agentsData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'agents' as const,
          })),
          ...mcpData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'mcp' as const,
          })),
          ...rulesData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'rules' as const,
          })),
          ...commandsData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'commands' as const,
          })),
          ...hooksData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'hooks' as const,
          })),
          ...statuslinesData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'statuslines' as const,
          })),
          ...collectionsData.map((item: Record<string, unknown>) => ({
            ...item,
            category: 'collections' as const,
          })),
        ] as UnifiedContentItem[];

        // Find current item if provided
        let currentItem: UnifiedContentItem | undefined;
        if (parsedInput.content_type && parsedInput.content_slug) {
          currentItem = allContent.find(
            (item) =>
              item.category === parsedInput.content_type && item.slug === parsedInput.content_slug
          );
        }

        // Get user affinities if authenticated via repository (includes caching)
        const userAffinities = new Map<string, number>();
        if (user) {
          const affinitiesResult = await userAffinityRepository.findByUser(user.id);

          if (affinitiesResult.success && affinitiesResult.data) {
            for (const aff of affinitiesResult.data) {
              userAffinities.set(`${aff.content_type}:${aff.content_slug}`, aff.affinity_score);
            }
          }
        }

        // Generate recommendations
        const recommendations = getUsageBasedRecommendations(parsedInput.trigger, {
          ...(currentItem ? { current_item: currentItem } : {}),
          ...(parsedInput.category ? { category: parsedInput.category } : {}),
          ...(parsedInput.time_spent !== undefined ? { time_spent: parsedInput.time_spent } : {}),
          all_content: allContent,
          ...(userAffinities.size > 0 ? { user_affinities: userAffinities } : {}),
        });

        const response: UsageRecommendationResponse = {
          recommendations: recommendations.map((rec: PersonalizedContentItem) => ({
            slug: toContentId((rec as UnifiedContentItem).slug),
            title:
              (rec as UnifiedContentItem).title ||
              (rec as UnifiedContentItem).name ||
              (rec as UnifiedContentItem).slug,
            description: (rec as UnifiedContentItem).description,
            category: (rec as UnifiedContentItem).category,
            url: getContentItemUrl({
              category: (rec as UnifiedContentItem).category,
              slug: (rec as UnifiedContentItem).slug,
            }),
            score: rec.affinity_score || 50,
            source: rec.recommendation_source || 'usage',
            reason: rec.recommendation_reason,
            view_count: (rec as UnifiedContentItem & { viewCount?: number }).viewCount,
            popularity: (rec as UnifiedContentItem).popularity,
            author: (rec as UnifiedContentItem).author,
            tags: (rec as UnifiedContentItem).tags || [],
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

// ============================================
// AFFINITY ACTIONS
// ============================================

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

      await batchFetch(upsertPromises);

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

// ============================================
// INTERACTION ACTIONS
// ============================================

/**
 * Track a user interaction with content
 *
 * Features:
 * - Rate limited: 200 requests per 60 seconds per IP (high volume for tracking)
 * - Automatic validation via Zod schema
 * - Anonymous users supported (user_id will be null)
 * - Type-safe with full inference
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

// ============================================
// RECOMMENDER ACTIONS
// ============================================

/**
 * Generate personalized configuration recommendations
 *
 * @param quizAnswers - Validated user quiz answers
 * @returns Recommendation response with ranked configurations
 *
 * Rate limit: 20 requests per minute per IP
 * Response time: <100ms (in-memory computation)
 */
export const generateConfigRecommendations = rateLimitedAction
  .metadata({
    actionName: 'generateConfigRecommendations',
    category: 'content',
    rateLimit: {
      maxRequests: 20, // Allow multiple quiz attempts
      windowSeconds: 60, // Per minute
    },
  })
  .schema(quizAnswersSchema)
  .action(async ({ parsedInput }: { parsedInput: QuizAnswers }) => {
    const answers = parsedInput;
    const startTime = performance.now();

    try {
      // Load all configurations from lazy loaders
      const [
        agentsData,
        mcpData,
        rulesData,
        commandsData,
        hooksData,
        statuslinesData,
        collectionsData,
      ] = await batchFetch([
        lazyContentLoaders.agents(),
        lazyContentLoaders.mcp(),
        lazyContentLoaders.rules(),
        lazyContentLoaders.commands(),
        lazyContentLoaders.hooks(),
        lazyContentLoaders.statuslines(),
        lazyContentLoaders.collections(),
      ]);

      // Combine all configurations with category tags
      const allConfigs: UnifiedContentItem[] = [
        ...agentsData.map((item) => ({ ...item, category: 'agents' as const })),
        ...mcpData.map((item) => ({ ...item, category: 'mcp' as const })),
        ...rulesData.map((item) => ({ ...item, category: 'rules' as const })),
        ...commandsData.map((item) => ({ ...item, category: 'commands' as const })),
        ...hooksData.map((item) => ({ ...item, category: 'hooks' as const })),
        ...statuslinesData.map((item) => ({ ...item, category: 'statuslines' as const })),
        ...collectionsData.map((item) => ({ ...item, category: 'collections' as const })),
      ] as UnifiedContentItem[];

      // Enrich with view counts from Redis for popularity scoring
      const enrichedConfigs = await statsRedis.enrichWithViewCounts(allConfigs);

      // Generate recommendations using rule-based algorithm
      const response = await generateRecommendations(answers, enrichedConfigs);

      const duration = performance.now() - startTime;

      // Log analytics event
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

      // Store quiz answers in user profile (for For You feed personalization)
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Build interest tags from quiz answers
        const interestTags = [
          answers.useCase,
          answers.experienceLevel,
          ...answers.toolPreferences,
          ...(answers.integrations || []),
          ...(answers.focusAreas || []),
        ].filter(Boolean);

        // Update user interests via repository (non-blocking fire-and-forget)
        userRepository
          .update(user.id, {
            interests: Array.from(new Set(interestTags)).slice(0, 10), // Max 10 interests
          })
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

/**
 * Track recommendation analytics event
 * Tracks user interactions with recommendation results
 *
 * Rate limit: 100 requests per minute per IP
 */
export const trackRecommendationEvent = rateLimitedAction
  .metadata({
    actionName: 'trackRecommendationEvent',
    category: 'analytics',
    rateLimit: {
      maxRequests: 100,
      windowSeconds: 60,
    },
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
      // Simple event tracking for analytics
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
