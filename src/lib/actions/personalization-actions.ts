'use server';

/**
 * Personalization Actions
 * Server actions for personalized recommendations and similar configs
 *
 * Features:
 * - For You feed generation
 * - Similar configs recommendations
 * - Usage-based recommendations
 * - Collaborative filtering
 */

import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import {
  buildUserContext,
  generateColdStartRecommendations,
  generateForYouFeed,
  hasPersonalizationData,
} from '@/src/lib/personalization/for-you-feed';
import { getUsageBasedRecommendations } from '@/src/lib/personalization/usage-based-recommender';
import type { PersonalizedContentItem } from '@/src/lib/personalization/types';
import { statsRedis } from '@/src/lib/redis';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import {
  type ForYouFeedResponse,
  forYouFeedResponseSchema,
  forYouQuerySchema,
  type SimilarConfigsResponse,
  similarConfigsQuerySchema,
  similarConfigsResponseSchema,
  type UsageRecommendationResponse,
  usageRecommendationResponseSchema,
} from '@/src/lib/schemas/personalization.schema';
import { createClient } from '@/src/lib/supabase/server';

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
          ] = await Promise.all([
            lazyContentLoaders.agents(),
            lazyContentLoaders.mcp(),
            lazyContentLoaders.rules(),
            lazyContentLoaders.commands(),
            lazyContentLoaders.hooks(),
            lazyContentLoaders.statuslines(),
            lazyContentLoaders.collections(),
          ]);

          const allContent: UnifiedContentItem[] = [
            ...agentsData.map((item: Record<string, unknown>) => ({ ...item, category: 'agents' as const })),
            ...mcpData.map((item: Record<string, unknown>) => ({ ...item, category: 'mcp' as const })),
            ...rulesData.map((item: Record<string, unknown>) => ({ ...item, category: 'rules' as const })),
            ...commandsData.map((item: Record<string, unknown>) => ({ ...item, category: 'commands' as const })),
            ...hooksData.map((item: Record<string, unknown>) => ({ ...item, category: 'hooks' as const })),
            ...statuslinesData.map((item: Record<string, unknown>) => ({ ...item, category: 'statuslines' as const })),
            ...collectionsData.map((item: Record<string, unknown>) => ({ ...item, category: 'collections' as const })),
          ] as UnifiedContentItem[];

          // Enrich with view counts
          const enrichedContent = await statsRedis.enrichWithViewCounts(allContent);

          // Fetch user affinities
          const { data: affinities } = await supabase
            .from('user_affinities')
            .select('content_type, content_slug, affinity_score')
            .eq('user_id', userId)
            .gte('affinity_score', 20)
            .order('affinity_score', { ascending: false })
            .limit(50);

          // Fetch bookmarks
          const { data: bookmarks } = await supabase
            .from('bookmarks')
            .select('content_type, content_slug')
            .eq('user_id', userId);

          // Fetch recent views (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: recentViews } = await supabase
            .from('user_interactions')
            .select('content_type, content_slug')
            .eq('user_id', userId)
            .eq('interaction_type', 'view')
            .gte('created_at', sevenDaysAgo.toISOString());

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
            categoryScores.get(aff.content_type)!.push(aff.affinity_score);
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
          const trendingKeys = await Promise.all(
            ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'].map(
              async (cat: string) => {
                const trending = await statsRedis.getTrending(cat, 10);
                return trending.map((slug: string) => `${cat}:${slug}`);
              }
            )
          );
          const trendingSet = new Set<string>(trendingKeys.flat());

          // Check if user has sufficient personalization data
          const hasHistory = hasPersonalizationData(userContext);

          let recommendations;
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
            recommendations: recommendations.map((rec: UnifiedContentItem & {
              recommendation_source?: PersonalizedContentItem['recommendation_source'];
              recommendation_reason?: string;
              affinity_score?: number;
            }) => ({
              slug: rec.slug,
              title: rec.title || rec.name || rec.slug,
              description: rec.description,
              category: rec.category,
              url: `/${rec.category}/${rec.slug}`,
              score: rec.affinity_score || 50,
              source: rec.recommendation_source || 'trending',
              reason: rec.recommendation_reason,
              view_count: (rec as UnifiedContentItem & { viewCount?: number }).viewCount,
              popularity: rec.popularity,
              author: rec.author,
              tags: rec.tags || [],
            })),
            total_count: recommendations.length,
            sources_used: [...new Set(recommendations.map((r: UnifiedContentItem & { recommendation_source?: PersonalizedContentItem['recommendation_source'] }) => r.recommendation_source || 'trending'))],
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
    const supabase = await createClient();

    try {
      // Check database for pre-computed similarities
      const { data: similarities, error } = await supabase
        .from('content_similarities')
        .select('*')
        .eq('content_a_type', parsedInput.content_type)
        .eq('content_a_slug', parsedInput.content_slug)
        .order('similarity_score', { ascending: false })
        .limit(parsedInput.limit);

      if (error) {
        logger.error('Failed to fetch similarities from database', error);
        // Fall back to real-time calculation
      }

      if (similarities && similarities.length > 0) {
        // Return pre-computed similarities
        const response: SimilarConfigsResponse = {
          similar_items: similarities.map((sim: {
            content_b_slug: string;
            content_b_type: string;
            similarity_score: number;
          }) => ({
            slug: sim.content_b_slug,
            title: sim.content_b_slug, // Will be enriched by client
            description: '',
            category: sim.content_b_type as ContentCategory,
            url: `/${sim.content_b_type}/${sim.content_b_slug}`,
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
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof usageRecommendationInputSchema> }) => {
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
      ] = await Promise.all([
        lazyContentLoaders.agents(),
        lazyContentLoaders.mcp(),
        lazyContentLoaders.rules(),
        lazyContentLoaders.commands(),
        lazyContentLoaders.hooks(),
        lazyContentLoaders.statuslines(),
        lazyContentLoaders.collections(),
      ]);

      const allContent: UnifiedContentItem[] = [
        ...agentsData.map((item: Record<string, unknown>) => ({ ...item, category: 'agents' as const })),
        ...mcpData.map((item: Record<string, unknown>) => ({ ...item, category: 'mcp' as const })),
        ...rulesData.map((item: Record<string, unknown>) => ({ ...item, category: 'rules' as const })),
        ...commandsData.map((item: Record<string, unknown>) => ({ ...item, category: 'commands' as const })),
        ...hooksData.map((item: Record<string, unknown>) => ({ ...item, category: 'hooks' as const })),
        ...statuslinesData.map((item: Record<string, unknown>) => ({ ...item, category: 'statuslines' as const })),
        ...collectionsData.map((item: Record<string, unknown>) => ({ ...item, category: 'collections' as const })),
      ] as UnifiedContentItem[];

      // Find current item if provided
      let currentItem: UnifiedContentItem | undefined;
      if (parsedInput.content_type && parsedInput.content_slug) {
        currentItem = allContent.find(
          (item) =>
            item.category === parsedInput.content_type && item.slug === parsedInput.content_slug
        );
      }

      // Get user affinities if authenticated
      let userAffinities = new Map<string, number>();
      if (user) {
        const { data: affinities } = await supabase
          .from('user_affinities')
          .select('content_type, content_slug, affinity_score')
          .eq('user_id', user.id);

        if (affinities) {
          for (const aff of affinities) {
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
          slug: (rec as UnifiedContentItem).slug,
          title: (rec as UnifiedContentItem).title || (rec as UnifiedContentItem).name || (rec as UnifiedContentItem).slug,
          description: (rec as UnifiedContentItem).description,
          category: (rec as UnifiedContentItem).category,
          url: `/${(rec as UnifiedContentItem).category}/${(rec as UnifiedContentItem).slug}`,
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
  });
