/**
 * User Repository
 *
 * Provides data access layer for user profiles with caching and performance monitoring.
 * Handles user profile CRUD operations, slug lookups, and user statistics.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for profile updates and OAuth syncing
 *
 * @module repositories/user
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

/** User entity type from database */
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

/** User profile statistics */
export interface UserStats {
  total_posts: number;
  total_followers: number;
  total_following: number;
  reputation_score: number;
  total_bookmarks: number;
  total_collections: number;
  total_reviews: number;
}

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * UserRepository
 * Handles all user profile data access
 */
export class UserRepository extends CachedRepository<User, string> {
  constructor() {
    super('UserRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<RepositoryResult<User | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find user: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        // Also cache by slug if available
        if (data.slug) {
          this.setCache(this.getCacheKey('slug', data.slug), data);
        }
      }

      return data;
    });
  }

  /**
   * Find all users with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<User[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('users').select('*');

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
        throw new Error(`Failed to find users: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one user matching criteria
   */
  async findOne(criteria: Partial<User>): Promise<RepositoryResult<User | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('users').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof User, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find user: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new user
   */
  async create(
    data: Omit<User, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RepositoryResult<User>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          ...data,
          created_at: now,
          updated_at: now,
        } as UserInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('User already exists');
        }
        throw new Error(`Failed to create user: ${error.message}`);
      }

      // Cache the new user
      if (user) {
        this.setCache(this.getCacheKey('id', user.id), user);
        if (user.slug) {
          this.setCache(this.getCacheKey('slug', user.slug), user);
        }
      }

      return user;
    });
  }

  /**
   * Update existing user
   */
  async update(id: string, data: Partial<User>): Promise<RepositoryResult<User>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      // Filter out undefined values to avoid exactOptionalPropertyTypes issues
      const updateData = Object.fromEntries(
        Object.entries({
          ...data,
          updated_at: new Date().toISOString(),
        }).filter(([_, value]) => value !== undefined)
      ) as UserUpdate;

      const { data: user, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      // Clear all caches for this user
      this.clearCache(this.getCacheKey('id', id));
      if (user?.slug) {
        this.clearCache(this.getCacheKey('slug', user.slug));
      }
      // Also clear old slug cache if slug was changed
      if (data.slug && data.slug !== user?.slug) {
        this.clearCache(this.getCacheKey('slug', data.slug));
      }

      // Cache the updated user
      if (user) {
        this.setCache(this.getCacheKey('id', user.id), user);
        if (user.slug) {
          this.setCache(this.getCacheKey('slug', user.slug), user);
        }
      }

      return user;
    });
  }

  /**
   * Delete user (hard delete)
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get user first for cache invalidation
      const userResult = await this.findById(id);
      const user = userResult.success ? userResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (user?.slug) {
        this.clearCache(this.getCacheKey('slug', user.slug));
      }

      return true;
    });
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count users matching criteria
   */
  async count(criteria?: Partial<User>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('users').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof User, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count users: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM USER METHODS
  // =====================================================

  /**
   * Find user by slug
   */
  async findBySlug(slug: string): Promise<RepositoryResult<User | null>> {
    return this.executeOperation('findBySlug', async () => {
      const cacheKey = this.getCacheKey('slug', slug);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('users').select('*').eq('slug', slug).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find user by slug: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        // Also cache by ID
        this.setCache(this.getCacheKey('id', data.id), data);
      }

      return data;
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<RepositoryResult<User | null>> {
    return this.executeOperation('findByEmail', async () => {
      const cacheKey = this.getCacheKey('email', email);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find user by email: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        // Also cache by ID and slug
        this.setCache(this.getCacheKey('id', data.id), data);
        if (data.slug) {
          this.setCache(this.getCacheKey('slug', data.slug), data);
        }
      }

      return data;
    });
  }

  /**
   * Refresh profile from OAuth provider
   * Syncs latest avatar and name from auth.users
   */
  async refreshFromOAuth(userId: string): Promise<RepositoryResult<User>> {
    return this.executeOperation('refreshFromOAuth', async () => {
      const supabase = await createClient();

      // Call the database function that syncs from auth.users
      const { error: rpcError } = await supabase.rpc('refresh_profile_from_oauth', {
        user_id: userId,
      });

      if (rpcError) {
        throw new Error(`Failed to refresh profile from OAuth: ${rpcError.message}`);
      }

      // Fetch the updated user
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) {
        throw new Error(`Failed to fetch refreshed user: ${error.message}`);
      }

      // Clear all caches for this user
      this.clearCache(this.getCacheKey('id', userId));
      if (data?.slug) {
        this.clearCache(this.getCacheKey('slug', data.slug));
      }

      // Cache the refreshed user
      if (data) {
        this.setCache(this.getCacheKey('id', data.id), data);
        if (data.slug) {
          this.setCache(this.getCacheKey('slug', data.slug), data);
        }
      }

      return data;
    });
  }

  /**
   * Find public users (for discovery)
   */
  async findPublicUsers(options?: QueryOptions): Promise<RepositoryResult<User[]>> {
    return this.executeOperation('findPublicUsers', async () => {
      const supabase = await createClient();
      let query = supabase.from('users').select('*').eq('public', true);

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

      query = query.order(options?.sortBy || 'reputation_score', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find public users: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Get top users by reputation
   */
  async getTopByReputation(limit = 10): Promise<RepositoryResult<User[]>> {
    return this.executeOperation('getTopByReputation', async () => {
      const cacheKey = this.getCacheKey('top-reputation', String(limit));
      const cached = this.getFromCache(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('reputation_score', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get top users: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data || [];
    });
  }

  /**
   * Update reputation score
   */
  async updateReputation(userId: string, reputationScore: number): Promise<RepositoryResult<User>> {
    return this.executeOperation('updateReputation', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('users')
        .update({
          reputation_score: reputationScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update reputation: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', userId));
      if (data?.slug) {
        this.clearCache(this.getCacheKey('slug', data.slug));
      }
      this.clearCache(this.getCacheKey('top-reputation', '10'));

      return data;
    });
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeUserId?: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('isSlugAvailable', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to check slug availability: ${error.message}`);
      }

      return (count || 0) === 0;
    });
  }
}

/**
 * Singleton instance
 */
export const userRepository = new UserRepository();
