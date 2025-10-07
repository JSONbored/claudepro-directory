'use server';

/**
 * Configuration Recommender Actions
 * Server actions for generating personalized configuration recommendations
 *
 * Architecture:
 * - Uses next-safe-action for type-safe server actions
 * - Rate limited to prevent abuse (20 requests per minute per IP)
 * - Loads all configurations in-memory (fast, no database calls)
 * - Designed for extensibility (future LLM integration)
 *
 * Security:
 * - Input validation via Zod schemas
 * - Rate limiting via Redis
 * - No sensitive data exposure
 * - No authentication required (public feature)
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { quizAnswersSchema, type QuizAnswers } from '@/src/lib/schemas/recommender.schema';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import { generateRecommendations } from '@/src/lib/recommender/algorithm';
import { rateLimitedAction } from './safe-action';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';

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
      ] = await Promise.all([
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
        ...agentsData.map((item: Record<string, unknown>) => ({ ...item, category: 'agents' as const })),
        ...mcpData.map((item: Record<string, unknown>) => ({ ...item, category: 'mcp' as const })),
        ...rulesData.map((item: Record<string, unknown>) => ({ ...item, category: 'rules' as const })),
        ...commandsData.map((item: Record<string, unknown>) => ({ ...item, category: 'commands' as const })),
        ...hooksData.map((item: Record<string, unknown>) => ({ ...item, category: 'hooks' as const })),
        ...statuslinesData.map((item: Record<string, unknown>) => ({ ...item, category: 'statuslines' as const })),
        ...collectionsData.map((item: Record<string, unknown>) => ({ ...item, category: 'collections' as const })),
      ];

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
  .action(async ({ parsedInput }: { parsedInput: Pick<QuizAnswers, 'useCase' | 'experienceLevel' | 'toolPreferences'> }) => {
    // Simple event tracking for analytics
    logger.info('Recommendation event tracked', {
      useCase: parsedInput.useCase,
      experienceLevel: parsedInput.experienceLevel,
      toolPreferences: parsedInput.toolPreferences.join(','),
    });

    return {
      success: true,
    };
  });

/**
 * FUTURE: LLM-Enhanced Recommendations
 * 
 * When LLM integration is added, create this action:
 * 
 * export const generateEnhancedRecommendations = rateLimitedAction
 *   .metadata({
 *     actionName: 'generateEnhancedRecommendations',
 *     category: 'content',
 *     rateLimit: {
 *       maxRequests: 5, // Stricter limit for API calls
 *       windowSeconds: 60,
 *     },
 *   })
 *   .schema(quizAnswersSchema.extend({
 *     resultIds: z.array(z.string()).max(5), // Enhance top 5 results
 *   }))
 *   .action(async ({ parsedInput: { answers, resultIds } }) => {
 *     // 1. Load configurations by IDs
 *     // 2. Call LLM API (Groq/OpenAI) for each
 *     // 3. Generate personalized explanations
 *     // 4. Track API usage and costs
 *     // 5. Return enhanced results
 *   });
 */
