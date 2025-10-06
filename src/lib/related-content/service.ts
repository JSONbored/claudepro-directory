/**
 * Simplified Related Content Service
 * Maintains production Zod schemas with streamlined architecture
 */

import { z } from 'zod';
import { CACHE_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { isDevelopment } from '@/src/lib/schemas/env.schema';
import {
  type ContentIndex,
  type ContentItem,
  contentIndexSchema,
} from '@/src/lib/schemas/related-content.schema';
import { viewCountService } from '@/src/lib/services/view-count.service';

// Clean, production Zod schemas

// Schema for scored content items (internal to service)
const scoredItemSchema = z.object({
  item: z.object({
    slug: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
    description: z.string(),
    category: z.string(),
    featured: z.boolean().optional(),
    priority: z.number(),
    tags: z.array(z.string()),
    keywords: z.array(z.string()),
    author: z.string().optional(),
    content: z.string().optional(),
    dateAdded: z.string().optional(),
    popularity: z.number().optional(),
  }),
  score: z.number(),
  matchType: z.enum(['same_category', 'tag_match', 'keyword_match', 'trending']),
});

type ScoredItem = z.infer<typeof scoredItemSchema>;

const relatedContentInputSchema = z.object({
  currentPath: z.string().default('/'),
  currentCategory: z.string().default('tutorials'),
  currentTags: z.array(z.string()).default([]),
  currentKeywords: z.array(z.string()).default([]),
  limit: z.number().min(1).max(20).default(3),
  featured: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
});

const relatedContentItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  url: z.string(),
  score: z.number().min(0).max(100),
  matchType: z.enum(['same_category', 'tag_match', 'keyword_match', 'trending']),
  views: z.number().optional(),
  matchDetails: z
    .object({
      matchedTags: z.array(z.string()),
      matchedKeywords: z.array(z.string()),
    })
    .optional(),
});

const relatedContentResponseSchema = z.object({
  items: z.array(relatedContentItemSchema),
  performance: z.object({
    fetchTime: z.number().int().min(0),
    cacheHit: z.boolean(),
    itemCount: z.number().int().min(0),
    algorithmVersion: z.string(),
  }),
  algorithm: z.string(),
});

// Event tracking schemas
const carouselNavigationEventSchema = z.object({
  direction: z.enum(['next', 'prev']),
  position: z.number().int().min(0),
  itemCount: z.number().int().min(0),
});

const relatedContentClickEventSchema = z.object({
  item_id: z.string(),
  item_title: z.string(),
  position: z.number().int().min(0),
  match_type: z.string(),
});

const relatedContentImpressionEventSchema = z.object({
  items_shown: z.number().int().min(0),
  algorithm_version: z.string(),
  cache_hit: z.boolean(),
});

const relatedContentViewEventSchema = z.object({
  current_path: z.string(),
  related_count: z.number().int().min(0),
  fetch_time: z.number().min(0),
});

// Type exports
// Note: ContentItem, ContentIndex, and CategorizedContentIndex are now exported from @/lib/schemas/related-content.schema
export type RelatedContentInput = z.infer<typeof relatedContentInputSchema>;
export type RelatedContentItem = z.infer<typeof relatedContentItemSchema>;
export type RelatedContentResponse = z.infer<typeof relatedContentResponseSchema>;

// Event tracking type exports
export type CarouselNavigationEvent = z.infer<typeof carouselNavigationEventSchema>;
export type RelatedContentClickEvent = z.infer<typeof relatedContentClickEventSchema>;
export type RelatedContentImpressionEvent = z.infer<typeof relatedContentImpressionEventSchema>;
export type RelatedContentViewEvent = z.infer<typeof relatedContentViewEventSchema>;

// Simple in-memory cache
let contentCache: ContentIndex | null = null;
let lastLoaded = 0;

class RelatedContentService {
  private algorithmVersion = 'v2.0.0-simplified';

  /**
   * Get related content - main entry point
   */
  async getRelatedContent(input: RelatedContentInput): Promise<RelatedContentResponse> {
    const startTime = performance.now();

    try {
      // Validate input with Zod
      const config = relatedContentInputSchema.parse(input);

      // Load content index
      const contentIndex = await this.loadContentIndex();

      if (contentIndex.items.length === 0) {
        logger.warn('Content index is empty');
        return this.createEmptyResponse(performance.now() - startTime);
      }

      if (isDevelopment) {
        logger.debug('Content Index Debug', {
          itemsLoaded: contentIndex.items.length,
          currentPath: config.currentPath,
          currentCategory: config.currentCategory,
        });
      }

      // Score and filter items
      const scoredItems = this.scoreItems(contentIndex.items, config);
      const finalItems = await this.selectFinalItems(scoredItems, config);

      const response = relatedContentResponseSchema.parse({
        items: finalItems,
        performance: {
          fetchTime: Math.round(performance.now() - startTime),
          cacheHit: !!contentCache && Date.now() - lastLoaded < CACHE_CONFIG.durations.shortTerm,
          itemCount: finalItems.length,
          algorithmVersion: this.algorithmVersion,
        },
        algorithm: this.algorithmVersion,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Related content service error', error as Error, {
        input: JSON.stringify(input).substring(0, 200),
        errorMessage,
      });

      return this.createEmptyResponse(performance.now() - startTime);
    }
  }

  /**
   * Load content index with simple in-memory caching
   */
  private async loadContentIndex(): Promise<ContentIndex> {
    const now = Date.now();

    // Return cached version if still fresh
    if (contentCache && now - lastLoaded < CACHE_CONFIG.durations.shortTerm) {
      return contentCache;
    }

    try {
      // Load from indexer
      const { contentIndexer } = await import('./indexer');
      const rawData = await contentIndexer.loadIndex();

      if (isDevelopment) {
        logger.debug('RAW INDEX DATA', {
          exists: !!rawData,
          itemsCount: rawData?.items?.length || 0,
          keysPresent: rawData ? Object.keys(rawData).join(', ') : 'none',
        });
      }

      // Validate with Zod schema
      const validatedIndex = contentIndexSchema.parse(rawData);

      // Cache result
      contentCache = validatedIndex;
      lastLoaded = now;

      return validatedIndex;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Failed to load content index, using empty index', undefined, {
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });

      // Return empty index on failure
      const emptyIndex = contentIndexSchema.parse({
        items: [],
        generated: new Date().toISOString(),
        version: '1.0.0',
      });

      contentCache = emptyIndex;
      lastLoaded = now;

      return emptyIndex;
    }
  }

  /**
   * Score items using simplified but effective algorithm
   */
  private scoreItems(items: ContentItem[], config: RelatedContentInput): ScoredItem[] {
    return items.map((item) => {
      // Extend item with required scoring properties
      const scoringItem = {
        ...item,
        tags: item.tags || [],
        keywords: (item as typeof item & { keywords?: string[] }).keywords || [],
        priority: (item as typeof item & { priority?: number }).priority || 0,
        featured: (item as typeof item & { featured?: boolean }).featured,
      };
      let score = 0;
      let matchType: 'same_category' | 'tag_match' | 'keyword_match' | 'trending' = 'same_category';

      // Category matching (base score)
      if (item.category === config.currentCategory) {
        score += 0.3;
      }

      // Tag matching (highest weight)
      const tagMatches = (item.tags || []).filter((tag: string) =>
        config.currentTags.some(
          (currentTag) =>
            tag.toLowerCase().includes(currentTag.toLowerCase()) ||
            currentTag.toLowerCase().includes(tag.toLowerCase())
        )
      );

      if (tagMatches.length > 0) {
        score += tagMatches.length * 0.4;
        matchType = 'tag_match';
      }

      // Keyword matching
      const keywordMatches = scoringItem.keywords.filter((keyword: string) =>
        config.currentKeywords.some(
          (currentKeyword) =>
            keyword.toLowerCase().includes(currentKeyword.toLowerCase()) ||
            currentKeyword.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 0.3;
        if (matchType === 'same_category') {
          matchType = 'keyword_match';
        }
      }

      // Featured boost
      if (scoringItem.featured) {
        score += 0.2;
      }

      // Priority boost
      score += scoringItem.priority * 0.1;

      // Main categories boost (ensure visibility)
      const mainCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'];
      if (mainCategories.includes(item.category)) {
        score += 0.2;
      }

      // Normalize score to 0-100 range
      const normalizedScore = Math.min(Math.round(score * 100), 100);

      return {
        item: scoringItem,
        score: normalizedScore,
        matchType,
      };
    });
  }

  /**
   * Select final items with diversity and quality
   */
  private async selectFinalItems(
    scoredItems: ScoredItem[],
    config: RelatedContentInput
  ): Promise<RelatedContentItem[]> {
    const currentSlug = config.currentPath.split('/').pop() || '';

    // Filter out current page and low-scoring items
    const eligible = scoredItems
      .filter((result) => {
        const isCurrentPage = result.item.slug === currentSlug;
        const meetsMinScore = result.score >= 5; // Minimum 5% score
        const notExcluded = !config.exclude.includes(result.item.slug);

        return meetsMinScore && !isCurrentPage && notExcluded;
      })
      .sort((a, b) => b.score - a.score);

    if (isDevelopment && eligible.length > 0) {
      logger.debug('Top scored items', {
        itemCount: eligible.slice(0, 5).length,
        topScore: eligible[0]?.score || 0,
        categories: eligible
          .slice(0, 5)
          .map((r) => r.item.category)
          .join(', '),
      });
    }

    // Ensure category diversity
    const diverseItems: ScoredItem[] = [];
    const usedCategories = new Set<string>();

    // First pass: get top items from different categories
    for (const item of eligible) {
      if (diverseItems.length >= config.limit) break;

      if (
        !usedCategories.has(item.item.category) ||
        diverseItems.length < Math.ceil(config.limit / 2)
      ) {
        diverseItems.push(item);
        usedCategories.add(item.item.category);
      }
    }

    // Second pass: fill remaining slots with highest scoring items
    for (const item of eligible) {
      if (diverseItems.length >= config.limit) break;
      if (!diverseItems.includes(item)) {
        diverseItems.push(item);
      }
    }

    // Transform to response format with batch view count fetching
    const itemsToProcess = diverseItems.slice(0, config.limit);

    // Batch fetch view counts for all items
    const viewCountRequests = itemsToProcess.map((result) => ({
      category: result.item.category,
      slug: result.item.slug,
    }));

    const viewCounts = await viewCountService.getBatchViewCounts(viewCountRequests);

    // Create final items with real view counts
    return itemsToProcess.map((result) => {
      const viewCountKey = `${result.item.category}:${result.item.slug}`;
      const viewCountResult = viewCounts[viewCountKey];

      return relatedContentItemSchema.parse({
        slug: result.item.slug,
        title: result.item.title,
        description: result.item.description,
        category: result.item.category,
        url: `/${result.item.category}/${result.item.slug}`,
        score: result.score,
        matchType: result.matchType,
        views: viewCountResult?.views || 0, // Use real/deterministic view count
        matchDetails: {
          matchedTags: result.item.tags.filter((tag) => config.currentTags.includes(tag)),
          matchedKeywords:
            (result.item as typeof result.item & { keywords?: string[] }).keywords?.filter(
              (kw: string) => config.currentKeywords.includes(kw)
            ) || [],
        },
      });
    });
  }

  /**
   * Create empty response
   */
  private createEmptyResponse(fetchTime: number): RelatedContentResponse {
    return relatedContentResponseSchema.parse({
      items: [],
      performance: {
        fetchTime: Math.round(fetchTime),
        cacheHit: false,
        itemCount: 0,
        algorithmVersion: this.algorithmVersion,
      },
      algorithm: this.algorithmVersion,
    });
  }
}

// Export singleton instance
export const relatedContentService = new RelatedContentService();
