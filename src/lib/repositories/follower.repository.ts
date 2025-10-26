/**
 * Follower Repository
 *
 * Provides data access layer for user follow relationships with caching and performance monitoring.
 * Handles follower/following relationships for social features.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for follower/following counts and checks
 *
 * @module repositories/follower
 */

import { UI_CONFIG } from '@/src/lib/constants';
import {
  BaseRepository,
  type QueryOptions,
  type RepositoryResult,
} from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** Follower entity type from database */
export type Follower = Database['public']['Tables']['followers']['Row'];
export type FollowerInsert = Database['public']['Tables']['followers']['Insert'];
export type FollowerUpdate = Database['public']['Tables']['followers']['Update'];

/** Follower statistics */
export interface FollowerStats {
  follower_count: number; // Users following this user
  following_count: number; // Users this user is following
}

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * FollowerRepository
 * Handles all follower relationship data access
 */
export class FollowerRepository extends BaseRepository<Follower, string> {
  constructor() {
    super('FollowerRepository');
  }

  /**
   * Find follower relationship by ID
   */
  async findById(id: string): Promise<RepositoryResult<Follower | null>> {
    return this.executeOperation('findById', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.from('followers').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find follower relationship: ${error.message}`);
      }

      if (data) {
      }

      return data;
    });
  }

  /**
   * Find all follower relationships with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Follower[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('followers').select('*');

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
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find follower relationships: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one follower relationship matching criteria
   */
  async findOne(criteria: Partial<Follower>): Promise<RepositoryResult<Follower | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('followers').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Follower, value);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find follower relationship: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new follower relationship
   */
  async create(data: Omit<Follower, 'id' | 'created_at'>): Promise<RepositoryResult<Follower>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: follower, error } = await supabase
        .from('followers')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
        } as FollowerInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This follow relationship already exists');
        }
        throw new Error(`Failed to create follower relationship: ${error.message}`);
      }

      return follower;
    });
  }

  /**
   * Update existing follower relationship
   */
  async update(id: string, data: Partial<Follower>): Promise<RepositoryResult<Follower>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: follower, error } = await supabase
        .from('followers')
        .update(data as FollowerUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update follower relationship: ${error.message}`);
      }

      if (follower) {
      }

      return follower;
    });
  }

  /**
   * Delete follower relationship
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const followerResult = await this.findById(id);
      const follower = followerResult.success ? followerResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('followers').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete follower relationship: ${error.message}`);
      }

      if (follower) {
      }

      return true;
    });
  }

  /**
   * Check if follower relationship exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count follower relationships matching criteria
   */
  async count(criteria?: Partial<Follower>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('followers').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Follower, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count follower relationships: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM FOLLOWER METHODS
  // =====================================================

  /**
   * Get followers of a user (users who follow this user)
   */
  async getFollowers(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Follower[]>> {
    return this.executeOperation('getFollowers', async () => {
      if (!(options?.offset || options?.limit)) {
      }

      const supabase = await createClient();
      let query = supabase.from('followers').select('*').eq('following_id', userId);

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

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get followers: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
      }

      return data || [];
    });
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Follower[]>> {
    return this.executeOperation('getFollowing', async () => {
      if (!(options?.offset || options?.limit)) {
      }

      const supabase = await createClient();
      let query = supabase.from('followers').select('*').eq('follower_id', userId);

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

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get following: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
      }

      return data || [];
    });
  }

  /**
   * Check if user A follows user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('isFollowing', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check follow status: ${error.message}`);
      }

      const isFollowing = !!data;

      return isFollowing;
    });
  }

  /**
   * Get follower/following counts for a user
   */
  async getStats(userId: string): Promise<RepositoryResult<FollowerStats>> {
    return this.executeOperation('getStats', async () => {
      const supabase = await createClient();

      // Get follower count (users following this user)
      const { count: followerCount, error: followerError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followerError) {
        throw new Error(`Failed to count followers: ${followerError.message}`);
      }

      // Get following count (users this user is following)
      const { count: followingCount, error: followingError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) {
        throw new Error(`Failed to count following: ${followingError.message}`);
      }

      const stats: FollowerStats = {
        follower_count: followerCount || 0,
        following_count: followingCount || 0,
      };

      return stats;
    });
  }

  /**
   * Delete follow relationship by user IDs
   */
  async deleteByUserIds(
    followerId: string,
    followingId: string
  ): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteByUserIds', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) {
        throw new Error(`Failed to delete follow relationship: ${error.message}`);
      }

      return true;
    });
  }

  /**
   * Delete all follower relationships for a user (GDPR compliance)
   */
  async deleteByUser(userId: string): Promise<RepositoryResult<number>> {
    return this.executeOperation('deleteByUser', async () => {
      const supabase = await createClient();

      // Delete as follower
      const { error: error1, count: count1 } = await supabase
        .from('followers')
        .delete({ count: 'exact' })
        .eq('follower_id', userId);

      if (error1) {
        throw new Error(`Failed to delete follower relationships: ${error1.message}`);
      }

      // Delete as following
      const { error: error2, count: count2 } = await supabase
        .from('followers')
        .delete({ count: 'exact' })
        .eq('following_id', userId);

      if (error2) {
        throw new Error(`Failed to delete following relationships: ${error2.message}`);
      }

      return (count1 || 0) + (count2 || 0);
    });
  }
}

/**
 * Singleton instance
 */
export const followerRepository = new FollowerRepository();
