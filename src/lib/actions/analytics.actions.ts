'use server';

/**
 * Analytics Actions
 * Consolidated server actions for all analytics-related functionality
 *
 * Consolidates: Personalization (3 actions), Affinity (4 actions), Interaction (3 actions), Recommender (2 actions)
 */

import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { statsRedis } from '@/src/lib/cache.server';
import { isValidCategory } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import {
  buildUserContext,
  generateColdStartRecommendations,
  generateForYouFeed,
  hasPersonalizationData,
} from '@/src/lib/personalization/for-you-feed';
import type { PersonalizedContentItem } from '@/src/lib/personalization/types';
import { getUsageBasedRecommendations } from '@/src/lib/personalization/usage-based-recommender';
import { getRecommendations } from '@/src/lib/recommender/database-recommender';
import {
  publicBookmarksRowSchema,
  publicContentSimilaritiesRowSchema,
  publicGetRecommendationsArgsSchema,
  publicUserAffinitiesRowSchema,
  publicUserInteractionsRowSchema,
  publicUsersRowSchema,
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
  trackInteractionSchema,
  type UsageRecommendationResponse,
  type UserAffinitiesResponse,
  usageRecommendationResponseSchema,
  userAffinitiesResponseSchema,
} from '@/src/lib/schemas/personalization.schema';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import type { Database } from '@/src/types/database.types';

// ========================================================================
// INLINE TYPES (moved from interaction.schema.ts + similarity.schema.ts)
// Database-first: These match database enum/table structures
// ========================================================================

/** Interaction type enum (matches database interaction_type enum) */
type InteractionType =
  | 'view'
  | 'click'
  | 'bookmark'
  | 'share'
  | 'download'
  | 'like'
  | 'upvote'
  | 'downvote';

/** Similarity result with metadata (matches content_similarities table) */
interface SimilarityResult {
  content_slug: string;
  content_type: CategoryId;
  similarity_score: number;
  similarity_factors?: Record<string, unknown>;
  calculated_at: string;
}

import { createClient } from '@/src/lib/supabase/server';
import { validateRows } from '@/src/lib/supabase/validators';
import { batchFetch } from '@/src/lib/utils/batch.utils';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

// Use auto-generated schema from database (extends with UI-specific fields)
const quizAnswersSchema = publicGetRecommendationsArgsSchema
  .omit({ p_use_case: true, p_experience_level: true, p_tool_preferences: true })
  .extend({
    useCase: z.string(),
    experienceLevel: z.string(),
    toolPreferences: z.array(z.string()).min(1).max(5),
    timestamp: z.string().datetime().optional(),
  });

type QuizAnswers = z.infer<typeof quizAnswersSchema>;

// ============================================
// PRIVATE HELPERS (NOT EXPORTED - NO ENDPOINTS)
// ============================================

/**
 * PRIVATE: Load all content from all categories with caching
 *
 * Modern 2025 Architecture - Eliminates code duplication:
 * BEFORE: 210 LOC duplicated across 3 actions (getForYouFeed, getUsageRecommendations, generateConfigRecommendations)
 * AFTER: Single cached helper reused everywhere
 *
 * Caching Strategy:
 * - React cache() in lazyContentLoaders - Deduplicates within single render (15-25ms per duplicate)
 * - unstable_cache() here - Cross-request caching (5-minute TTL)
 * - Dynamic imports - Browser code-splitting
 *
 * IMPORTANT: NOT exported to avoid creating server action endpoint (GitHub #63804)
 * Tree-shakeable: Only used internally by this file's actions
 *
 * @returns All content items from all categories with category tags
 */
const loadAllContentCached = unstable_cache(
  async (): Promise<ContentItem[]> => {
    // Load all categories in parallel via batchFetch
    const [
      agentsData,
      mcpData,
      rulesData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
    ] = await batchFetch([
      getContentByCategory('agents'),
      getContentByCategory('mcp'),
      getContentByCategory('rules'),
      getContentByCategory('commands'),
      getContentByCategory('hooks'),
      getContentByCategory('statuslines'),
      getContentByCategory('collections'),
    ]);

    // Combine all content with category tags
    const allContent: ContentItem[] = [
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
    ] as ContentItem[];

    return allContent;
  },
  ['all-content-unified-analytics'], // Cache key
  {
    revalidate: 300, // 5 minutes - matches getForYouFeed TTL
    tags: ['content', 'all-content'],
  }
);

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
          // Load all content via private helper (eliminates 48 LOC duplication)
          const allContent = await loadAllContentCached();

          // Enrich with view counts
          const enrichedContent = await statsRedis.enrichWithViewCounts(allContent);

          const supabaseCached = await createClient();

          // Fetch user affinities
          const { data: affinities_data, error: affinities_error } = await supabaseCached
            .from('user_affinities')
            .select('*')
            .eq('user_id', userId)
            .gte('affinity_score', 20)
            .order('affinity_score', { ascending: false })
            .limit(50);

          if (affinities_error) {
            throw new Error(`Failed to fetch user affinities: ${affinities_error.message}`);
          }

          const validated_affinities = validateRows(
            publicUserAffinitiesRowSchema,
            affinities_data || [],
            { schemaName: 'UserAffinity' }
          );

          const affinities = validated_affinities.map((a) => ({
            content_type: a.content_type,
            content_slug: a.content_slug,
            affinity_score: a.affinity_score,
          }));

          // Fetch bookmarks
          const supabase = await createClient();
          const { data: bookmarks_data, error: bookmarks_error } = await supabase
            .from('bookmarks')
            .select('content_type, content_slug')
            .eq('user_id', userId);

          if (bookmarks_error) {
            throw new Error(`Failed to fetch bookmarks: ${bookmarks_error.message}`);
          }

          const validated_bookmarks = validateRows(
            publicBookmarksRowSchema.pick({ content_type: true, content_slug: true }),
            bookmarks_data || [],
            { schemaName: 'Bookmark' }
          );

          const bookmarks = validated_bookmarks.map((b) => ({
            content_type: b.content_type,
            content_slug: b.content_slug,
          }));

          // Fetch recent views (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: interactions_data, error: interactions_error } = await supabase
            .from('user_interactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1000);

          if (interactions_error) {
            throw new Error(`Failed to fetch user interactions: ${interactions_error.message}`);
          }

          const validated_interactions = validateRows(
            publicUserInteractionsRowSchema,
            interactions_data || [],
            { schemaName: 'UserInteraction' }
          );

          const recentViews = validated_interactions
            .filter(
              (interaction) =>
                interaction.interaction_type === 'view' &&
                new Date(interaction.created_at) >= sevenDaysAgo
            )
            .map((interaction) => ({
              content_type: interaction.content_type,
              content_slug: interaction.content_slug,
            }));

          // Fetch user profile interests
          const { data: profile_data, error: profile_error } = await supabase
            .from('users')
            .select('interests')
            .eq('id', userId)
            .single();

          if (profile_error) {
            throw new Error(`Failed to fetch user profile: ${profile_error.message}`);
          }

          const validated_profile = publicUsersRowSchema
            .pick({ interests: true })
            .nullable()
            .parse(profile_data);

          const profileInterests = (validated_profile?.interests as string[]) || [];

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

          // Build user context (kept for potential future use)
          // Note: Current implementation uses materialized views directly via userId
          // This context building is preserved for fallback scenarios
          buildUserContext(
            userId,
            affinities || [],
            bookmarks || [],
            recentViews || [],
            profileInterests,
            favoriteCategories
          );

          // OPTIMIZATION: Calculate trending from enriched content (already has viewCount)
          // Items with viewCount > 100 are considered trending (simple threshold)
          const trendingSet = new Set<string>(
            enrichedContent
              .filter((item) => (item.viewCount || 0) > 100)
              .map((item) => `${item.category}:${item.slug}`)
          );

          // Check if user has sufficient personalization data
          const hasHistory = await hasPersonalizationData(userId);

          let recommendations: Array<
            ContentItem & {
              recommendation_source?: PersonalizedContentItem['recommendation_source'];
              recommendation_reason?: string;
              affinity_score?: number;
            }
          >;
          if (hasHistory) {
            // Generate personalized recommendations using materialized views
            recommendations = await generateForYouFeed(enrichedContent, userId, {
              limit: parsedInput.limit,
              ...(parsedInput.category ? { category_filter: parsedInput.category } : {}),
              exclude_bookmarked: parsedInput.exclude_bookmarked,
            });
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
                rec: ContentItem & {
                  recommendation_source?: PersonalizedContentItem['recommendation_source'];
                  recommendation_reason?: string;
                  affinity_score?: number;
                }
              ) => ({
                slug: rec.slug,
                title: rec.title || rec.name || rec.slug,
                description: rec.description,
                category: rec.category,
                url: getContentItemUrl({ category: rec.category, slug: rec.slug }),
                score: rec.affinity_score || 50,
                source: rec.recommendation_source || 'trending',
                reason: rec.recommendation_reason,
                view_count: (rec as ContentItem & { viewCount?: number }).viewCount,
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
                    r: ContentItem & {
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
      // Check database for pre-computed similarities
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

      // Transform to SimilarityResult format
      const similarities: SimilarityResult[] | null =
        validated_similarities
          .map((sim) => {
            // Validate category type from database
            if (!isValidCategory(sim.content_b_type)) {
              logger.warn('Invalid category type in similarity data', undefined, {
                content_b_type: sim.content_b_type,
                content_a_slug: sim.content_a_slug,
                content_b_slug: sim.content_b_slug,
              });
              return null;
            }

            const result: SimilarityResult = {
              content_slug: sim.content_b_slug,
              content_type: sim.content_b_type,
              similarity_score: sim.similarity_score,
              calculated_at: sim.calculated_at,
            };
            if (
              typeof sim.similarity_factors === 'object' &&
              sim.similarity_factors !== null &&
              !Array.isArray(sim.similarity_factors)
            ) {
              result.similarity_factors = sim.similarity_factors as Record<string, unknown>;
            }
            return result;
          })
          .filter((r): r is SimilarityResult => r !== null) || null;

      if (similarities && similarities.length > 0) {
        // Return pre-computed similarities
        // Note: sim.content_type is already CategoryId (validated by repository.isValidCategory)
        const response: SimilarConfigsResponse = {
          similar_items: similarities.map((sim) => ({
            slug: sim.content_slug,
            title: sim.content_slug, // Will be enriched by client
            description: '',
            category: sim.content_type, // Already CategoryId from SimilarityResult interface
            url: getContentItemUrl({
              category: sim.content_type, // Already CategoryId from SimilarityResult interface
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
        // Load all content via private helper (eliminates 48 LOC duplication)
        const allContent = await loadAllContentCached();

        // Find current item if provided
        let currentItem: ContentItem | undefined;
        if (parsedInput.content_type && parsedInput.content_slug) {
          currentItem = allContent.find(
            (item) =>
              item.category === parsedInput.content_type && item.slug === parsedInput.content_slug
          );
        }

        // Get user affinities if authenticated
        const userAffinities = new Map<string, number>();
        if (user) {
          const { data: affinities_data, error: affinities_error } = await supabase
            .from('user_affinities')
            .select('*')
            .eq('user_id', user.id);

          if (affinities_error) {
            throw new Error(`Failed to fetch user affinities: ${affinities_error.message}`);
          }

          const validated_affinities = validateRows(
            publicUserAffinitiesRowSchema,
            affinities_data || [],
            { schemaName: 'UserAffinity' }
          );

          for (const aff of validated_affinities) {
            userAffinities.set(`${aff.content_type}:${aff.content_slug}`, aff.affinity_score);
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
            slug: (rec as ContentItem).slug,
            title:
              (rec as ContentItem).title || (rec as ContentItem).name || (rec as ContentItem).slug,
            description: (rec as ContentItem).description,
            category: (rec as ContentItem).category,
            url: getContentItemUrl({
              category: (rec as ContentItem).category,
              slug: (rec as ContentItem).slug,
            }),
            score: rec.affinity_score || 50,
            source: rec.recommendation_source || 'usage',
            reason: rec.recommendation_reason,
            view_count: (rec as ContentItem & { viewCount?: number }).viewCount,
            popularity: (rec as ContentItem).popularity,
            author: (rec as ContentItem).author,
            tags: (rec as ContentItem).tags || [],
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

/**
 * Calculate and update affinity scores for current user
 * Now uses database-native SQL function for better performance
 *
 * ARCHITECTURE (2025-10-26): Migrated from application-side calculation
 * - Before: TypeScript algorithm + multiple DB round-trips (~100 LOC)
 * - After: Single RPC call to update_user_affinity_scores() function
 * - Benefits: Faster execution, no memory overhead, enables pg_cron automation
 */
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
      // Call database function to calculate and persist affinities
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

  // Fetch affinity score
  const { data: affinity_data, error: affinity_error } = await supabase
    .from('user_affinities')
    .select('*')
    .eq('user_id', user.id)
    .eq('content_type', contentType)
    .eq('content_slug', contentSlug)
    .single();

  if (affinity_error) {
    return null;
  }

  const validated_affinity = publicUserAffinitiesRowSchema.nullable().parse(affinity_data);

  return validated_affinity?.affinity_score ?? null;
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

  // Fetch user affinities
  const { data: affinities_data, error: affinities_error } = await supabase
    .from('user_affinities')
    .select('*')
    .eq('user_id', user.id)
    .gte('affinity_score', 30); // Only meaningful affinities

  if (affinities_error) {
    return [];
  }

  const validated_affinities = validateRows(publicUserAffinitiesRowSchema, affinities_data || [], {
    schemaName: 'UserAffinity',
  });

  const data = validated_affinities;

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

      // Track interaction (fire-and-forget for analytics)
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

  // Get interactions
  const { data: interactions_data, error: interactions_error } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (interactions_error) {
    logger.error('Failed to fetch user interactions', undefined, {
      error: interactions_error.message,
    });
    return [];
  }

  const validated_interactions = validateRows(
    publicUserInteractionsRowSchema,
    interactions_data || [],
    { schemaName: 'UserInteraction' }
  );

  // Transform database results to match TrackInteractionInput type
  return validated_interactions.map((item) => ({
    content_type: item.content_type as TrackInteractionInput['content_type'],
    content_slug: item.content_slug,
    interaction_type: item.interaction_type as TrackInteractionInput['interaction_type'],
    session_id: item.session_id ? nonEmptyString.uuid().parse(item.session_id) : undefined,
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
    // Get interaction stats
    const { data: interactions_data, error: interactions_error } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id);

    if (interactions_error) {
      logger.error('Failed to fetch interaction summary', undefined, {
        error: interactions_error.message,
      });
      return {
        total_interactions: 0,
        views: 0,
        copies: 0,
        bookmarks: 0,
        unique_content_items: 0,
      };
    }

    const validated_interactions = validateRows(
      publicUserInteractionsRowSchema,
      interactions_data || [],
      { schemaName: 'UserInteraction' }
    );

    const interactions = validated_interactions;

    // Calculate stats
    const byType: Record<string, number> = {};
    interactions.forEach((i) => {
      byType[i.interaction_type] = (byType[i.interaction_type] || 0) + 1;
    });

    const uniqueContentItems = new Set(
      interactions.map((i) => `${i.content_type}:${i.content_slug}`)
    ).size;

    return {
      total_interactions: interactions.length,
      views: byType.view || 0,
      copies: byType.copy || 0,
      bookmarks: byType.bookmark || 0,
      unique_content_items: uniqueContentItems,
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
  })
  .schema(quizAnswersSchema)
  .action(async ({ parsedInput }: { parsedInput: QuizAnswers }) => {
    const answers = parsedInput;
    const startTime = performance.now();

    try {
      // Call PostgreSQL recommendation function (refreshed every 6 hours)
      const dbResults = await getRecommendations({
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
        toolPreferences: answers.toolPreferences,
        integrations: answers.integrations || [],
        focusAreas: answers.focusAreas || [],
        limit: 20,
      });

      // Transform to expected format
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

        // Update user interests (non-blocking fire-and-forget)
        createClient()
          .then((supabase) =>
            supabase
              .from('users')
              .update({
                interests: Array.from(new Set(interestTags)).slice(0, 10), // Max 10 interests
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
