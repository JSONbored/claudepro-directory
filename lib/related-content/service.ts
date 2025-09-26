/**
 * Production-grade Redis-enhanced Related Content Service
 * Implements multi-algorithm scoring with caching and performance monitoring
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { contentCache, statsRedis } from '@/lib/redis';
import { env, isDevelopment } from '@/lib/schemas/env.schema';
import {
  type AlgorithmConfig,
  type ContentCategory,
  type ContentIndex,
  type ContentItem,
  cacheKeySchema,
  contentIndexSchema,
  type RelatedContentConfig,
  type RelatedContentItem,
  type RelatedContentResponse,
  type RelatedPopularItem,
  relatedContentResponseSchema,
  relatedPopularItemSchema,
  type ScoringResult,
  scoringResultSchema,
  validateRelatedContentConfig,
} from '@/lib/schemas/related-content.schema';

// Default algorithm configuration
const DEFAULT_ALGORITHM_CONFIG: AlgorithmConfig = {
  weights: {
    sameCategory: 0.15, // 15% weight for same category (reduced to allow more cross-category)
    tagMatch: 0.35, // 35% weight for tag matches (increased for better relevance)
    keywordMatch: 0.25, // 25% weight for keyword matches (increased)
    trending: 0.15, // 15% weight for trending items (unchanged)
    popular: 0.05, // 5% weight for popular items (unchanged)
    recency: 0.05, // 5% weight for recently updated (unchanged)
  },
  boosts: {
    featured: 1.5, // 50% boost for featured items
    recentlyUpdated: 7, // Consider items updated within 7 days as recent
  },
  limits: {
    maxResults: 6,
    minScore: 0.02, // Very low threshold to allow cross-category content
  },
};

// Cache configuration
const CACHE_TTL = 15 * 60; // 15 minutes - shorter to allow variety

export class RelatedContentService {
  private algorithmVersion = 'v2.0.0';

  /**
   * Get related content for a given page with caching and performance monitoring
   */
  async getRelatedContent(config: RelatedContentConfig): Promise<RelatedContentResponse> {
    const startTime = performance.now();

    try {
      // Validate config with graceful fallback
      let validatedConfig: RelatedContentConfig;
      try {
        validatedConfig = validateRelatedContentConfig(config);
      } catch (validationError) {
        // Log validation error but continue with defaults
        logger.warn('Related content config validation failed, using defaults', undefined, {
          error:
            validationError instanceof Error ? validationError.message : String(validationError),
          currentPath: config.currentPath || '/',
          currentCategory: config.currentCategory || 'unknown',
          limit: config.limit || 6,
        });

        // Use safe defaults if validation fails
        validatedConfig = {
          currentPath: config.currentPath || '/',
          currentCategory: config.currentCategory,
          currentTags: [],
          currentKeywords: [],
          featured: [],
          exclude: [],
          limit: 6,
        };
      }
      const cacheKey = this.generateCacheKey(validatedConfig);
      const bypassCache = isDevelopment && env.BYPASS_RELATED_CACHE === 'true';
      // Try to get from cache first (unless bypassed in development)
      if (!bypassCache) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return {
            ...cached,
            fromCache: true,
            performance: {
              ...cached.performance,
              fetchTime: Math.round(performance.now() - startTime),
              cacheHit: true,
            },
          };
        }
      }

      // Load content index
      const contentIndex = await this.loadContentIndex();
      if (!contentIndex || contentIndex.items.length === 0) {
        logger.warn('Content index is empty or unavailable');
        return this.createEmptyResponse(performance.now() - startTime);
      }

      // Get trending and popular data from Redis
      const [trending, popular] = await Promise.all([
        this.getTrendingItems(validatedConfig.currentCategory),
        this.getPopularItems(validatedConfig.currentCategory),
      ]);

      // Score all items
      const scoredItems = await this.scoreItems(
        contentIndex.items,
        validatedConfig,
        trending,
        popular
      );

      // Filter and sort
      const finalItems = this.selectFinalItems(scoredItems, validatedConfig);

      // Create and validate response
      const response = relatedContentResponseSchema.parse({
        items: finalItems,
        performance: {
          fetchTime: Math.round(performance.now() - startTime),
          cacheHit: false,
          itemCount: finalItems.length,
          algorithmVersion: this.algorithmVersion,
        },
        fromCache: false,
        algorithm: this.algorithmVersion,
      });

      // Cache the results
      await this.cacheResults(cacheKey, response);

      return response;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid related content configuration',
          new Error(error.issues[0]?.message || 'Validation failed'),
          {
            validationErrors: error.issues.length,
            firstError: error.issues[0]?.message || 'Unknown validation error',
          }
        );
      } else {
        logger.error('Failed to get related content', error as Error, {
          config: config ? this.sanitizeConfig(config) : 'invalid',
        });
      }

      return this.createEmptyResponse(performance.now() - startTime);
    }
  }

  /**
   * Score items using multi-algorithm approach
   */
  private async scoreItems(
    items: ContentItem[],
    config: RelatedContentConfig,
    trending: string[],
    popular: RelatedPopularItem[]
  ): Promise<ScoringResult[]> {
    const algorithmConfig: AlgorithmConfig = {
      weights: {
        ...DEFAULT_ALGORITHM_CONFIG.weights,
        ...(config.algorithm?.weights || {}),
      },
      boosts: {
        ...DEFAULT_ALGORITHM_CONFIG.boosts,
        ...(config.algorithm?.boosts || {}),
      },
      limits: {
        ...DEFAULT_ALGORITHM_CONFIG.limits,
        ...(config.algorithm?.limits || {}),
      },
    };

    const popularMap = new Map(popular.map((p) => [p.slug, p.views]));
    const maxViews = Math.max(...popular.map((p) => p.views), 1);

    return items.map((item) => {
      const scores = {
        category: this.scoreCategoryMatch(item, config, algorithmConfig),
        tags: this.scoreTagMatch(item, config, algorithmConfig),
        keywords: this.scoreKeywordMatch(item, config, algorithmConfig),
        trending: this.scoreTrending(item, trending, algorithmConfig),
        popularity: this.scorePopularity(item, popularMap, maxViews, algorithmConfig),
        recency: this.scoreRecency(item, algorithmConfig),
        featured: this.scoreFeatured(item, config, algorithmConfig),
        total: 0,
      };

      // Give main config categories a strong boost to ensure they appear
      const mainCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
      if (mainCategories.includes(item.category)) {
        scores.category += 0.15; // Strong boost for main categories to ensure visibility
      }

      // Calculate total score
      scores.total = Object.entries(scores)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

      // Validate scoring result
      const result = scoringResultSchema.parse({
        item,
        scores,
        ...(isDevelopment && {
          debug: {
            matchedTags: this.getMatchedTags(item, config),
            matchedKeywords: this.getMatchedKeywords(item, config),
            daysSinceUpdate: this.getDaysSinceUpdate(item),
            viewCount: popularMap.get(item.slug) || 0,
          },
        }),
      });

      return result;
    });
  }

  /**
   * Score category match
   */
  private scoreCategoryMatch(
    item: ContentItem,
    config: RelatedContentConfig,
    algorithmConfig: AlgorithmConfig
  ): number {
    // Exclude current page - check both slug and URL
    const currentSlug = config.currentPath ? config.currentPath.split('/').pop() : '';
    if (item.slug === currentSlug || item.url === config.currentPath) return 0;
    if (config.exclude?.includes(item.slug)) return 0;

    if (item.category === config.currentCategory) {
      return algorithmConfig.weights.sameCategory;
    }

    // Give partial credit for related categories
    const relatedCategories = this.getRelatedCategories(config.currentCategory);
    if (relatedCategories.includes(item.category)) {
      return algorithmConfig.weights.sameCategory * 0.5;
    }

    // NEW: Boost items when current content is ABOUT that category
    // e.g., MCP tutorial should boost MCP category items
    const mainCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
    if (mainCategories.includes(item.category)) {
      const currentPath = config.currentPath?.toLowerCase() || '';
      const currentTags = config.currentTags?.map((t) => t.toLowerCase()) || [];
      const currentKeywords = config.currentKeywords?.map((k) => k.toLowerCase()) || [];

      // Check if current content is about this category
      const categoryPattern = item.category.toLowerCase();
      const isAboutCategory =
        currentPath.includes(categoryPattern) ||
        currentTags.some((tag) => tag.includes(categoryPattern)) ||
        currentKeywords.some((kw) => kw.includes(categoryPattern));

      if (isAboutCategory) {
        // Give significant boost - treat it like same category
        return algorithmConfig.weights.sameCategory * 0.8;
      }
    }

    return 0;
  }

  /**
   * Score tag matches
   */
  private scoreTagMatch(
    item: ContentItem,
    config: RelatedContentConfig,
    algorithmConfig: AlgorithmConfig
  ): number {
    if (!config.currentTags || !item.tags) return 0;

    const matches = item.tags.filter((tag) => config.currentTags?.includes(tag)).length;

    if (matches === 0) return 0;

    // Score based on percentage of matching tags
    const matchRatio = matches / Math.max(config.currentTags.length, item.tags.length);
    return algorithmConfig.weights.tagMatch * matchRatio;
  }

  /**
   * Score keyword matches
   */
  private scoreKeywordMatch(
    item: ContentItem,
    config: RelatedContentConfig,
    algorithmConfig: AlgorithmConfig
  ): number {
    if (!config.currentKeywords || !item.keywords) return 0;

    const matches = item.keywords.filter((keyword) =>
      config.currentKeywords?.includes(keyword)
    ).length;

    if (matches === 0) return 0;

    const matchRatio = matches / Math.max(config.currentKeywords.length, item.keywords.length);
    return algorithmConfig.weights.keywordMatch * matchRatio;
  }

  /**
   * Score trending items
   */
  private scoreTrending(
    item: ContentItem,
    trending: string[],
    algorithmConfig: AlgorithmConfig
  ): number {
    const index = trending.indexOf(item.slug);
    if (index === -1) return 0;

    // Higher score for items higher in trending list
    const score = (trending.length - index) / trending.length;
    return algorithmConfig.weights.trending * score;
  }

  /**
   * Score popular items
   */
  private scorePopularity(
    item: ContentItem,
    popularMap: Map<string, number>,
    maxViews: number,
    algorithmConfig: AlgorithmConfig
  ): number {
    const views = popularMap.get(item.slug) || 0;
    if (views === 0) return 0;

    const normalizedScore = views / maxViews;
    return algorithmConfig.weights.popular * normalizedScore;
  }

  /**
   * Score recency
   */
  private scoreRecency(item: ContentItem, algorithmConfig: AlgorithmConfig): number {
    if (!item.dateUpdated) return 0;

    const daysSinceUpdate = this.getDaysSinceUpdate(item);
    if (daysSinceUpdate > algorithmConfig.boosts.recentlyUpdated) return 0;

    const recencyScore = 1 - daysSinceUpdate / algorithmConfig.boosts.recentlyUpdated;
    return algorithmConfig.weights.recency * recencyScore;
  }

  /**
   * Score featured items
   */
  private scoreFeatured(
    item: ContentItem,
    config: RelatedContentConfig,
    algorithmConfig: AlgorithmConfig
  ): number {
    if (config.featured?.includes(item.slug)) {
      return algorithmConfig.boosts.featured;
    }
    if (item.featured) {
      return algorithmConfig.boosts.featured * 0.5;
    }
    return 0;
  }

  /**
   * Select final items based on scores and limits
   */
  private selectFinalItems(
    scoredItems: ScoringResult[],
    config: RelatedContentConfig
  ): RelatedContentItem[] {
    const limit = config.limit || DEFAULT_ALGORITHM_CONFIG.limits.maxResults;
    const minScore = DEFAULT_ALGORITHM_CONFIG.limits.minScore;

    // Filter by minimum score and exclude current page
    // Extract slug from currentPath for comparison (e.g., /guides/tutorials/foo -> foo)
    const currentSlug = config.currentPath ? config.currentPath.split('/').pop() : '';

    // Also handle case where path might have trailing slash
    const normalizedCurrentPath = config.currentPath ? config.currentPath.replace(/\/$/, '') : '';

    const eligible = scoredItems
      .filter((result) => {
        // Multiple checks to ensure current page is excluded
        const isCurrentPage =
          result.item.slug === currentSlug ||
          result.item.url === config.currentPath ||
          result.item.url === normalizedCurrentPath ||
          (result.item.url && result.item.url.replace(/\/$/, '') === normalizedCurrentPath);

        return result.scores.total >= minScore && !isCurrentPage;
      })
      .sort((a, b) => b.scores.total - a.scores.total);

    // Get a larger pool of eligible items for diversity (not just top N)
    // Take top 20-30 items to ensure we have options from all categories
    const eligiblePool = eligible.slice(0, Math.min(30, eligible.length));

    // Ensure featured items are included
    const featured = config.featured || [];
    const featuredItems = eligiblePool.filter((r) => featured.includes(r.item.slug));
    const otherItems = eligiblePool.filter((r) => !featured.includes(r.item.slug));

    // Diversify categories for better internal linking - this will enforce the mix
    const diversifiedResults = this.diversifyCategories(otherItems, limit - featuredItems.length);

    // Combine featured and diversified items
    const finalResults = [
      ...featuredItems.slice(0, Math.min(featured.length, limit)),
      ...diversifiedResults,
    ].slice(0, limit);

    // Convert to RelatedContentItem
    return finalResults.map((result) => {
      const matchDetails: RelatedContentItem['matchDetails'] = {
        matchedTags: this.getMatchedTags(result.item, config),
        matchedKeywords: this.getMatchedKeywords(result.item, config),
      };

      if (result.debug?.viewCount !== undefined) {
        matchDetails.viewCount = result.debug.viewCount;
      }

      return {
        ...result.item,
        score: result.scores.total,
        matchType: this.determineMatchType(result),
        matchDetails,
      };
    });
  }

  /**
   * Diversify categories to ensure variety in related content
   * ENFORCES: 1-2 main config items + 1-2 similar content items
   */
  private diversifyCategories(items: ScoringResult[], targetCount: number): ScoringResult[] {
    const result: ScoringResult[] = [];
    const mainCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

    // Separate items by category type
    const mainCategoryItems = items.filter((item) => mainCategories.includes(item.item.category));
    const similarItems = items.filter((item) => !mainCategories.includes(item.item.category));

    // Shuffle for randomization while keeping relevance (top items have better scores)
    const shuffleTopItems = (arr: ScoringResult[], poolSize: number = 8) => {
      const topPool = arr.slice(0, Math.min(poolSize, arr.length));
      // Fisher-Yates shuffle for better randomization
      for (let i = topPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = topPool[i]!;
        topPool[i] = topPool[j]!;
        topPool[j] = temp;
      }
      return topPool;
    };

    // STRICT ENFORCEMENT: Always include at least 1 main category if available
    if (targetCount === 3) {
      // For standard 3-item display
      if (mainCategoryItems.length > 0 && similarItems.length > 0) {
        // Ideal mix: 1-2 main + 1-2 similar
        const mainCount = Math.random() > 0.5 ? 2 : 1;
        const similarCount = targetCount - mainCount;

        // Get randomized selections from top items
        const shuffledMain = shuffleTopItems(mainCategoryItems, 10);
        const shuffledSimilar = shuffleTopItems(similarItems, 10);

        // Add main category items
        for (let i = 0; i < mainCount && i < shuffledMain.length; i++) {
          const item = shuffledMain[i];
          if (item) result.push(item);
        }

        // Add similar items
        for (let i = 0; i < similarCount && i < shuffledSimilar.length; i++) {
          const item = shuffledSimilar[i];
          if (item) result.push(item);
        }
      } else if (mainCategoryItems.length > 0) {
        // Only main categories available
        const shuffled = shuffleTopItems(mainCategoryItems, 10);
        result.push(...shuffled.slice(0, targetCount));
      } else {
        // Only similar items available
        const shuffled = shuffleTopItems(similarItems, 10);
        result.push(...shuffled.slice(0, targetCount));
      }
    } else {
      // For non-standard counts, aim for 40-60% main categories if available
      const mainCount = Math.ceil(targetCount * 0.4);
      const shuffledMain = shuffleTopItems(mainCategoryItems, 10);
      const shuffledSimilar = shuffleTopItems(similarItems, 10);

      // Add main items first
      for (let i = 0; i < mainCount && i < shuffledMain.length; i++) {
        const item = shuffledMain[i];
        if (item) result.push(item);
      }

      // Fill remaining with similar items
      const remaining = targetCount - result.length;
      for (let i = 0; i < remaining && i < shuffledSimilar.length; i++) {
        const item = shuffledSimilar[i];
        if (item) result.push(item);
      }

      // If still not enough, add any remaining items
      if (result.length < targetCount) {
        const allRemaining = [...mainCategoryItems, ...similarItems].filter(
          (item) => !result.includes(item)
        );
        const shuffledRemaining = shuffleTopItems(allRemaining, 10);
        result.push(...shuffledRemaining.slice(0, targetCount - result.length));
      }
    }

    // Randomize final order for visual variety
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i]!;
      result[i] = result[j]!;
      result[j] = temp;
    }

    return result.slice(0, targetCount);
  }

  /**
   * Determine the primary match type for an item
   */
  private determineMatchType(result: ScoringResult): RelatedContentItem['matchType'] {
    const { scores } = result;

    // Check if featured score is the dominant factor
    if (scores.featured && scores.featured > 0) {
      const nonFeaturedTotal = scores.total - scores.featured;
      if (scores.featured >= nonFeaturedTotal) {
        return 'featured';
      }
    }

    // Find the highest contributing score
    const scoreEntries = Object.entries(scores)
      .filter(([key]) => key !== 'total' && key !== 'featured')
      .sort(([, a], [, b]) => b - a);

    if (scoreEntries.length === 0) return 'cross_category';

    const topEntry = scoreEntries[0];
    if (!topEntry) return 'cross_category';
    const [topScoreType] = topEntry;

    switch (topScoreType) {
      case 'category':
        return 'same_category';
      case 'tags':
        return 'tag_match';
      case 'keywords':
        return 'keyword_match';
      case 'trending':
        return 'trending';
      case 'popularity':
        return 'popular';
      default:
        return 'cross_category';
    }
  }

  /**
   * Get related categories for cross-category recommendations
   */
  private getRelatedCategories(category?: ContentCategory): ContentCategory[] {
    const relationships: Record<string, ContentCategory[]> = {
      tutorials: ['workflows', 'use-cases'],
      comparisons: ['tutorials', 'troubleshooting'],
      workflows: ['tutorials', 'use-cases'],
      'use-cases': ['tutorials', 'workflows'],
      troubleshooting: ['tutorials', 'comparisons'],
      agents: ['commands', 'rules'],
      mcp: ['agents', 'hooks'],
      rules: ['agents', 'commands'],
      commands: ['agents', 'rules'],
      hooks: ['mcp', 'commands'],
    };

    return relationships[category || ''] || [];
  }

  /**
   * Get matched tags between item and config
   */
  private getMatchedTags(item: ContentItem, config: RelatedContentConfig): string[] {
    if (!config.currentTags || !item.tags) return [];
    return item.tags.filter((tag) => config.currentTags?.includes(tag));
  }

  /**
   * Get matched keywords between item and config
   */
  private getMatchedKeywords(item: ContentItem, config: RelatedContentConfig): string[] {
    if (!config.currentKeywords || !item.keywords) return [];
    return item.keywords.filter((keyword) => config.currentKeywords?.includes(keyword));
  }

  /**
   * Calculate days since last update
   */
  private getDaysSinceUpdate(item: ContentItem): number {
    if (!item.dateUpdated) return Infinity;

    const updateDate = new Date(item.dateUpdated);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updateDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get trending items from Redis
   */
  private async getTrendingItems(category?: ContentCategory): Promise<string[]> {
    if (!category) return [];

    try {
      const items = await statsRedis.getTrending(category, 20);
      // Validate as array of strings
      return z.array(z.string()).parse(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid trending items data',
          new Error(error.issues[0]?.message || 'Invalid data'),
          {
            category,
            errorCount: error.issues.length,
          }
        );
      } else {
        logger.error('Failed to get trending items', error as Error, { category });
      }
      return [];
    }
  }

  /**
   * Get popular items from Redis
   */
  private async getPopularItems(category?: ContentCategory): Promise<RelatedPopularItem[]> {
    if (!category) return [];

    try {
      const items = await statsRedis.getPopular(category, 20);
      // Validate popular items
      return z.array(relatedPopularItemSchema).parse(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid popular items data',
          new Error(error.issues[0]?.message || 'Invalid data'),
          {
            category,
            errorCount: error.issues.length,
          }
        );
      } else {
        logger.error('Failed to get popular items', error as Error, { category });
      }
      return [];
    }
  }

  /**
   * Load content index (will be generated at build time)
   */
  private async loadContentIndex(): Promise<ContentIndex | null> {
    try {
      // Try to get from cache first
      const cached = await contentCache.getContentMetadata<unknown>('all_content');
      if (cached) {
        // Validate cached data
        return contentIndexSchema.parse(cached);
      }

      // Load the generated content index
      const { contentIndexer } = await import('./indexer');
      const index = await contentIndexer.loadIndex();

      if (index) {
        // Validate loaded index
        const validated = contentIndexSchema.parse(index);

        if (validated.items.length > 0) {
          // Cache the validated index
          await contentCache.cacheContentMetadata('all_content', validated, CACHE_TTL);
          return validated;
        }
      }

      return contentIndexSchema.parse({ items: [], categories: {}, tags: {}, keywords: {} });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid content index data',
          new Error(error.issues[0]?.message || 'Invalid index'),
          {
            errorCount: error.issues.length,
            firstError: error.issues[0]?.message || 'Unknown validation error',
          }
        );
      } else {
        logger.error('Failed to load content index', error as Error);
      }
      return null;
    }
  }

  /**
   * Get results from cache
   */
  private async getFromCache(key: string): Promise<RelatedContentResponse | null> {
    try {
      const cached = await contentCache.getAPIResponse<unknown>(key);
      if (cached) {
        // Validate cached response
        return relatedContentResponseSchema.parse(cached);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid cached related content data',
          new Error(error.issues[0]?.message || 'Invalid cache'),
          {
            key,
            errorCount: error.issues.length,
          }
        );
      } else {
        logger.error('Cache retrieval failed', error as Error, { key });
      }
      return null;
    }
  }

  /**
   * Cache results
   */
  private async cacheResults(key: string, response: RelatedContentResponse): Promise<void> {
    try {
      await contentCache.cacheAPIResponse(key, response, CACHE_TTL);
    } catch (error) {
      logger.error('Cache storage failed', error as Error);
      // Continue without caching
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(config: RelatedContentConfig): string {
    const parts = [
      'related',
      config.currentPath.replace(/\//g, '_'),
      config.currentCategory || 'none',
      config.limit || DEFAULT_ALGORITHM_CONFIG.limits.maxResults,
      this.algorithmVersion,
    ];

    const key = parts.join(':');
    // Validate cache key
    return cacheKeySchema.parse(key);
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
      fromCache: false,
      algorithm: this.algorithmVersion,
    });
  }

  /**
   * Sanitize config for logging (remove potentially sensitive data)
   */
  private sanitizeConfig(config: RelatedContentConfig): any {
    return {
      currentPath: config.currentPath,
      currentCategory: config.currentCategory,
      limit: config.limit,
      hasFeatures: !!config.featured?.length,
      hasExclusions: !!config.exclude?.length,
    };
  }
}

// Export singleton instance
export const relatedContentService = new RelatedContentService();
