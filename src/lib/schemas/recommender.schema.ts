/**
 * Configuration Recommender Schema Definitions
 *
 * Schemas for the AI-powered configuration recommender feature.
 * Handles quiz questions, user answers, recommendation results, and sharing.
 *
 * Architecture Note: Designed to support both rule-based and LLM-enhanced
 * recommendations. The schema accommodates future AI features through the
 * optional 'aiEnhanced' and 'aiExplanation' fields.
 *
 * Security Standards:
 * - All user inputs validated with strict Zod schemas
 * - Enum-based answers prevent injection attacks
 * - Max length constraints on all string fields
 * - URL encoding for shareable results
 */

import { z } from 'zod';
import { nonEmptyString, shortString, mediumString } from './primitives/base-strings';
import { percentage, positiveInt } from './primitives/base-numbers';

/**
 * Primary Use Case Options
 * Maps to content categories and tags in the recommendation algorithm
 */
export const useCaseSchema = z
  .enum([
    'code-review',
    'api-development',
    'frontend-development',
    'data-science',
    'content-creation',
    'devops-infrastructure',
    'general-development',
    'testing-qa',
    'security-audit',
  ])
  .describe('Primary use case for Claude configuration recommendations');

export type UseCase = z.infer<typeof useCaseSchema>;

/**
 * Experience Level Options
 * Filters configuration complexity appropriately
 */
export const experienceLevelSchema = z
  .enum(['beginner', 'intermediate', 'advanced'])
  .describe('User experience level with Claude AI');

export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;

/**
 * Tool Preference Options
 * Maps directly to content categories
 */
export const toolPreferenceSchema = z
  .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'])
  .describe('Preferred Claude configuration tool type');

export type ToolPreference = z.infer<typeof toolPreferenceSchema>;

/**
 * Integration Need Options
 * Used for tag-based filtering and scoring
 */
export const integrationNeedSchema = z
  .enum([
    'github',
    'database',
    'cloud-aws',
    'cloud-gcp',
    'cloud-azure',
    'communication',
    'none',
  ])
  .describe('Required integration capabilities');

export type IntegrationNeed = z.infer<typeof integrationNeedSchema>;

/**
 * Focus Area Options
 * Additional filtering dimension for precise recommendations
 */
export const focusAreaSchema = z
  .enum([
    'security',
    'performance',
    'documentation',
    'testing',
    'code-quality',
    'automation',
  ])
  .describe('Primary focus area for configuration selection');

export type FocusArea = z.infer<typeof focusAreaSchema>;

/**
 * Team Size Options
 * Influences collaboration-focused recommendations
 */
export const teamSizeSchema = z
  .enum(['solo', 'small', 'large'])
  .describe('Team size for collaboration requirements');

export type TeamSize = z.infer<typeof teamSizeSchema>;

/**
 * Complete Quiz Answers Schema
 * Validated user input for recommendation generation
 */
export const quizAnswersSchema = z
  .object({
    // Required questions
    useCase: useCaseSchema.describe('Primary use case (required)'),
    experienceLevel: experienceLevelSchema.describe('Experience level (required)'),
    toolPreferences: z
      .array(toolPreferenceSchema)
      .min(1, 'Select at least one tool type')
      .max(5, 'Maximum 5 tool types')
      .describe('Preferred tool types (1-5 selections)'),

    // Optional questions
    integrations: z
      .array(integrationNeedSchema)
      .max(5, 'Maximum 5 integrations')
      .default([])
      .describe('Required integrations (optional)'),
    focusAreas: z
      .array(focusAreaSchema)
      .max(3, 'Maximum 3 focus areas')
      .default([])
      .describe('Primary focus areas (optional)'),
    teamSize: teamSizeSchema.optional().describe('Team size (optional)'),

    // Metadata
    timestamp: z
      .string()
      .datetime()
      .optional()
      .describe('Submission timestamp for analytics'),
  })
  .describe('Complete quiz answer set for recommendation generation');

export type QuizAnswers = z.infer<typeof quizAnswersSchema>;

/**
 * Recommendation Reason
 * Explains why a configuration was recommended
 */
export const recommendationReasonSchema = z
  .object({
    type: z
      .enum(['use-case-match', 'tag-match', 'popularity', 'experience-fit', 'trending'])
      .describe('Type of recommendation reason'),
    message: mediumString.describe('Human-readable explanation'),
    weight: percentage.optional().describe('Weight of this reason in total score (0-100)'),
  })
  .describe('Individual reason for recommending a configuration');

export type RecommendationReason = z.infer<typeof recommendationReasonSchema>;

/**
 * Single Recommendation Result
 * A recommended configuration with scoring and explanation
 */
export const recommendationResultSchema = z
  .object({
    // Configuration identification
    slug: nonEmptyString.max(200).describe('Configuration slug identifier'),
    title: nonEmptyString.max(200).describe('Configuration title'),
    description: mediumString.describe('Configuration description'),
    category: z
      .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'])
      .describe('Configuration category'),

    // Scoring and matching
    matchScore: percentage.describe('Overall match score (0-100)'),
    matchPercentage: percentage.describe('User-friendly match percentage (0-100)'),
    rank: positiveInt.describe('Ranking position in results (1-based)'),

    // Explanation
    reasons: z
      .array(recommendationReasonSchema)
      .min(1)
      .describe('List of reasons for recommendation'),
    primaryReason: shortString.describe('Primary reason summary'),

    // Metadata
    author: shortString.describe('Configuration author'),
    tags: z.array(shortString).describe('Configuration tags'),
    popularity: percentage.optional().describe('Popularity score (0-100)'),
    viewCount: positiveInt.optional().describe('View count'),

    // Future: LLM enhancement support
    aiEnhanced: z.boolean().default(false).describe('Whether AI-generated explanation is used'),
    aiExplanation: mediumString
      .optional()
      .describe('Optional AI-generated personalized explanation'),
  })
  .describe('Single configuration recommendation with scoring and explanation');

export type RecommendationResult = z.infer<typeof recommendationResultSchema>;

/**
 * Complete Recommendation Response
 * Full results returned to user
 */
export const recommendationResponseSchema = z
  .object({
    // Results
    results: z
      .array(recommendationResultSchema)
      .min(1)
      .max(20)
      .describe('Recommended configurations (1-20 results)'),
    totalMatches: positiveInt.describe('Total number of matching configurations'),

    // User input (for display and sharing)
    answers: quizAnswersSchema.describe('User quiz answers'),

    // Metadata
    id: nonEmptyString.max(100).describe('Unique result ID for sharing'),
    generatedAt: z.string().datetime().describe('Result generation timestamp'),
    algorithm: z
      .enum(['rule-based', 'llm-enhanced', 'hybrid'])
      .default('rule-based')
      .describe('Recommendation algorithm used'),

    // Summary
    summary: z
      .object({
        topCategory: shortString.describe('Most recommended category'),
        avgMatchScore: percentage.describe('Average match score across results'),
        diversityScore: percentage.describe('Category diversity in results (0-100)'),
      })
      .describe('Results summary statistics'),

    // Future: LLM support
    aiProcessingTime: positiveInt.optional().describe('AI processing time in milliseconds'),
    aiTokensUsed: positiveInt.optional().describe('AI tokens consumed (for cost tracking)'),
  })
  .describe('Complete recommendation response with results and metadata');

export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;

/**
 * Shareable Result Schema
 * Encoded format for URL sharing
 */
export const shareableResultSchema = z
  .object({
    answers: quizAnswersSchema.describe('Quiz answers to encode'),
    resultId: nonEmptyString.max(100).optional().describe('Optional cached result ID'),
  })
  .describe('Data structure for generating shareable result URLs');

export type ShareableResult = z.infer<typeof shareableResultSchema>;

/**
 * Quiz Progress Schema
 * Tracks user progress through quiz
 */
export const quizProgressSchema = z
  .object({
    currentQuestion: positiveInt.max(10).describe('Current question number (1-based)'),
    totalQuestions: positiveInt.max(10).describe('Total number of questions'),
    completedQuestions: z
      .array(positiveInt)
      .max(10)
      .describe('Array of completed question numbers'),
    percentComplete: percentage.describe('Progress percentage (0-100)'),
  })
  .describe('User progress through quiz questions');

export type QuizProgress = z.infer<typeof quizProgressSchema>;

/**
 * Recommendation Config Schema
 * Configuration for the recommendation algorithm
 */
export const recommendationConfigSchema = z
  .object({
    // Scoring weights (must sum to 1.0)
    weights: z
      .object({
        useCase: z.number().min(0).max(1).describe('Use case match weight'),
        experience: z.number().min(0).max(1).describe('Experience level weight'),
        toolPreference: z.number().min(0).max(1).describe('Tool preference weight'),
        integrations: z.number().min(0).max(1).describe('Integration match weight'),
        focusAreas: z.number().min(0).max(1).describe('Focus area match weight'),
        popularity: z.number().min(0).max(1).describe('Popularity boost weight'),
        trending: z.number().min(0).max(1).describe('Trending boost weight'),
      })
      .refine(
        (weights): boolean => {
          const values = Object.values(weights) as number[];
          const sum = values.reduce((a, b) => a + b, 0);
          return Math.abs(sum - 1.0) < 0.01; // Allow small floating point error
        },
        { message: 'Weights must sum to 1.0' }
      )
      .describe('Scoring weights for recommendation algorithm'),

    // Result configuration
    maxResults: positiveInt.max(50).default(10).describe('Maximum results to return'),
    minScore: percentage.default(20).describe('Minimum match score threshold (0-100)'),
    diversityWeight: z
      .number()
      .min(0)
      .max(1)
      .default(0.3)
      .describe('Weight for category diversity (0-1)'),

    // Feature flags
    enableTrendingBoost: z.boolean().default(true).describe('Apply trending content boost'),
    enablePopularityBoost: z.boolean().default(true).describe('Apply popularity boost'),
    enableLLMEnhancement: z
      .boolean()
      .default(false)
      .describe('Enable LLM-generated explanations (requires API key)'),
  })
  .describe('Configuration for recommendation algorithm behavior');

export type RecommendationConfig = z.infer<typeof recommendationConfigSchema>;

/**
 * Analytics Event Schema
 * For tracking recommender usage
 */
export const recommenderAnalyticsEventSchema = z
  .object({
    event: z
      .enum([
        'quiz_started',
        'quiz_question_answered',
        'quiz_completed',
        'quiz_abandoned',
        'results_viewed',
        'result_clicked',
        'results_shared',
        'results_bookmarked',
      ])
      .describe('Event type'),
    answers: quizAnswersSchema.optional().describe('Quiz answers (when applicable)'),
    resultId: nonEmptyString.optional().describe('Result ID (when applicable)'),
    configSlug: nonEmptyString.optional().describe('Clicked config slug (when applicable)'),
    questionNumber: positiveInt.optional().describe('Question number (for answer events)'),
    timestamp: z.string().datetime().describe('Event timestamp'),
  })
  .describe('Analytics event for recommender feature tracking');

export type RecommenderAnalyticsEvent = z.infer<typeof recommenderAnalyticsEventSchema>;

/**
 * Helper: Encode answers for URL sharing
 * Converts quiz answers to base64-encoded string
 * Server-side only function (uses Node.js Buffer)
 */
export function encodeQuizAnswers(answers: QuizAnswers): string {
  try {
    const json = JSON.stringify(answers);
    // Use Buffer in Node.js environment (this is server-only code)
    // @ts-expect-error - Buffer is available in Node.js environment
    return Buffer.from(json).toString('base64url');
  } catch (error) {
    throw new Error('Failed to encode quiz answers');
  }
}

/**
 * Helper: Decode answers from URL
 * Validates and parses base64-encoded quiz answers
 * Server-side only function (uses Node.js Buffer)
 */
export function decodeQuizAnswers(encoded: string): QuizAnswers {
  try {
    // Use Buffer in Node.js environment (this is server-only code)
    // @ts-expect-error - Buffer is available in Node.js environment
    const json: string = Buffer.from(encoded, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);
    return quizAnswersSchema.parse(parsed);
  } catch (error) {
    throw new Error('Invalid or corrupted quiz answers data');
  }
}

/**
 * Helper: Generate unique result ID
 * Creates deterministic ID based on answers for caching
 */
export function generateResultId(answers: QuizAnswers): string {
  // Create deterministic hash from answers
  const key = [
    answers.useCase,
    answers.experienceLevel,
    answers.toolPreferences.sort().join(','),
    answers.integrations?.sort().join(',') || '',
    answers.focusAreas?.sort().join(',') || '',
    answers.teamSize || '',
  ].join('|');

  // Simple hash function (for deterministic IDs, not security)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `rec_${Math.abs(hash).toString(36)}`;
}
