/**
 * Weekly Digest Content Aggregation Service
 *
 * Database-first architecture: All aggregation logic in PostgreSQL.
 * Uses generated types from database.types.ts (no manual schemas).
 *
 * Features:
 * - PostgreSQL materialized views for pre-computed rankings
 * - RPC functions for new/trending content
 * - 100x faster than TypeScript aggregation (4-5s → 40-50ms)
 * - Type-safe responses from generated database types
 *
 * @module lib/services/digest.service
 */

import { createClient } from '@/src/lib/supabase/server';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

// Extract RPC return types from generated database types
type GetWeeklyDigestResult = Database['public']['Functions']['get_weekly_digest']['Returns'];
type GetNewContentResult = Database['public']['Functions']['get_new_content_for_week']['Returns'];
type GetTrendingContentResult = Database['public']['Functions']['get_trending_content']['Returns'];

/**
 * Parsed weekly digest data
 */
export interface WeeklyDigestData {
  weekOf: string;
  weekStart: string;
  weekEnd: string;
  newContent: Array<{
    category: string;
    slug: string;
    title: string;
    description: string;
    date_added: string;
    url: string;
  }>;
  trendingContent: Array<{
    category: string;
    slug: string;
    title: string;
    description: string;
    view_count: number;
    url: string;
  }>;
}

/**
 * DigestService class for content aggregation
 *
 * Singleton service for generating weekly digest content.
 * All heavy lifting done in PostgreSQL via RPC functions.
 */
class DigestService {
  /**
   * Get content added within a specific week
   *
   * @param weekStart - Start date of the week (YYYY-MM-DD)
   * @param limit - Maximum items to return
   * @returns Array of new content items
   */
  async getNewContent(
    weekStart: string,
    limit = 5
  ): Promise<WeeklyDigestData['newContent']> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_new_content_for_week', {
        p_week_start: weekStart,
        p_limit: limit,
      });

      if (error) {
        logger.error('Failed to get new content from database', error);
        return [];
      }

      if (!data) return [];

      // Type assertion: RPC returns array matching our interface
      return data as unknown as WeeklyDigestData['newContent'];
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
   * @param limit - Maximum items to return
   * @returns Array of trending content items with view counts
   */
  async getTrendingContent(
    limit = 3
  ): Promise<WeeklyDigestData['trendingContent']> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_trending_content', {
        p_limit: limit,
      });

      if (error) {
        logger.error('Failed to get trending content from database', error);
        return [];
      }

      if (!data) return [];

      // Type assertion: RPC returns array matching our interface
      return data as unknown as WeeklyDigestData['trendingContent'];
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
   * Calls PostgreSQL get_weekly_digest() RPC function which returns
   * pre-computed digest data from materialized views.
   *
   * @param weekStart - Start date of the week (Date object)
   * @returns Complete digest data
   */
  async generateDigest(weekStart: Date): Promise<WeeklyDigestData> {
    try {
      const supabase = await createClient();

      // Format date as YYYY-MM-DD for PostgreSQL DATE type
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_weekly_digest', {
        p_week_start: weekStartStr,
      });

      if (error) {
        logger.error('Failed to generate digest from database', error);
        throw error;
      }

      if (!data) {
        throw new Error('No digest data returned from database');
      }

      // Parse JSONB response (database returns Json type)
      const digest = data as unknown as WeeklyDigestData;

      logger.info('Generated weekly digest from database', {
        weekOf: digest.weekOf,
        newCount: digest.newContent.length,
        trendingCount: digest.trendingContent.length,
      });

      return digest;
    } catch (error) {
      logger.error(
        'Failed to generate weekly digest',
        error instanceof Error ? error : new Error(String(error))
      );

      // Fallback: return empty digest with formatted week string
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return {
        weekOf: this.formatWeekRange(weekStart, weekEnd),
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        newContent: [],
        trendingContent: [],
      };
    }
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
