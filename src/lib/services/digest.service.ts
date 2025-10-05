/**
 * Weekly Digest Content Aggregation Service
 *
 * Collects and aggregates content for weekly digest emails.
 * Queries new content by date and trending content by view counts.
 *
 * Features:
 * - Content aggregation by date range
 * - Trending content by view counts
 * - Redis caching for performance
 * - Type-safe responses
 *
 * @module lib/services/digest.service
 */

import { agents, collections, commands, hooks, mcp, rules, statuslines } from '@/generated/content';
import type { DigestContentItem, DigestTrendingItem } from '@/src/emails/templates/weekly-digest';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { contentCache, statsRedis } from '@/src/lib/redis';

/**
 * Digest data for a specific week
 */
export interface WeeklyDigestData {
  weekOf: string;
  newContent: DigestContentItem[];
  trendingContent: DigestTrendingItem[];
}

/**
 * DigestService class for content aggregation
 *
 * Singleton service for generating weekly digest content.
 */
class DigestService {
  /**
   * Get content added within date range
   *
   * @param since - Start date
   * @param limit - Maximum items to return
   * @returns Array of new content items
   */
  async getNewContent(since: Date, limit = 5): Promise<DigestContentItem[]> {
    try {
      // Get all content from all categories
      const [
        agentsData,
        mcpData,
        rulesData,
        commandsData,
        hooksData,
        statuslinesData,
        collectionsData,
      ] = await Promise.all([agents, mcp, rules, commands, hooks, statuslines, collections]);

      const allContent = [
        ...agentsData.map((item) => ({ ...item, category: 'agents' as const })),
        ...mcpData.map((item) => ({ ...item, category: 'mcp' as const })),
        ...rulesData.map((item) => ({ ...item, category: 'rules' as const })),
        ...commandsData.map((item) => ({ ...item, category: 'commands' as const })),
        ...hooksData.map((item) => ({ ...item, category: 'hooks' as const })),
        ...statuslinesData.map((item) => ({ ...item, category: 'statuslines' as const })),
        ...collectionsData.map((item) => ({ ...item, category: 'collections' as const })),
      ];

      // Filter by dateAdded, sort by date DESC
      const newItems = allContent
        .filter((item) => {
          if (!item.dateAdded) return false;

          const addedDate = new Date(item.dateAdded);
          return addedDate >= since && !Number.isNaN(addedDate.getTime());
        })
        .sort((a, b) => {
          const dateA = new Date(a.dateAdded || 0);
          const dateB = new Date(b.dateAdded || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      // Map to digest format
      return newItems.map((item) => ({
        title: item.title,
        description: item.description || '',
        category: item.category,
        slug: item.slug,
        url: `${APP_CONFIG.url}/${item.category}/${item.slug}`,
      }));
    } catch (error) {
      logger.error(
        'Failed to get new content for digest',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  /**
   * Get trending content by view counts
   *
   * @param _since - Start date for trending period (reserved for future filtering)
   * @param limit - Maximum items to return
   * @returns Array of trending content items with view counts
   */
  async getTrendingContent(_since: Date, limit = 3): Promise<DigestTrendingItem[]> {
    try {
      // Get all content
      const [
        agentsData,
        mcpData,
        rulesData,
        commandsData,
        hooksData,
        statuslinesData,
        collectionsData,
      ] = await Promise.all([agents, mcp, rules, commands, hooks, statuslines, collections]);

      const allContent = [
        ...agentsData.map((item) => ({ ...item, category: 'agents' as const })),
        ...mcpData.map((item) => ({ ...item, category: 'mcp' as const })),
        ...rulesData.map((item) => ({ ...item, category: 'rules' as const })),
        ...commandsData.map((item) => ({ ...item, category: 'commands' as const })),
        ...hooksData.map((item) => ({ ...item, category: 'hooks' as const })),
        ...statuslinesData.map((item) => ({ ...item, category: 'statuslines' as const })),
        ...collectionsData.map((item) => ({ ...item, category: 'collections' as const })),
      ];

      // Enrich with view counts
      const enriched = await statsRedis.enrichWithViewCounts(allContent);

      // Filter out items with zero views and sort by views DESC
      const trending = enriched
        .filter((item) => (item.viewCount || 0) > 0)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, limit);

      // Map to digest format
      return trending.map((item) => ({
        title: item.title,
        description: item.description || '',
        category: item.category,
        slug: item.slug,
        url: `${APP_CONFIG.url}/${item.category}/${item.slug}`,
        viewCount: item.viewCount || 0,
      }));
    } catch (error) {
      logger.error(
        'Failed to get trending content for digest',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  /**
   * Generate complete digest for a specific week
   *
   * @param weekStart - Start date of the week
   * @returns Complete digest data
   */
  async generateDigest(weekStart: Date): Promise<WeeklyDigestData> {
    const cacheKey = `digest:${weekStart.toISOString().split('T')[0]}`;

    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        // Calculate week range
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Format week string (e.g., "December 2-8, 2025")
        const weekOf = this.formatWeekRange(weekStart, weekEnd);

        // Get new and trending content in parallel
        const [newContent, trendingContent] = await Promise.all([
          this.getNewContent(weekStart, 5),
          this.getTrendingContent(weekStart, 3),
        ]);

        logger.info('Generated weekly digest', {
          weekOf,
          newCount: newContent.length,
          trendingCount: trendingContent.length,
        });

        return {
          weekOf,
          newContent,
          trendingContent,
        };
      },
      // Cache for 1 hour
      3600
    );
  }

  /**
   * Format date range as readable string
   *
   * @param start - Start date
   * @param end - End date
   * @returns Formatted string (e.g., "December 2-8, 2025")
   */
  private formatWeekRange(start: Date, end: Date): string {
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    // Same month: "December 2-8, 2025"
    if (start.getMonth() === end.getMonth()) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }

    // Different months: "December 30 - January 5, 2025"
    const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  /**
   * Get start of current week (Monday)
   *
   * @returns Date object for start of week
   */
  getStartOfWeek(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get start of previous week
   *
   * @returns Date object for start of previous week
   */
  getStartOfPreviousWeek(date: Date = new Date()): Date {
    const start = this.getStartOfWeek(date);
    start.setDate(start.getDate() - 7);
    return start;
  }
}

/**
 * Singleton instance for application-wide use
 */
export const digestService = new DigestService();
