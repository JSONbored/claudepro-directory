/**
 * User Affinity Repository
 *
 * Provides data access layer for user affinities with caching and performance monitoring.
 * Handles personalization scores that indicate user preferences for specific content.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for affinity score calculations
 *
 * @module repositories/user-affinity
 */

import { UI_CONFIG } from '@/src/lib/constants';
import {
  CachedRepository,
  type QueryOptions,
  type RepositoryResult,
} from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** User Affinity entity type from database */
export type UserAffinity = Database['public']['Tables']['user_affinities']['Row'];
export type UserAffinityInsert = Database['public']['Tables']['user_affinities']['Insert'];
export type UserAffinityUpdate = Database['public']['Tables']['user_affinities']['Update'];

/** Affinity statistics */
export interface AffinityStats {
  total_affinities: number;
  avg_score: number;
  max_score: number;
  by_category: Record<string, { count: number; avg_score: number }>;
  top_content: Array<{
    content_type: string;
    content_slug: string;
    affinity_score: number;
  }>;
}

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * UserAffinityRepository
 * Handles all user affinity data access for personalization
 */
export class UserAffinityRepository extends CachedRepository<UserAffinity, string> {
  constructor() {
    super('UserAffinityRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find affinity by ID
   */
  async findById(id: string): Promise<RepositoryResult<UserAffinity | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_affinities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find affinity: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all affinities with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<UserAffinity[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_affinities').select('*');

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      // Apply sorting
      if (options?.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.sortOrder === 'asc',
        });
      } else {
        query = query.order('affinity_score', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find affinities: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one affinity matching criteria
   */
  async findOne(criteria: Partial<UserAffinity>): Promise<RepositoryResult<UserAffinity | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_affinities').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof UserAffinity, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find affinity: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new affinity
   */
  async create(
    data: Omit<UserAffinity, 'id' | 'calculated_at'>
  ): Promise<RepositoryResult<UserAffinity>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: affinity, error } = await supabase
        .from('user_affinities')
        .insert({
          ...data,
          calculated_at: new Date().toISOString(),
        } as UserAffinityInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Affinity already exists for this user and content');
        }
        throw new Error(`Failed to create affinity: ${error.message}`);
      }

      // Invalidate user's affinities cache
      this.clearCache(this.getCacheKey('user', data.user_id));

      return affinity;
    });
  }

  /**
   * Update existing affinity
   */
  async update(id: string, data: Partial<UserAffinity>): Promise<RepositoryResult<UserAffinity>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: affinity, error } = await supabase
        .from('user_affinities')
        .update({
          ...data,
          calculated_at: new Date().toISOString(),
        } as UserAffinityUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update affinity: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (affinity) {
        this.clearCache(this.getCacheKey('user', affinity.user_id));
        this.clearCache(
          this.getCacheKey('content', `${affinity.content_type}:${affinity.content_slug}`)
        );
      }

      return affinity;
    });
  }

  /**
   * Delete affinity
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get affinity first for cache invalidation
      const affinityResult = await this.findById(id);
      const affinity = affinityResult.success ? affinityResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('user_affinities').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete affinity: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (affinity) {
        this.clearCache(this.getCacheKey('user', affinity.user_id));
        this.clearCache(
          this.getCacheKey('content', `${affinity.content_type}:${affinity.content_slug}`)
        );
      }

      return true;
    });
  }

  /**
   * Check if affinity exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count affinities matching criteria
   */
  async count(criteria?: Partial<UserAffinity>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_affinities').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof UserAffinity, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count affinities: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM USER AFFINITY METHODS
  // =====================================================

  /**
   * Find affinities by user ID
   */
  async findByUser(
    userId: string,
    options?: QueryOptions & { minScore?: number }
  ): Promise<RepositoryResult<UserAffinity[]>> {
    return this.executeOperation('findByUser', async () => {
      if (!(options?.offset || options?.limit || options?.minScore)) {
        const cacheKey = this.getCacheKey('user', userId);
        const cached = this.getFromCache(cacheKey);
        if (cached) return Array.isArray(cached) ? cached : [cached];
      }

      const supabase = await createClient();
      let query = supabase.from('user_affinities').select('*').eq('user_id', userId);

      // Apply minimum score filter
      if (options?.minScore) {
        query = query.gte('affinity_score', options.minScore);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order(options?.sortBy || 'affinity_score', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user affinities: ${error.message}`);
      }

      if (!(options?.offset || options?.limit || options?.minScore) && data) {
        const cacheKey = this.getCacheKey('user', userId);
        this.setCache(cacheKey, data as unknown as UserAffinity);
      }

      return data || [];
    });
  }

  /**
   * Find affinity by user and content
   */
  async findByUserAndContent(
    userId: string,
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<UserAffinity | null>> {
    return this.executeOperation('findByUserAndContent', async () => {
      const cacheKey = this.getCacheKey('user-content', `${userId}:${contentType}:${contentSlug}`);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_affinities')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find affinity: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find affinities for specific content
   */
  async findByContent(
    contentType: string,
    contentSlug: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserAffinity[]>> {
    return this.executeOperation('findByContent', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('user_affinities')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order(options?.sortBy || 'affinity_score', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find content affinities: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Upsert affinity (create or update)
   */
  async upsert(
    userId: string,
    contentType: string,
    contentSlug: string,
    affinityScore: number,
    basedOn?: Record<string, unknown>
  ): Promise<RepositoryResult<UserAffinity>> {
    return this.executeOperation('upsert', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_affinities')
        .upsert(
          {
            user_id: userId,
            content_type: contentType,
            content_slug: contentSlug,
            affinity_score: affinityScore,
            based_on: basedOn || null,
            calculated_at: new Date().toISOString(),
          } as UserAffinityInsert,
          {
            onConflict: 'user_id,content_type,content_slug',
          }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to upsert affinity: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('user', userId));
      this.clearCache(this.getCacheKey('user-content', `${userId}:${contentType}:${contentSlug}`));

      return data;
    });
  }

  /**
   * Get affinity statistics for a user
   */
  async getStats(userId: string): Promise<RepositoryResult<AffinityStats>> {
    return this.executeOperation('getStats', async () => {
      const cacheKey = this.getCacheKey('stats', userId);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached as unknown as AffinityStats;

      const affinitiesResult = await this.findByUser(userId);
      if (!affinitiesResult.success) {
        throw new Error('Failed to fetch affinities for stats');
      }

      const affinities = affinitiesResult.data || [];

      // Calculate statistics
      const totalAffinities = affinities.length;
      const avgScore =
        totalAffinities > 0
          ? affinities.reduce((sum, a) => sum + a.affinity_score, 0) / totalAffinities
          : 0;
      const maxScore =
        totalAffinities > 0 ? Math.max(...affinities.map((a) => a.affinity_score)) : 0;

      // Group by category
      const byCategory: Record<string, { count: number; total: number }> = {};
      for (const affinity of affinities) {
        if (!byCategory[affinity.content_type]) {
          byCategory[affinity.content_type] = { count: 0, total: 0 };
        }
        const categoryStats = byCategory[affinity.content_type];
        if (categoryStats) {
          categoryStats.count++;
          categoryStats.total += affinity.affinity_score;
        }
      }

      const byCategoryStats: Record<string, { count: number; avg_score: number }> = {};
      for (const [category, stats] of Object.entries(byCategory)) {
        byCategoryStats[category] = {
          count: stats.count,
          avg_score: stats.total / stats.count,
        };
      }

      // Top content
      const topContent = affinities
        .sort((a, b) => b.affinity_score - a.affinity_score)
        .slice(0, 10)
        .map((a) => ({
          content_type: a.content_type,
          content_slug: a.content_slug,
          affinity_score: a.affinity_score,
        }));

      const stats: AffinityStats = {
        total_affinities: totalAffinities,
        avg_score: avgScore,
        max_score: maxScore,
        by_category: byCategoryStats,
        top_content: topContent,
      };

      this.setCache(cacheKey, stats as unknown as UserAffinity);

      return stats;
    });
  }

  /**
   * Delete all affinities for a user (GDPR compliance)
   */
  async deleteByUser(userId: string): Promise<RepositoryResult<number>> {
    return this.executeOperation('deleteByUser', async () => {
      const supabase = await createClient();
      const { error, count } = await supabase
        .from('user_affinities')
        .delete({ count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete user affinities: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('user', userId));

      return count || 0;
    });
  }

  /**
   * Get top affinities by category
   */
  async getTopByCategory(
    userId: string,
    category: string,
    limit = 10
  ): Promise<RepositoryResult<UserAffinity[]>> {
    return this.executeOperation('getTopByCategory', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_affinities')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', category)
        .order('affinity_score', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get top affinities by category: ${error.message}`);
      }

      return data || [];
    });
  }
}

/**
 * Singleton instance
 */
export const userAffinityRepository = new UserAffinityRepository();
