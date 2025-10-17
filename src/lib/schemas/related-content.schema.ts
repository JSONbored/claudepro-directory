/**
 * Related Content Schemas
 * Production-grade validation for related content features
 * Centralized schemas for all related content functionality
 */

import { z } from 'zod';
import {
  type UnifiedContentItem,
  unifiedContentItemSchema,
} from './components/content-item.schema';
import { stringArray } from './primitives/base-arrays';
import { nonNegativeInt, percentage, positiveInt } from './primitives/base-numbers';
import {
  isoDatetimeString,
  mediumString,
  nonEmptyString,
  shortString,
} from './primitives/base-strings';

// Type alias for backwards compatibility and convenience
export type ContentItem = UnifiedContentItem;

/**
 * Content Index Schemas
 * Used by indexer and service for content indexing and retrieval
 */
export const contentIndexSchema = z
  .object({
    items: z
      .array(unifiedContentItemSchema)
      .max(10000)
      .default([])
      .describe('Array of unified content items, maximum 10000 entries'),
    generated: z
      .string()
      .default(() => new Date().toISOString())
      .describe('ISO timestamp when the index was generated'),
    version: z.string().default('1.0.0').describe('Schema version for compatibility tracking'),
  })
  .passthrough()
  .describe('Content index structure for indexing and retrieving content items');

/**
 * Categorized Content Index Schema
 * Extended schema for split index functionality
 * Supports both flat items array AND categorized structure
 */
const categorizedContentIndexSchema = contentIndexSchema
  .extend({
    categories: z
      .record(
        z.string().describe('Category name'),
        z.array(unifiedContentItemSchema).describe('Array of content items in this category')
      )
      .optional()
      .describe('Optional mapping of category names to their content items'),
  })
  .describe('Extended content index with optional category-based organization');

export type ContentIndex = z.infer<typeof contentIndexSchema>;
export type CategorizedContentIndex = z.infer<typeof categorizedContentIndexSchema>;

/**
 * Related Content Item Schema
 * Used for displaying related items in carousels and lists
 * Based on actual ContentMetadata structure
 */
const relatedContentItemSchema = z
  .object({
    slug: nonEmptyString.max(200).describe('Unique identifier for the content item'),
    description: mediumString.describe('Brief description of the content'),
    category: z.string().max(50).describe('Primary category classification'),
    author: shortString.describe('Content creator or author name'),
    dateAdded: z.string().max(50).describe('Date when content was added to the system'),
    tags: stringArray.describe('Array of content tags for categorization'),
    source: z
      .enum(['official', 'community', 'verified', 'claudepro'])
      .describe('Origin or verification status of the content'),
    // Optional fields that may exist on some content types
    name: z.string().optional().describe('Optional display name for the content'),
    title: z.string().optional().describe('Optional title for the content'),
    githubUsername: z.string().optional().describe('GitHub username if content is from GitHub'),
    githubUrl: z.string().optional().describe('URL to GitHub repository or profile'),
    documentationUrl: z.string().optional().describe('URL to external documentation'),
    // Related content specific fields
    score: percentage.describe('Relevance score for related content matching (0-100)'),
    matchType: z
      .string()
      .describe(
        'Type of matching algorithm used to find this related content (e.g., same_category, tag_match, keyword_match, trending)'
      ),
    views: z.number().optional().describe('Optional view count for popularity metrics'),
    matchDetails: z
      .object({
        matchedTags: stringArray.describe('Tags that matched with the source content'),
        matchedKeywords: stringArray.describe('Keywords that matched with the source content'),
      })
      .optional()
      .describe('Detailed information about what caused the match'),
  })
  .describe('Schema for related content items displayed in carousels and recommendation lists');

export type RelatedContentItem = z.infer<typeof relatedContentItemSchema>;

/**
 * Smart Related Content Props Schema
 * Props for the main SmartRelatedContent component
 */
const smartRelatedContentPropsSchema = z
  .object({
    featured: z
      .array(z.string().max(200).describe('Slug of featured content item'))
      .optional()
      .describe('Optional array of content slugs to feature prominently'),
    exclude: z
      .array(z.string().max(200).describe('Slug of content to exclude'))
      .optional()
      .describe('Optional array of content slugs to exclude from results'),
    limit: positiveInt
      .max(50)
      .default(6)
      .describe('Maximum number of related items to display (1-50, default 6)'),
    trackingEnabled: z
      .boolean()
      .default(true)
      .describe('Whether to enable analytics tracking for interactions'),
    currentTags: z
      .array(z.string().max(50).describe('Tag name'))
      .optional()
      .describe('Tags from current content for matching'),
    currentKeywords: z
      .array(shortString.describe('Keyword'))
      .optional()
      .describe('Keywords from current content for matching'),
    pathname: mediumString.optional().describe('Current page pathname for context'),
    title: z
      .string()
      .max(200)
      .optional()
      .describe('Optional custom title for the related content section'),
    showTitle: z.boolean().default(true).describe('Whether to display the section title'),
  })
  .describe('Props schema for SmartRelatedContent component');

export type SmartRelatedContentProps = z.infer<typeof smartRelatedContentPropsSchema>;

/**
 * Smart Related Content With Metadata Props Schema
 * Props for the wrapper component that provides metadata
 */
const smartRelatedContentWithMetadataPropsSchema = smartRelatedContentPropsSchema
  .omit({ currentTags: true, currentKeywords: true })
  .extend({
    pathname: mediumString.optional().describe('Current page pathname for context'), // Allow pathname to be passed explicitly
  })
  .describe('Props schema for SmartRelatedContentWithMetadata wrapper component');

export type SmartRelatedContentWithMetadataProps = z.infer<
  typeof smartRelatedContentWithMetadataPropsSchema
>;

/**
 * Related Content Performance Metrics Schema
 */
const relatedContentPerformanceSchema = z
  .object({
    fetchTime: nonNegativeInt.describe('Time taken to fetch related content in milliseconds'),
    cacheHit: z.boolean().describe('Whether the result was served from cache'),
    itemCount: nonNegativeInt.describe('Number of related items returned'),
    algorithmVersion: z.string().max(50).describe('Version of the matching algorithm used'),
    cacheKey: z.string().optional().describe('Optional cache key used for this request'),
    ttl: z.number().optional().describe('Optional time-to-live for cached results in seconds'),
  })
  .describe('Performance metrics for related content fetching operations');

export type RelatedContentPerformance = z.infer<typeof relatedContentPerformanceSchema>;

/**
 * Related Carousel Client Props Schema
 * Props for the client-side carousel component
 */
const relatedCarouselClientPropsSchema = z
  .object({
    items: z
      .array(relatedContentItemSchema)
      .describe('Array of related content items to display in carousel'),
    performance: relatedContentPerformanceSchema.describe(
      'Performance metrics for the content fetch operation'
    ),
    title: z.string().max(200).optional().describe('Optional custom title for the carousel'),
    showTitle: z.boolean().default(true).describe('Whether to display the carousel title'),
    trackingEnabled: z.boolean().default(true).describe('Whether to enable analytics tracking'),
    className: z.string().optional().describe('Optional CSS class names for styling'),
    autoPlay: z.boolean().default(false).describe('Whether carousel should auto-advance'),
    autoPlayInterval: positiveInt
      .min(1000)
      .max(10000)
      .default(5000)
      .describe('Auto-play interval in milliseconds (1000-10000, default 5000)'),
    showDots: z.boolean().default(true).describe('Whether to display navigation dots'),
    showArrows: z.boolean().default(true).describe('Whether to display navigation arrows'),
  })
  .describe('Props schema for client-side related content carousel component');

export type RelatedCarouselClientProps = z.infer<typeof relatedCarouselClientPropsSchema>;

/**
 * Related Content View Event Schema
 * For analytics tracking
 */
const relatedContentViewEventSchema = z
  .object({
    eventType: z
      .literal('related_content_view')
      .describe('Event type identifier for related content view'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the event occurred'),
    pathname: z.string().describe('URL pathname where the view occurred'),
    itemCount: nonNegativeInt.describe('Number of related items displayed'),
    algorithmVersion: z
      .string()
      .describe('Version of the algorithm that generated the recommendations'),
    cacheHit: z.boolean().describe('Whether the content was served from cache'),
    fetchTime: nonNegativeInt.describe('Time taken to fetch content in milliseconds'),
  })
  .describe('Analytics event schema for tracking related content views');

export type RelatedContentViewEvent = z.infer<typeof relatedContentViewEventSchema>;

/**
 * Related Content Click Event Schema
 */
const relatedContentClickEventSchema = z
  .object({
    eventType: z
      .literal('related_content_click')
      .describe('Event type identifier for related content click'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the click occurred'),
    pathname: z.string().describe('URL pathname where the click occurred'),
    clickedItem: z
      .object({
        slug: z.string().describe('Slug of the clicked content item'),
        category: z.string().describe('Category of the clicked content item'),
        position: nonNegativeInt.describe('Position of the item in the list (0-indexed)'),
        score: z.number().optional().describe('Optional relevance score of the clicked item'),
      })
      .describe('Details about the clicked content item'),
    context: z
      .object({
        totalItems: nonNegativeInt.describe('Total number of items displayed'),
        algorithmVersion: z
          .string()
          .describe('Version of the algorithm that generated the recommendations'),
      })
      .optional()
      .describe('Optional contextual information about the click event'),
  })
  .describe('Analytics event schema for tracking clicks on related content items');

export type RelatedContentClickEvent = z.infer<typeof relatedContentClickEventSchema>;

/**
 * Related Content Impression Event Schema
 */
const relatedContentImpressionEventSchema = z
  .object({
    eventType: z
      .literal('related_content_impression')
      .describe('Event type identifier for content impression tracking'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the impression occurred'),
    pathname: z.string().describe('URL pathname where the impression occurred'),
    visibleItems: z
      .array(
        z
          .object({
            slug: z.string().describe('Slug of the visible content item'),
            category: z.string().describe('Category of the visible content item'),
            position: nonNegativeInt.describe('Position of the item in the list (0-indexed)'),
          })
          .describe('Details of a visible content item')
      )
      .describe('Array of items currently visible in the viewport'),
    viewportPercentage: percentage.describe(
      'Percentage of the content section visible in viewport (0-100)'
    ),
  })
  .describe('Analytics event schema for tracking when related content items appear in viewport');

export type RelatedContentImpressionEvent = z.infer<typeof relatedContentImpressionEventSchema>;

/**
 * Carousel Navigation Event Schema
 */
const carouselNavigationEventSchema = z
  .object({
    eventType: z
      .literal('carousel_navigation')
      .describe('Event type identifier for carousel navigation'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the navigation occurred'),
    pathname: z.string().describe('URL pathname where the navigation occurred'),
    direction: z.enum(['next', 'previous', 'dot']).describe('Navigation direction or method used'),
    currentIndex: nonNegativeInt.describe('Current slide index before navigation'),
    targetIndex: nonNegativeInt.describe('Target slide index after navigation'),
    totalSlides: nonNegativeInt.describe('Total number of slides in the carousel'),
  })
  .describe('Analytics event schema for tracking carousel navigation interactions');

export type CarouselNavigationEvent = z.infer<typeof carouselNavigationEventSchema>;

/**
 * Related Content Configuration Schema
 */
const relatedContentConfigSchema = z
  .object({
    enabled: z.boolean().default(true).describe('Whether related content functionality is enabled'),
    algorithm: z
      .enum(['tags', 'keywords', 'category', 'hybrid', 'ml'])
      .default('hybrid')
      .describe('Algorithm to use for finding related content'),
    weights: z
      .object({
        tags: z
          .number()
          .min(0)
          .max(1)
          .default(0.4)
          .describe('Weight for tag-based matching (0-1, default 0.4)'),
        keywords: z
          .number()
          .min(0)
          .max(1)
          .default(0.3)
          .describe('Weight for keyword-based matching (0-1, default 0.3)'),
        category: z
          .number()
          .min(0)
          .max(1)
          .default(0.2)
          .describe('Weight for category-based matching (0-1, default 0.2)'),
        popularity: z
          .number()
          .min(0)
          .max(1)
          .default(0.1)
          .describe('Weight for popularity-based matching (0-1, default 0.1)'),
      })
      .optional()
      .describe('Optional weights for hybrid algorithm scoring'),
    cacheConfig: z
      .object({
        enabled: z.boolean().default(true).describe('Whether caching is enabled'),
        ttl: positiveInt
          .min(60)
          .max(86400)
          .default(3600)
          .describe('Cache time-to-live in seconds (60-86400, default 3600)'), // 1 hour default
        maxSize: positiveInt
          .min(100)
          .max(10000)
          .default(1000)
          .describe('Maximum number of cached entries (100-10000, default 1000)'),
      })
      .optional()
      .describe('Optional cache configuration settings'),
    limits: z
      .object({
        maxItems: positiveInt
          .max(50)
          .default(12)
          .describe('Maximum items to return (1-50, default 12)'),
        minScore: z
          .number()
          .min(0)
          .max(1)
          .default(0.1)
          .describe('Minimum relevance score threshold (0-1, default 0.1)'),
      })
      .optional()
      .describe('Optional limits for content filtering'),
  })
  .describe('Configuration schema for related content system behavior and algorithm settings');

export type RelatedContentConfig = z.infer<typeof relatedContentConfigSchema>;

/**
 * Related Content Request Schema
 * For API endpoints
 */
const relatedContentRequestSchema = z
  .object({
    slug: nonEmptyString
      .max(200)
      .describe('Slug of the source content item to find related items for'),
    category: z.string().max(50).describe('Category of the source content item'),
    tags: z
      .array(z.string().max(50).describe('Tag name'))
      .optional()
      .describe('Optional array of tags for enhanced matching'),
    limit: positiveInt.max(50).optional().describe('Optional limit on number of results (1-50)'),
    exclude: stringArray.optional().describe('Optional array of slugs to exclude from results'),
    includeScore: z
      .boolean()
      .optional()
      .describe('Whether to include relevance scores in response'),
  })
  .describe('Request schema for API endpoints fetching related content');

export type RelatedContentRequest = z.infer<typeof relatedContentRequestSchema>;

/**
 * Related Content Response Schema
 */
const relatedContentResponseSchema = z
  .object({
    items: z
      .array(relatedContentItemSchema)
      .describe('Array of related content items matching the request'),
    metadata: z
      .object({
        totalFound: nonNegativeInt.describe(
          'Total number of matching items found before limit applied'
        ),
        returnedCount: nonNegativeInt.describe('Number of items actually returned in response'),
        algorithmUsed: z.string().describe('Name of the algorithm used for matching'),
        processingTime: nonNegativeInt.describe(
          'Time taken to process the request in milliseconds'
        ),
        cacheStatus: z.enum(['hit', 'miss', 'bypass']).describe('Cache status for this request'),
      })
      .describe('Metadata about the search operation and results'),
    performance: relatedContentPerformanceSchema
      .optional()
      .describe('Optional detailed performance metrics'),
  })
  .describe('Response schema for API endpoints returning related content');

export type RelatedContentResponse = z.infer<typeof relatedContentResponseSchema>;

/**
 * Export all schemas for centralized access
 */
