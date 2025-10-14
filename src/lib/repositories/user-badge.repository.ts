/**
 * User Badge Repository
 *
 * Provides data access layer for user badge assignments with caching and performance monitoring.
 * Handles badge earning, tracking, and querying with badge details joins.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for badge joins and filtering
 *
 * @module repositories/user-badge
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

/** UserBadge entity type from database */
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type UserBadgeInsert = Database['public']['Tables']['user_badges']['Insert'];
export type UserBadgeUpdate = Database['public']['Tables']['user_badges']['Update'];

/** UserBadge with badge details joined */
export type UserBadgeWithBadge = {
  id: string;
  badge_id: string;
  earned_at: string;
  featured: boolean;
  badges: {
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
  };
};

/** Badge earned item for notifications */
export type BadgeEarnedItem = {
  earned_at: string;
  badge: {
    name: string;
    description: string;
    icon: string | null;
  };
};

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * UserBadgeRepository
 * Handles all user badge assignment data access
 */
export class UserBadgeRepository extends CachedRepository<UserBadge, string> {
  constructor() {
    super('UserBadgeRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find user badge by ID
   */
  async findById(id: string): Promise<RepositoryResult<UserBadge | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('user_badges').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find user badge: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all user badges with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<UserBadge[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_badges').select('*');

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

      if (options?.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.sortOrder === 'asc',
        });
      } else {
        query = query.order('earned_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user badges: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one user badge matching criteria
   */
  async findOne(criteria: Partial<UserBadge>): Promise<RepositoryResult<UserBadge | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_badges').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof UserBadge, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find user badge: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new user badge (award badge to user)
   */
  async create(data: Omit<UserBadge, 'id' | 'earned_at'>): Promise<RepositoryResult<UserBadge>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: userBadge, error } = await supabase
        .from('user_badges')
        .insert({
          ...data,
          earned_at: now,
        } as UserBadgeInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('User already has this badge');
        }
        throw new Error(`Failed to award badge: ${error.message}`);
      }

      if (userBadge) {
        this.setCache(this.getCacheKey('id', userBadge.id), userBadge);
        this.clearCache(this.getCacheKey('user', userBadge.user_id));
      }

      return userBadge;
    });
  }

  /**
   * Update existing user badge
   */
  async update(id: string, data: Partial<UserBadge>): Promise<RepositoryResult<UserBadge>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: userBadge, error } = await supabase
        .from('user_badges')
        .update(data as UserBadgeUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user badge: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (userBadge?.user_id) {
        this.clearCache(this.getCacheKey('user', userBadge.user_id));
      }

      if (userBadge) {
        this.setCache(this.getCacheKey('id', userBadge.id), userBadge);
      }

      return userBadge;
    });
  }

  /**
   * Delete user badge (revoke badge from user)
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const userBadgeResult = await this.findById(id);
      const userBadge = userBadgeResult.success ? userBadgeResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('user_badges').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to revoke badge: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (userBadge?.user_id) {
        this.clearCache(this.getCacheKey('user', userBadge.user_id));
      }

      return true;
    });
  }

  /**
   * Check if user badge exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count user badges matching criteria
   */
  async count(criteria?: Partial<UserBadge>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_badges').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof UserBadge, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count user badges: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM USER BADGE METHODS
  // =====================================================

  /**
   * Find user's badges with badge details
   */
  async findByUserWithBadgeDetails(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserBadgeWithBadge[]>> {
    return this.executeOperation('findByUserWithBadgeDetails', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('user_badges')
        .select(
          `
          id,
          badge_id,
          earned_at,
          featured,
          badges!inner (
            slug,
            name,
            description,
            icon,
            category
          )
        `
        )
        .eq('user_id', userId);

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

      query = query.order('earned_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch user badges with details: ${error.message}`);
      }

      return (data as unknown as UserBadgeWithBadge[]) || [];
    });
  }

  /**
   * Find user's badges (simple, without joins)
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<UserBadge[]>> {
    return this.executeOperation('findByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_badges').select('*').eq('user_id', userId);

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

      query = query.order('earned_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user badges: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find recently earned badges for user
   */
  async findRecentlyEarned(
    userId: string,
    since?: string
  ): Promise<RepositoryResult<BadgeEarnedItem[]>> {
    return this.executeOperation('findRecentlyEarned', async () => {
      const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_badges')
        .select(
          `
          earned_at,
          badge:badges (
            name,
            description,
            icon
          )
        `
        )
        .eq('user_id', userId)
        .gte('earned_at', sinceTime)
        .order('earned_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to find recently earned badges: ${error.message}`);
      }

      return (data as unknown as BadgeEarnedItem[]) || [];
    });
  }

  /**
   * Check if user has specific badge
   */
  async hasUserBadge(userId: string, badgeId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('hasUserBadge', async () => {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from('user_badges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('badge_id', badgeId);

      if (error) {
        throw new Error(`Failed to check user badge: ${error.message}`);
      }

      return (count || 0) > 0;
    });
  }

  /**
   * Get user's featured badges
   */
  async findFeaturedByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserBadgeWithBadge[]>> {
    return this.executeOperation('findFeaturedByUser', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('user_badges')
        .select(
          `
          id,
          badge_id,
          earned_at,
          featured,
          badges!inner (
            slug,
            name,
            description,
            icon,
            category
          )
        `
        )
        .eq('user_id', userId)
        .eq('featured', true);

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('earned_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch featured badges: ${error.message}`);
      }

      return (data as unknown as UserBadgeWithBadge[]) || [];
    });
  }

  /**
   * Toggle featured status for user badge
   */
  async toggleFeatured(id: string, featured: boolean): Promise<RepositoryResult<UserBadge>> {
    return this.executeOperation('toggleFeatured', async () => {
      const supabase = await createClient();

      const { data: userBadge, error } = await supabase
        .from('user_badges')
        .update({ featured } as UserBadgeUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to toggle featured status: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (userBadge?.user_id) {
        this.clearCache(this.getCacheKey('user', userBadge.user_id));
      }

      if (userBadge) {
        this.setCache(this.getCacheKey('id', userBadge.id), userBadge);
      }

      return userBadge;
    });
  }
}

/**
 * Singleton instance
 */
export const userBadgeRepository = new UserBadgeRepository();
