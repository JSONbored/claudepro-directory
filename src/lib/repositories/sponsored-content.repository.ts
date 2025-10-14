/**
 * Sponsored Content Repository
 *
 * Provides data access layer for sponsored content management with caching and performance monitoring.
 * Handles sponsored content CRUD, impressions tracking, clicks tracking, and active content queries.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Fire-and-forget pattern for non-critical tracking
 * - Support for impression limits and date ranges
 *
 * @module repositories/sponsored-content
 */

import {
  CachedRepository,
  type QueryOptions,
  type RepositoryResult,
} from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CONFIG } from '@/src/lib/constants';
import type { Database } from '@/src/types/database.types';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** SponsoredContent entity type from database */
export type SponsoredContent = Database['public']['Tables']['sponsored_content']['Row'];
export type SponsoredContentInsert = Database['public']['Tables']['sponsored_content']['Insert'];
export type SponsoredContentUpdate = Database['public']['Tables']['sponsored_content']['Update'];

/** SponsoredImpression entity type from database */
export type SponsoredImpression = Database['public']['Tables']['sponsored_impressions']['Row'];
export type SponsoredImpressionInsert =
  Database['public']['Tables']['sponsored_impressions']['Insert'];

/** SponsoredClick entity type from database */
export type SponsoredClick = Database['public']['Tables']['sponsored_clicks']['Row'];
export type SponsoredClickInsert = Database['public']['Tables']['sponsored_clicks']['Insert'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * SponsoredContentRepository
 * Handles all sponsored content data access
 */
export class SponsoredContentRepository extends CachedRepository<SponsoredContent, string> {
  constructor() {
    super('SponsoredContentRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find sponsored content by ID
   */
  async findById(id: string): Promise<RepositoryResult<SponsoredContent | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('sponsored_content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find sponsored content: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all sponsored content with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<SponsoredContent[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('sponsored_content').select('*');

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(options.limit ?? UI_CONFIG.pagination.defaultLimit, UI_CONFIG.pagination.maxLimit);
        query = query.range(options.offset, options.offset + limit - 1);
      }

      if (options?.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.sortOrder === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find sponsored content: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one sponsored content matching criteria
   */
  async findOne(
    criteria: Partial<SponsoredContent>
  ): Promise<RepositoryResult<SponsoredContent | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('sponsored_content').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof SponsoredContent, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find sponsored content: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new sponsored content
   */
  async create(
    data: Omit<SponsoredContent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RepositoryResult<SponsoredContent>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();

      const { data: content, error } = await supabase
        .from('sponsored_content')
        .insert(data as SponsoredContentInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create sponsored content: ${error.message}`);
      }

      if (content) {
        this.setCache(this.getCacheKey('id', content.id), content);
        this.clearCache(this.getCacheKey('active', 'all'));
      }

      return content;
    });
  }

  /**
   * Update existing sponsored content
   */
  async update(
    id: string,
    data: Partial<SponsoredContent>
  ): Promise<RepositoryResult<SponsoredContent>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: content, error } = await supabase
        .from('sponsored_content')
        .update(data as SponsoredContentUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update sponsored content: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      this.clearCache(this.getCacheKey('active', 'all'));

      if (content) {
        this.setCache(this.getCacheKey('id', content.id), content);
      }

      return content;
    });
  }

  /**
   * Delete sponsored content
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const supabase = await createClient();
      const { error } = await supabase.from('sponsored_content').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete sponsored content: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      this.clearCache(this.getCacheKey('active', 'all'));

      return true;
    });
  }

  /**
   * Check if sponsored content exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count sponsored content matching criteria
   */
  async count(criteria?: Partial<SponsoredContent>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('sponsored_content').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof SponsoredContent, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count sponsored content: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM SPONSORED CONTENT METHODS
  // =====================================================

  /**
   * Get active sponsored content for injection
   * Returns content that is active, within date range, and hasn't hit impression limit
   */
  async findActive(limit = 5): Promise<RepositoryResult<SponsoredContent[]>> {
    return this.executeOperation('findActive', async () => {
      const cacheKey = this.getCacheKey('active', `limit-${limit}`);
      const cached = this.getFromCache(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];

      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('sponsored_content')
        .select('*')
        .eq('active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('tier', { ascending: true }) // Premium first
        .limit(limit);

      if (error) {
        throw new Error(`Failed to find active sponsored content: ${error.message}`);
      }

      // Filter out items that hit impression limit
      const filtered = (data || []).filter((item) => {
        const impressionCount = item.impression_count ?? 0;
        if (item.impression_limit && impressionCount >= item.impression_limit) {
          return false;
        }
        return true;
      });

      this.setCache(cacheKey, filtered as unknown as SponsoredContent);

      return filtered;
    });
  }

  /**
   * Track impression for sponsored content
   * Fire-and-forget pattern - don't throw on errors
   */
  async trackImpression(data: {
    sponsored_id: string;
    user_id?: string | null;
    page_url?: string | null;
    position?: number | null;
  }): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('trackImpression', async () => {
      const supabase = await createClient();

      // Insert impression
      const { error: insertError } = await supabase.from('sponsored_impressions').insert({
        sponsored_id: data.sponsored_id,
        user_id: data.user_id || null,
        page_url: data.page_url || null,
        position: data.position || null,
      } as SponsoredImpressionInsert);

      if (insertError) {
        // Best-effort tracking - don't throw
        return false;
      }

      // Increment count on sponsored_content (fire-and-forget)
      supabase
        .rpc('increment', {
          table_name: 'sponsored_content',
          row_id: data.sponsored_id,
          column_name: 'impression_count',
        })
        .then(() => {
          // Silent fail - don't block on counter increment
        });

      // Clear cache for this content
      this.clearCache(this.getCacheKey('id', data.sponsored_id));

      return true;
    });
  }

  /**
   * Track click for sponsored content
   * Fire-and-forget pattern - don't throw on errors
   */
  async trackClick(data: {
    sponsored_id: string;
    user_id?: string | null;
    target_url: string;
  }): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('trackClick', async () => {
      const supabase = await createClient();

      // Insert click
      const { error: insertError } = await supabase.from('sponsored_clicks').insert({
        sponsored_id: data.sponsored_id,
        user_id: data.user_id || null,
        target_url: data.target_url,
      } as SponsoredClickInsert);

      if (insertError) {
        // Best-effort tracking - don't throw
        return false;
      }

      // Increment count on sponsored_content (fire-and-forget)
      supabase
        .rpc('increment', {
          table_name: 'sponsored_content',
          row_id: data.sponsored_id,
          column_name: 'click_count',
        })
        .then(() => {
          // Silent fail - don't block on counter increment
        });

      // Clear cache for this content
      this.clearCache(this.getCacheKey('id', data.sponsored_id));

      return true;
    });
  }

  /**
   * Find sponsored content by user
   */
  async findByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<SponsoredContent[]>> {
    return this.executeOperation('findByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('sponsored_content').select('*').eq('user_id', userId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(options.limit ?? UI_CONFIG.pagination.defaultLimit, UI_CONFIG.pagination.maxLimit);
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user's sponsored content: ${error.message}`);
      }

      return data || [];
    });
  }
}

/**
 * Singleton instance
 */
export const sponsoredContentRepository = new SponsoredContentRepository();
