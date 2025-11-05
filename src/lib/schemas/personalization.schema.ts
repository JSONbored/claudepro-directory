/**
 * Personalization Engine - Zod Schemas (Database-First)
 * Type-safe schemas for personalization features
 *
 * Architecture:
 * - Database schemas from db-schemas.ts (user_interactions, user_affinities, etc.)
 * - Transform schemas for client inputs (omit server fields)
 * - Response schemas for API outputs (non-database types)
 *
 * Covers:
 * - User interactions
 * - Affinity scores
 * - Similarity matrices
 * - Recommendation responses
 */

import { z } from 'zod';
import { Constants, type Enums } from '@/src/types/database.types';
import {
  publicContentSimilaritiesRowSchema,
  publicUserAffinitiesRowSchema,
  publicUserInteractionsInsertSchema,
  publicUserInteractionsRowSchema,
  publicUserSimilaritiesRowSchema,
} from './generated/db-schemas';
import { nonEmptyString, percentage, positiveInt } from './primitives';

/**
 * Category ID validation schema
 * Derives from database enum: Constants.public.Enums.content_category
 * @see Database enum: content_category
 */
const categoryIdSchema = z.enum([...Constants.public.Enums.content_category] as [
  Enums<'content_category'>,
  ...Enums<'content_category'>[],
]);

const contentSlugSchema = nonEmptyString.max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const userIdSchema = nonEmptyString.uuid();

// =====================================================
// USER INTERACTIONS (Database-First)
// =====================================================

// Database row schema (for query results)
export const userInteractionSchema = publicUserInteractionsRowSchema;
export type UserInteraction = z.infer<typeof userInteractionSchema>;

// Interaction type enum (extracted from database)
export const interactionTypeSchema = z.enum(['view', 'copy', 'bookmark', 'click', 'time_spent']);
export type InteractionType = z.infer<typeof interactionTypeSchema>;

// Client input schema for tracking interactions (omit server fields)
export const trackInteractionSchema = publicUserInteractionsInsertSchema.omit({
  id: true,
  created_at: true,
  user_id: true, // Server adds from auth
});

export type TrackInteractionInput = z.infer<typeof trackInteractionSchema>;

// =====================================================
// AFFINITY SCORES (Database-First)
// =====================================================

// Database row schema (for query results)
export const affinityScoreSchema = publicUserAffinitiesRowSchema;
export type AffinityScore = z.infer<typeof affinityScoreSchema>;

// Response for user's top affinities
export const userAffinitiesResponseSchema = z.object({
  affinities: z.array(affinityScoreSchema),
  total_count: positiveInt,
  last_calculated: z.string().datetime().optional(),
});

export type UserAffinitiesResponse = z.infer<typeof userAffinitiesResponseSchema>;

// =====================================================
// SIMILARITY MATRICES (Database-First)
// =====================================================

// User similarity (database row schema)
export const userSimilaritySchema = publicUserSimilaritiesRowSchema;
export type UserSimilarity = z.infer<typeof userSimilaritySchema>;

// Content similarity (database row schema)
export const contentSimilaritySchema = publicContentSimilaritiesRowSchema;
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
  slug: contentSlugSchema,
  title: nonEmptyString,
  description: z.string(),
  category: categoryIdSchema,
  url: z.string().url(),

  // Scoring
  score: percentage,
  source: recommendationSourceSchema,
  reason: z.string().optional(),

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
    slug: contentSlugSchema,
    category: categoryIdSchema,
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
  category: categoryIdSchema.optional(),
  exclude_bookmarked: z.boolean().default(false),
});

export type ForYouQuery = z.infer<typeof forYouQuerySchema>;

export const similarConfigsQuerySchema = z.object({
  content_type: categoryIdSchema,
  content_slug: contentSlugSchema,
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
  content_slug: contentSlugSchema,
  content_type: z.string(),
});

export const recommendationClickedEventSchema = z.object({
  content_slug: contentSlugSchema,
  content_type: z.string(),
  position: z.number(),
  recommendation_source: z.string(),
});

export const similarConfigClickedEventSchema = z.object({
  source_slug: contentSlugSchema,
  target_slug: contentSlugSchema,
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
