/**
 * Configuration Recommender Algorithm
 *
 * Rule-based recommendation engine that scores and ranks configurations
 * based on user quiz answers. Designed for extensibility to support future
 * LLM-enhanced explanations and hybrid recommendation approaches.
 *
 * Architecture:
 * - Pure rule-based scoring for zero-cost, instant recommendations
 * - Weighted multi-factor scoring algorithm
 * - Tag matching, category filtering, popularity boosting
 * - Extensibility hooks for LLM enhancement
 *
 * Performance:
 * - <100ms execution time for full catalog (147+ configs)
 * - In-memory computation, no database calls
 * - Optimized for serverless edge functions
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import {
  type QuizAnswers,
  type RecommendationConfig,
  type RecommendationResult,
  type RecommendationResponse,
  generateResultId,
} from '@/src/lib/schemas/recommender.schema';
import { logger } from '@/src/lib/logger';
import {
  calculateCategoryScore,
  calculateExperienceScore,
  calculateFocusAreaScore,
  calculateIntegrationScore,
  calculatePopularityBoost,
  calculateTagScore,
  calculateTrendingBoost,
  calculateUseCaseScore,
} from './scoring';
import { DEFAULT_WEIGHTS } from './weights';

/**
 * Default recommendation configuration
 */
const DEFAULT_CONFIG: RecommendationConfig = {
  weights: DEFAULT_WEIGHTS,
  maxResults: 10,
  minScore: 20,
  diversityWeight: 0.3,
  enableTrendingBoost: true,
  enablePopularityBoost: true,
  enableLLMEnhancement: false,
};

/**
 * Generate personalized configuration recommendations
 *
 * @param answers - Validated quiz answers from user
 * @param allConfigs - Complete catalog of configurations
 * @param config - Optional algorithm configuration overrides
 * @returns Complete recommendation response with ranked results
 */
export async function generateRecommendations(
  answers: QuizAnswers,
  allConfigs: UnifiedContentItem[],
  config: Partial<RecommendationConfig> = {}
): Promise<RecommendationResponse> {
  const startTime = performance.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Score all configurations
    const scoredConfigs = scoreConfigurations(answers, allConfigs, finalConfig);

    // Filter by minimum score and sort by score (descending)
    const filteredConfigs = scoredConfigs
      .filter((result) => result.matchScore >= finalConfig.minScore)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Apply diversity filter to ensure category mix
    const diverseConfigs = applyDiversityFilter(
      filteredConfigs,
      finalConfig.maxResults,
      finalConfig.diversityWeight
    );

    // Take top N results
    const topResults = diverseConfigs.slice(0, finalConfig.maxResults);

    // Add rank numbers
    const rankedResults = topResults.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

    // Optional: Enhance with LLM explanations (future feature)
    const enhancedResults = finalConfig.enableLLMEnhancement
      ? await enhanceWithLLM(rankedResults, answers)
      : rankedResults;

    // Calculate summary statistics
    const summary = calculateSummary(enhancedResults);

    // Generate unique ID for result caching/sharing
    const resultId = generateResultId(answers);

    const response: RecommendationResponse = {
      results: enhancedResults,
      totalMatches: filteredConfigs.length,
      answers,
      id: resultId,
      generatedAt: new Date().toISOString(),
      algorithm: finalConfig.enableLLMEnhancement ? 'llm-enhanced' : 'rule-based',
      summary,
    };

    const duration = performance.now() - startTime;
    logger.info('Generated recommendations', {
      resultId,
      resultCount: enhancedResults.length,
      totalMatches: filteredConfigs.length,
      duration: `${duration.toFixed(2)}ms`,
      useCase: answers.useCase,
      experienceLevel: answers.experienceLevel,
    });

    return response;
  } catch (error) {
    logger.error(
      'Failed to generate recommendations',
      error instanceof Error ? error : new Error(String(error)),
      {
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
      }
    );
    throw error;
  }
}

/**
 * Score all configurations based on user answers
 */
function scoreConfigurations(
  answers: QuizAnswers,
  allConfigs: UnifiedContentItem[],
  config: RecommendationConfig
): RecommendationResult[] {
  return allConfigs.map((item) => {
    const reasons: RecommendationResult['reasons'] = [];
    let totalScore = 0;

    // 1. Use case matching (35% weight)
    const useCaseScore = calculateUseCaseScore(item, answers.useCase);
    if (useCaseScore > 0) {
      totalScore += useCaseScore * config.weights.useCase;
      reasons.push({
        type: 'use-case-match',
        message: `Optimized for ${answers.useCase.replace('-', ' ')}`,
        weight: Math.round(config.weights.useCase * 100),
      });
    }

    // 2. Tool preference matching (20% weight)
    const categoryScore = calculateCategoryScore(item, answers.toolPreferences);
    if (categoryScore > 0) {
      totalScore += categoryScore * config.weights.toolPreference;
      reasons.push({
        type: 'tag-match',
        message: `Matches your tool preferences (${item.category})`,
        weight: Math.round(config.weights.toolPreference * 100),
      });
    }

    // 3. Experience level matching (15% weight)
    const experienceScore = calculateExperienceScore(item, answers.experienceLevel);
    if (experienceScore > 0) {
      totalScore += experienceScore * config.weights.experience;
      reasons.push({
        type: 'experience-fit',
        message: `Appropriate for ${answers.experienceLevel} users`,
        weight: Math.round(config.weights.experience * 100),
      });
    }

    // 4. Integration matching (15% weight)
    if (answers.integrations && answers.integrations.length > 0) {
      const integrationScore = calculateIntegrationScore(item, answers.integrations);
      if (integrationScore > 0) {
        totalScore += integrationScore * config.weights.integrations;
        reasons.push({
          type: 'tag-match',
          message: 'Supports your required integrations',
          weight: Math.round(config.weights.integrations * 100),
        });
      }
    }

    // 5. Focus area matching (10% weight)
    if (answers.focusAreas && answers.focusAreas.length > 0) {
      const focusScore = calculateFocusAreaScore(item, answers.focusAreas);
      if (focusScore > 0) {
        totalScore += focusScore * config.weights.focusAreas;
        reasons.push({
          type: 'tag-match',
          message: 'Aligns with your focus areas',
          weight: Math.round(config.weights.focusAreas * 100),
        });
      }
    }

    // 6. Tag-based matching (implicit, part of above scores)
    const tagScore = calculateTagScore(item, answers);
    if (tagScore > 0) {
      totalScore += tagScore * 0.05; // Small boost for additional tag matches
    }

    // 7. Popularity boost (3% weight)
    if (config.enablePopularityBoost) {
      const popularityBoost = calculatePopularityBoost(item);
      totalScore += popularityBoost * config.weights.popularity;
      if (item.popularity && item.popularity > 80) {
        reasons.push({
          type: 'popularity',
          message: 'Popular with the community',
          weight: Math.round(config.weights.popularity * 100),
        });
      }
    }

    // 8. Trending boost (2% weight)
    if (config.enableTrendingBoost) {
      const trendingBoost = calculateTrendingBoost(item);
      totalScore += trendingBoost * config.weights.trending;
      if (item.growthRate && item.growthRate > 0.5) {
        reasons.push({
          type: 'trending',
          message: 'Trending in the community',
          weight: Math.round(config.weights.trending * 100),
        });
      }
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(100, Math.round(totalScore));

    // Determine primary reason (highest weight)
    const primaryReason =
      reasons.length > 0
        ? reasons.sort((a, b) => (b.weight || 0) - (a.weight || 0))[0].message
        : 'General match';

    return {
      slug: item.slug,
      title: item.title || item.name || item.slug,
      description: item.description,
      category: item.category as RecommendationResult['category'],
      matchScore: normalizedScore,
      matchPercentage: normalizedScore,
      rank: 0, // Will be assigned after sorting
      reasons,
      primaryReason,
      author: item.author,
      tags: item.tags || [],
      popularity: item.popularity,
      viewCount: item.viewCount,
      aiEnhanced: false,
    };
  });
}

/**
 * Apply diversity filter to ensure variety in results
 * Prevents all results being from same category
 */
function applyDiversityFilter(
  results: RecommendationResult[],
  maxResults: number,
  diversityWeight: number
): RecommendationResult[] {
  if (diversityWeight === 0 || results.length <= maxResults) {
    return results;
  }

  const selected: RecommendationResult[] = [];
  const categoryCount: Record<string, number> = {};

  // Select top result first (always include highest match)
  if (results[0]) {
    selected.push(results[0]);
    categoryCount[results[0].category] = 1;
  }

  // For remaining slots, balance between score and diversity
  for (let i = 1; i < results.length && selected.length < maxResults; i++) {
    const candidate = results[i];
    const categoryOccurrences = categoryCount[candidate.category] || 0;

    // Calculate diversity penalty (more occurrences = higher penalty)
    const diversityPenalty = categoryOccurrences * diversityWeight * 10;

    // Adjust score based on diversity
    const adjustedScore = candidate.matchScore - diversityPenalty;

    // Always include if still high score after penalty, or if we need to fill slots
    if (adjustedScore >= 50 || selected.length >= maxResults - 2) {
      selected.push(candidate);
      categoryCount[candidate.category] = categoryOccurrences + 1;
    }
  }

  // Fill remaining slots if needed
  if (selected.length < maxResults) {
    for (let i = 1; i < results.length && selected.length < maxResults; i++) {
      if (!selected.includes(results[i])) {
        selected.push(results[i]);
      }
    }
  }

  return selected;
}

/**
 * Calculate summary statistics for results
 */
function calculateSummary(
  results: RecommendationResult[]
): RecommendationResponse['summary'] {
  if (results.length === 0) {
    return {
      topCategory: 'none',
      avgMatchScore: 0,
      diversityScore: 0,
    };
  }

  // Find most common category
  const categoryCounts: Record<string, number> = {};
  for (const result of results) {
    categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
  }
  const topCategory =
    Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

  // Calculate average match score
  const avgMatchScore = Math.round(
    results.reduce((sum, r) => sum + r.matchScore, 0) / results.length
  );

  // Calculate diversity score (0-100, higher = more diverse)
  const uniqueCategories = Object.keys(categoryCounts).length;
  const maxPossibleCategories = 7; // agents, mcp, rules, commands, hooks, statuslines, collections
  const diversityScore = Math.round((uniqueCategories / maxPossibleCategories) * 100);

  return {
    topCategory,
    avgMatchScore,
    diversityScore,
  };
}

/**
 * Enhance recommendations with LLM-generated explanations
 * 🚀 FUTURE FEATURE: Hooks for AI integration
 *
 * When enabled, this function will:
 * 1. Send configuration details + user context to LLM
 * 2. Generate personalized explanation of why config matches
 * 3. Add implementation tips specific to user's use case
 * 4. Track API usage and costs
 *
 * @param results - Base recommendations to enhance
 * @param answers - User context for personalization
 * @returns Enhanced recommendations with AI-generated content
 */
async function enhanceWithLLM(
  results: RecommendationResult[],
  answers: QuizAnswers
): Promise<RecommendationResult[]> {
  // FUTURE: LLM integration point
  // This is where we'd call Groq, OpenAI, or other LLM API
  // For now, return results unchanged

  logger.info('LLM enhancement requested but not yet implemented', {
    resultCount: results.length,
    useCase: answers.useCase,
  });

  // Example structure for future implementation:
  /*
  const startTime = performance.now();
  
  try {
    const enhancedResults = await Promise.all(
      results.map(async (result) => {
        const prompt = generateExplanationPrompt(result, answers);
        const aiExplanation = await callLLMAPI(prompt);
        
        return {
          ...result,
          aiEnhanced: true,
          aiExplanation,
        };
      })
    );
    
    const duration = performance.now() - startTime;
    
    return enhancedResults;
  } catch (error) {
    logger.error('LLM enhancement failed, falling back to rule-based', error);
    return results; // Graceful fallback
  }
  */

  return results;
}

/**
 * FUTURE: Generate LLM prompt for personalized explanations
 * This function will be implemented when LLM enhancement is added
 */
/*
function generateExplanationPrompt(
  result: RecommendationResult,
  answers: QuizAnswers
): string {
  return `
You are a Claude AI expert helping users choose the right configuration.

User Context:
- Use Case: ${answers.useCase}
- Experience Level: ${answers.experienceLevel}
- Tool Preferences: ${answers.toolPreferences.join(', ')}

Recommended Configuration:
- Name: ${result.title}
- Category: ${result.category}
- Description: ${result.description}
- Match Score: ${result.matchScore}%

Generate a brief (2-3 sentences), personalized explanation of:
1. Why this configuration is a great fit for their specific use case
2. One concrete way they could use it in their workflow

Keep it friendly, actionable, and specific to their context.
  `.trim();
}
*/
