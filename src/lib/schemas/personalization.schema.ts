/**
 * Personalization Engine - Zod Schemas
 * Type-safe schemas for personalization features
 *
 * Covers:
 * - User interactions
 * - Affinity scores
 * - Similarity matrices
 * - Recommendation responses
 */

import { z } from 'zod';
import { contentIdSchema, sessionIdSchema, userIdSchema } from './branded-types.schema';
import { percentage, positiveInt } from './primitives/base-numbers';
import { nonEmptyString } from './primitives/base-strings';
import { contentCategorySchema } from './shared.schema';

// =====================================================
// USER INTERACTIONS
// =====================================================

export const interactionTypeSchema = z.enum(['view', 'copy', 'bookmark', 'click', 'time_spent']);
export type InteractionType = z.infer<typeof interactionTypeSchema>;

export const userInteractionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: userIdSchema,
  content_type: contentCategorySchema,
  content_slug: contentIdSchema,
  interaction_type: interactionTypeSchema,
  session_id: sessionIdSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime().optional(),
});

export type UserInteraction = z.infer<typeof userInteractionSchema>;

// Input schema for tracking interactions
export const trackInteractionSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: contentIdSchema,
  interaction_type: interactionTypeSchema,
  session_id: sessionIdSchema.optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
});

export type TrackInteractionInput = z.infer<typeof trackInteractionSchema>;

// =====================================================
// AFFINITY SCORES
// =====================================================

export const affinityScoreSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: userIdSchema,
  content_type: contentCategorySchema,
  content_slug: contentIdSchema,
  affinity_score: z.number().min(0).max(100),
  based_on: z
    .object({
      views: positiveInt.default(0),
      bookmarks: positiveInt.default(0),
      copies: positiveInt.default(0),
      time_spent: positiveInt.default(0), // seconds
      recency_boost: z.number().default(0),
    })
    .optional(),
  calculated_at: z.string().datetime().optional(),
});

export type AffinityScore = z.infer<typeof affinityScoreSchema>;

// Response for user's top affinities
export const userAffinitiesResponseSchema = z.object({
  affinities: z.array(affinityScoreSchema),
  total_count: positiveInt,
  last_calculated: z.string().datetime().optional(),
});

export type UserAffinitiesResponse = z.infer<typeof userAffinitiesResponseSchema>;

// =====================================================
// SIMILARITY MATRICES
// =====================================================

// User similarity
export const userSimilaritySchema = z.object({
  id: z.string().uuid().optional(),
  user_a_id: userIdSchema,
  user_b_id: userIdSchema,
  similarity_score: z.number().min(0).max(1),
  common_items: positiveInt.default(0),
  calculated_at: z.string().datetime().optional(),
});

export type UserSimilarity = z.infer<typeof userSimilaritySchema>;

// Content similarity
export const contentSimilaritySchema = z.object({
  id: z.string().uuid().optional(),
  content_a_type: contentCategorySchema,
  content_a_slug: contentIdSchema,
  content_b_type: contentCategorySchema,
  content_b_slug: contentIdSchema,
  similarity_score: z.number().min(0).max(1),
  similarity_factors: z
    .object({
      tag_overlap: z.number().min(0).max(1).optional(),
      category_match: z.number().min(0).max(1).optional(),
      co_bookmark: z.number().min(0).max(1).optional(),
      description_similarity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  calculated_at: z.string().datetime().optional(),
});

export type ContentSimilarity = z.infer<typeof contentSimilaritySchema>;

// =====================================================
// RECOMMENDATION RESPONSES
// =====================================================

// Recommendation source types
export const recommendationSourceSchema = z.enum([
  'affinity',
  'collaborative',
  'trending',
  'interest',
  'similar',
  'usage',
]);

export type RecommendationSource = z.infer<typeof recommendationSourceSchema>;

// Single recommendation item
export const personalizedRecommendationSchema = z.object({
  slug: contentIdSchema,
  title: nonEmptyString,
  description: z.string(),
  category: contentCategorySchema,
  url: z.string().url(),

  // Scoring
  score: percentage,
  source: recommendationSourceSchema,
  reason: z.string().optional(), // Human-readable explanation

  // Metadata
  view_count: positiveInt.optional(),
  popularity: percentage.optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type PersonalizedRecommendation = z.infer<typeof personalizedRecommendationSchema>;

// For You feed response
export const forYouFeedResponseSchema = z.object({
  recommendations: z.array(personalizedRecommendationSchema),
  total_count: positiveInt,
  sources_used: z.array(recommendationSourceSchema),
  user_has_history: z.boolean(),
  generated_at: z.string().datetime(),
});

export type ForYouFeedResponse = z.infer<typeof forYouFeedResponseSchema>;

// Similar configs response
export const similarConfigsResponseSchema = z.object({
  similar_items: z.array(personalizedRecommendationSchema),
  source_item: z.object({
    slug: contentIdSchema,
    category: contentCategorySchema,
  }),
  algorithm_version: z.string().default('v1.0'),
});

export type SimilarConfigsResponse = z.infer<typeof similarConfigsResponseSchema>;

// Usage-based recommendation response
export const usageRecommendationResponseSchema = z.object({
  recommendations: z.array(personalizedRecommendationSchema),
  trigger: z.enum(['after_bookmark', 'after_copy', 'extended_time', 'category_browse']),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type UsageRecommendationResponse = z.infer<typeof usageRecommendationResponseSchema>;

// =====================================================
// QUERY PARAMETERS
// =====================================================

export const forYouQuerySchema = z.object({
  limit: positiveInt.max(50).default(12),
  offset: positiveInt.default(0),
  category: contentCategorySchema.optional(),
  exclude_bookmarked: z.boolean().default(false),
});

export type ForYouQuery = z.infer<typeof forYouQuerySchema>;

export const similarConfigsQuerySchema = z.object({
  content_type: contentCategorySchema,
  content_slug: contentIdSchema,
  limit: positiveInt.max(20).default(6),
});

export type SimilarConfigsQuery = z.infer<typeof similarConfigsQuerySchema>;

// =====================================================
// ANALYTICS PAYLOADS
// =====================================================

export const affinityCalculatedEventSchema = z.object({
  user_id: userIdSchema,
  content_type: z.string(),
  affinity_score: z.number(),
  based_on_interactions: z.number(),
});

export const recommendationShownEventSchema = z.object({
  recommendation_source: z.string(),
  position: z.number(),
  content_slug: contentIdSchema,
  content_type: z.string(),
});

export const recommendationClickedEventSchema = z.object({
  content_slug: contentIdSchema,
  content_type: z.string(),
  position: z.number(),
  recommendation_source: z.string(),
});

export const similarConfigClickedEventSchema = z.object({
  source_slug: contentIdSchema,
  target_slug: contentIdSchema,
  similarity_score: z.number(),
});

export const forYouViewedEventSchema = z.object({
  items_shown: z.number(),
  algorithm_version: z.string(),
  user_has_history: z.boolean(),
});

export const usageRecommendationShownEventSchema = z.object({
  trigger: z.string(),
  recommendations_count: z.number(),
  context_type: z.string().optional(),
});
