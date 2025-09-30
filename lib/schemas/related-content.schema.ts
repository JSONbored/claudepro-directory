/**
 * Related Content Schemas
 * Production-grade validation for related content features
 * Centralized schemas for all related content functionality
 */

import { z } from 'zod';
import {
  isoDatetimeString,
  mediumString,
  nonEmptyString,
  nonNegativeInt,
  percentage,
  positiveInt,
  shortString,
  stringArray,
} from './primitives';

/**
 * Related Content Item Schema
 * Used for displaying related items in carousels and lists
 * Based on actual ContentMetadata structure
 */
export const relatedContentItemSchema = z.object({
  slug: nonEmptyString.max(200),
  description: mediumString,
  category: z.string().max(50),
  author: shortString,
  dateAdded: z.string().max(50),
  tags: stringArray.readonly(),
  source: z.enum(['official', 'community', 'verified', 'claudepro']),
  // Optional fields that may exist on some content types
  name: z.string().optional(),
  title: z.string().optional(),
  githubUsername: z.string().optional(),
  githubUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  // Related content specific fields
  score: percentage,
  matchType: z.enum(['same_category', 'tag_match', 'keyword_match', 'trending']),
  views: z.number().optional(),
  matchDetails: z
    .object({
      matchedTags: stringArray,
      matchedKeywords: stringArray,
    })
    .optional(),
});

export type RelatedContentItem = z.infer<typeof relatedContentItemSchema>;

/**
 * Smart Related Content Props Schema
 * Props for the main SmartRelatedContent component
 */
export const smartRelatedContentPropsSchema = z.object({
  featured: z.array(z.string().max(200)).optional(),
  exclude: z.array(z.string().max(200)).optional(),
  limit: positiveInt.max(50).default(6),
  trackingEnabled: z.boolean().default(true),
  currentTags: z.array(z.string().max(50)).optional(),
  currentKeywords: z.array(shortString).optional(),
  pathname: mediumString.optional(),
  title: z.string().max(200).optional(),
  showTitle: z.boolean().default(true),
});

export type SmartRelatedContentProps = z.infer<typeof smartRelatedContentPropsSchema>;

/**
 * Smart Related Content With Metadata Props Schema
 * Props for the wrapper component that provides metadata
 */
export const smartRelatedContentWithMetadataPropsSchema = smartRelatedContentPropsSchema
  .omit({ currentTags: true, currentKeywords: true })
  .extend({
    pathname: mediumString.optional(), // Allow pathname to be passed explicitly
  });

export type SmartRelatedContentWithMetadataProps = z.infer<
  typeof smartRelatedContentWithMetadataPropsSchema
>;

/**
 * Related Content Performance Metrics Schema
 */
export const relatedContentPerformanceSchema = z.object({
  fetchTime: nonNegativeInt,
  cacheHit: z.boolean(),
  itemCount: nonNegativeInt,
  algorithmVersion: z.string().max(50),
  cacheKey: z.string().optional(),
  ttl: z.number().optional(),
});

export type RelatedContentPerformance = z.infer<typeof relatedContentPerformanceSchema>;

/**
 * Related Carousel Client Props Schema
 * Props for the client-side carousel component
 */
export const relatedCarouselClientPropsSchema = z.object({
  items: z.array(relatedContentItemSchema),
  performance: relatedContentPerformanceSchema,
  title: z.string().max(200).optional(),
  showTitle: z.boolean().default(true),
  trackingEnabled: z.boolean().default(true),
  className: z.string().optional(),
  autoPlay: z.boolean().default(false),
  autoPlayInterval: positiveInt.min(1000).max(10000).default(5000),
  showDots: z.boolean().default(true),
  showArrows: z.boolean().default(true),
});

export type RelatedCarouselClientProps = z.infer<typeof relatedCarouselClientPropsSchema>;

/**
 * Related Content View Event Schema
 * For analytics tracking
 */
export const relatedContentViewEventSchema = z.object({
  eventType: z.literal('related_content_view'),
  timestamp: isoDatetimeString,
  pathname: z.string(),
  itemCount: nonNegativeInt,
  algorithmVersion: z.string(),
  cacheHit: z.boolean(),
  fetchTime: nonNegativeInt,
});

export type RelatedContentViewEvent = z.infer<typeof relatedContentViewEventSchema>;

/**
 * Related Content Click Event Schema
 */
export const relatedContentClickEventSchema = z.object({
  eventType: z.literal('related_content_click'),
  timestamp: isoDatetimeString,
  pathname: z.string(),
  clickedItem: z.object({
    slug: z.string(),
    category: z.string(),
    position: nonNegativeInt,
    score: z.number().optional(),
  }),
  context: z
    .object({
      totalItems: nonNegativeInt,
      algorithmVersion: z.string(),
    })
    .optional(),
});

export type RelatedContentClickEvent = z.infer<typeof relatedContentClickEventSchema>;

/**
 * Related Content Impression Event Schema
 */
export const relatedContentImpressionEventSchema = z.object({
  eventType: z.literal('related_content_impression'),
  timestamp: isoDatetimeString,
  pathname: z.string(),
  visibleItems: z.array(
    z.object({
      slug: z.string(),
      category: z.string(),
      position: nonNegativeInt,
    })
  ),
  viewportPercentage: percentage,
});

export type RelatedContentImpressionEvent = z.infer<typeof relatedContentImpressionEventSchema>;

/**
 * Carousel Navigation Event Schema
 */
export const carouselNavigationEventSchema = z.object({
  eventType: z.literal('carousel_navigation'),
  timestamp: isoDatetimeString,
  pathname: z.string(),
  direction: z.enum(['next', 'previous', 'dot']),
  currentIndex: nonNegativeInt,
  targetIndex: nonNegativeInt,
  totalSlides: nonNegativeInt,
});

export type CarouselNavigationEvent = z.infer<typeof carouselNavigationEventSchema>;

/**
 * Related Content Configuration Schema
 */
export const relatedContentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  algorithm: z.enum(['tags', 'keywords', 'category', 'hybrid', 'ml']).default('hybrid'),
  weights: z
    .object({
      tags: z.number().min(0).max(1).default(0.4),
      keywords: z.number().min(0).max(1).default(0.3),
      category: z.number().min(0).max(1).default(0.2),
      popularity: z.number().min(0).max(1).default(0.1),
    })
    .optional(),
  cacheConfig: z
    .object({
      enabled: z.boolean().default(true),
      ttl: positiveInt.min(60).max(86400).default(3600), // 1 hour default
      maxSize: positiveInt.min(100).max(10000).default(1000),
    })
    .optional(),
  limits: z
    .object({
      maxItems: positiveInt.max(50).default(12),
      minScore: z.number().min(0).max(1).default(0.1),
    })
    .optional(),
});

export type RelatedContentConfig = z.infer<typeof relatedContentConfigSchema>;

/**
 * Related Content Request Schema
 * For API endpoints
 */
export const relatedContentRequestSchema = z.object({
  slug: nonEmptyString.max(200),
  category: z.string().max(50),
  tags: z.array(z.string().max(50)).optional(),
  limit: positiveInt.max(50).optional(),
  exclude: stringArray.optional(),
  includeScore: z.boolean().optional(),
});

export type RelatedContentRequest = z.infer<typeof relatedContentRequestSchema>;

/**
 * Related Content Response Schema
 */
export const relatedContentResponseSchema = z.object({
  items: z.array(relatedContentItemSchema),
  metadata: z.object({
    totalFound: nonNegativeInt,
    returnedCount: nonNegativeInt,
    algorithmUsed: z.string(),
    processingTime: nonNegativeInt,
    cacheStatus: z.enum(['hit', 'miss', 'bypass']),
  }),
  performance: relatedContentPerformanceSchema.optional(),
});

export type RelatedContentResponse = z.infer<typeof relatedContentResponseSchema>;

/**
 * Transform ContentItem to RelatedContentItem
 * Provides proper type conversion for components expecting RelatedContentItem
 */
export function transformToRelatedContentItem(
  item: import('@/lib/schemas/content').ContentItem,
  options: {
    score?: number;
    matchType?: 'same_category' | 'tag_match' | 'keyword_match' | 'trending';
    views?: number;
    matchDetails?: {
      matchedTags: string[];
      matchedKeywords: string[];
    };
  } = {}
): RelatedContentItem {
  return relatedContentItemSchema.parse({
    slug: item.slug,
    description: item.description,
    category: item.category,
    author: item.author,
    dateAdded: item.dateAdded,
    tags: item.tags,
    source: item.source,
    // Optional fields from item
    name: 'name' in item ? item.name : undefined,
    title: 'title' in item ? item.title : undefined,
    githubUsername: 'githubUsername' in item ? item.githubUsername : undefined,
    githubUrl: 'githubUrl' in item ? item.githubUrl : undefined,
    documentationUrl: 'documentationUrl' in item ? item.documentationUrl : undefined,
    // Related content specific fields with defaults
    score: options.score ?? 75,
    matchType: options.matchType ?? 'same_category',
    views: options.views,
    matchDetails: options.matchDetails,
  });
}

/**
 * Transform array of ContentItem to RelatedContentItem array
 */
export function transformToRelatedContentItems(
  items: import('@/lib/schemas/content').ContentItem[],
  options: {
    score?: number;
    matchType?: 'same_category' | 'tag_match' | 'keyword_match' | 'trending';
  } = {}
): RelatedContentItem[] {
  return items.map((item, index) =>
    transformToRelatedContentItem(item, {
      ...options,
      score: options.score ?? Math.max(90 - index * 10, 50), // Decreasing scores
    })
  );
}

/**
 * Export all schemas for centralized access
 */
