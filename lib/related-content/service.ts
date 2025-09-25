/**
 * Production-grade Redis-enhanced Related Content Service
 * Implements multi-algorithm scoring with caching and performance monitoring
 */

import { logger } from '@/lib/logger';
import { contentCache, statsRedis } from '@/lib/redis';
import type {
  AlgorithmConfig,
  ContentCategory,
  ContentItem,
  RelatedContentConfig,
  RelatedContentItem,
  RelatedContentResponse,
  ScoringResult,
} from './types';

// Default algorithm configuration
const DEFAULT_ALGORITHM_CONFIG: AlgorithmConfig = {
  weights: {
    sameCategory: 0.35, // 35% weight for same category
    tagMatch: 0.25, // 25% weight for tag matches
    keywordMatch: 0.15, // 15% weight for keyword matches
    trending: 0.15, // 15% weight for trending items
    popular: 0.05, // 5% weight for popular items
    recency: 0.05, // 5% weight for recently updated
  },
  boosts: {
    featured: 1.5, // 50% boost for featured items
    recentlyUpdated: 7, // Consider items updated within 7 days as recent
  },
  limits: {
    maxResults: 6,
    minScore: 0.1, // Minimum score threshold
  },
};

// Cache configuration
const CACHE_TTL = 4 * 60 * 60; // 4 hours

export class RelatedContentService {
  private algorithmVersion = 'v2.0.0';

  /**
   * Get related content for a given page with caching and performance monitoring
   */
  async getRelatedContent(config: RelatedContentConfig): Promise<RelatedContentResponse> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(config);

    try {
      // Try to get from cache first
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

      // Load content index
      const contentIndex = await this.loadContentIndex();
      if (!contentIndex || contentIndex.items.length === 0) {
        logger.warn('Content index is empty or unavailable');
        return this.createEmptyResponse(performance.now() - startTime);
      }

      // Get trending and popular data from Redis
      const [trending, popular] = await Promise.all([
        this.getTrendingItems(config.currentCategory),
        this.getPopularItems(config.currentCategory),
      ]);

      // Score all items
      const scoredItems = await this.scoreItems(contentIndex.items, config, trending, popular);

      // Filter and sort
      const finalItems = this.selectFinalItems(scoredItems, config);

      // Create response
      const response: RelatedContentResponse = {
        items: finalItems,
        performance: {
          fetchTime: Math.round(performance.now() - startTime),
          cacheHit: false,
          itemCount: finalItems.length,
          algorithmVersion: this.algorithmVersion,
        },
        fromCache: false,
        algorithm: this.algorithmVersion,
      };

      // Cache the results
      await this.cacheResults(cacheKey, response);

      return response;
    } catch (error) {
      logger.error('Failed to get related content', error as Error, {
        config: this.sanitizeConfig(config),
        cacheKey,
      });

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
    popular: Array<{ slug: string; views: number }>
  ): Promise<ScoringResult[]> {
    const algorithmConfig = {
      ...DEFAULT_ALGORITHM_CONFIG,
      ...config.algorithm,
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

      // Calculate total score
      scores.total = Object.entries(scores)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

      const result: ScoringResult = {
        item,
        scores,
      };

      if (process.env.NODE_ENV === 'development') {
        result.debug = {
          matchedTags: this.getMatchedTags(item, config),
          matchedKeywords: this.getMatchedKeywords(item, config),
          daysSinceUpdate: this.getDaysSinceUpdate(item),
          viewCount: popularMap.get(item.slug) || 0,
        };
      }

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
    if (item.slug === config.currentPath) return 0; // Exclude current page
    if (config.exclude?.includes(item.slug)) return 0;

    if (item.category === config.currentCategory) {
      return algorithmConfig.weights.sameCategory;
    }

    // Give partial credit for related categories
    const relatedCategories = this.getRelatedCategories(config.currentCategory);
    if (relatedCategories.includes(item.category)) {
      return algorithmConfig.weights.sameCategory * 0.5;
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
    const eligible = scoredItems
      .filter(
        (result) => result.scores.total >= minScore && result.item.slug !== config.currentPath
      )
      .sort((a, b) => b.scores.total - a.scores.total);

    // Ensure featured items are included
    const featured = config.featured || [];
    const featuredItems = eligible.filter((r) => featured.includes(r.item.slug));
    const otherItems = eligible.filter((r) => !featured.includes(r.item.slug));

    // Combine featured and other items
    const finalResults = [
      ...featuredItems.slice(0, Math.min(featured.length, limit)),
      ...otherItems,
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
   * Determine the primary match type for an item
   */
  private determineMatchType(result: ScoringResult): RelatedContentItem['matchType'] {
    const { scores } = result;

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
      return await statsRedis.getTrending(category, 20);
    } catch (error) {
      logger.error('Failed to get trending items', error as Error);
      return [];
    }
  }

  /**
   * Get popular items from Redis
   */
  private async getPopularItems(
    category?: ContentCategory
  ): Promise<Array<{ slug: string; views: number }>> {
    if (!category) return [];

    try {
      return await statsRedis.getPopular(category, 20);
    } catch (error) {
      logger.error('Failed to get popular items', error as Error);
      return [];
    }
  }

  /**
   * Load content index (will be generated at build time)
   */
  private async loadContentIndex(): Promise<any> {
    try {
      // Try to get from cache first
      const cached = await contentCache.getContentMetadata('all_content');
      if (cached) return cached;

      // In production, this will load the pre-built index
      // For now, return empty
      return { items: [], categories: {}, tags: {}, keywords: {} };
    } catch (error) {
      logger.error('Failed to load content index', error as Error);
      return null;
    }
  }

  /**
   * Get results from cache
   */
  private async getFromCache(key: string): Promise<RelatedContentResponse | null> {
    try {
      return await contentCache.getAPIResponse(key);
    } catch (error) {
      logger.error('Cache retrieval failed', error as Error);
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

    return parts.join(':');
  }

  /**
   * Create empty response
   */
  private createEmptyResponse(fetchTime: number): RelatedContentResponse {
    return {
      items: [],
      performance: {
        fetchTime: Math.round(fetchTime),
        cacheHit: false,
        itemCount: 0,
        algorithmVersion: this.algorithmVersion,
      },
      fromCache: false,
      algorithm: this.algorithmVersion,
    };
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
