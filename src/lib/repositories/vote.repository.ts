/**
 * Vote Repository
 *
 * Provides data access layer for post votes with caching and performance monitoring.
 * Handles vote creation, deletion, and duplicate vote detection.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for duplicate vote prevention
 *
 * @module repositories/vote
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

/** Vote entity type from database */
export type Vote = Database['public']['Tables']['votes']['Row'];
export type VoteInsert = Database['public']['Tables']['votes']['Insert'];
export type VoteUpdate = Database['public']['Tables']['votes']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * VoteRepository
 * Handles all vote data access
 */
export class VoteRepository extends CachedRepository<Vote, string> {
  constructor() {
    super('VoteRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find vote by ID
   */
  async findById(id: string): Promise<RepositoryResult<Vote | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('votes').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find vote: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all votes with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Vote[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('votes').select('*');

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
        throw new Error(`Failed to find votes: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one vote matching criteria
   */
  async findOne(criteria: Partial<Vote>): Promise<RepositoryResult<Vote | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('votes').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Vote, value);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find vote: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new vote
   */
  async create(data: Omit<Vote, 'id' | 'created_at'>): Promise<RepositoryResult<Vote>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();

      const { data: vote, error } = await supabase
        .from('votes')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
        } as VoteInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already voted on this post');
        }
        throw new Error(`Failed to create vote: ${error.message}`);
      }

      // Invalidate related caches
      if (vote) {
        this.clearCache(this.getCacheKey('user-post', `${vote.user_id}:${vote.post_id}`));
      }

      return vote;
    });
  }

  /**
   * Update existing vote (not typically used for votes)
   */
  async update(id: string, data: Partial<Vote>): Promise<RepositoryResult<Vote>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: vote, error } = await supabase
        .from('votes')
        .update(data as VoteUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update vote: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('id', id));

      return vote;
    });
  }

  /**
   * Delete vote
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get vote first for cache invalidation
      const voteResult = await this.findById(id);
      const vote = voteResult.success ? voteResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('votes').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete vote: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (vote) {
        this.clearCache(this.getCacheKey('user-post', `${vote.user_id}:${vote.post_id}`));
      }

      return true;
    });
  }

  /**
   * Check if vote exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count votes matching criteria
   */
  async count(criteria?: Partial<Vote>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('votes').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Vote, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count votes: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM VOTE METHODS
  // =====================================================

  /**
   * Find vote by user and post (for duplicate detection)
   */
  async findByUserAndPost(userId: string, postId: string): Promise<RepositoryResult<Vote | null>> {
    return this.executeOperation('findByUserAndPost', async () => {
      const cacheKey = this.getCacheKey('user-post', `${userId}:${postId}`);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find vote: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Delete vote by user and post
   */
  async deleteByUserAndPost(userId: string, postId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteByUserAndPost', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        throw new Error(`Failed to delete vote: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('user-post', `${userId}:${postId}`));

      return true;
    });
  }

  /**
   * Find votes by post ID
   */
  async findByPost(postId: string, options?: QueryOptions): Promise<RepositoryResult<Vote[]>> {
    return this.executeOperation('findByPost', async () => {
      const supabase = await createClient();
      let query = supabase.from('votes').select('*').eq('post_id', postId);

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
        throw new Error(`Failed to find votes for post: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find votes by user ID
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Vote[]>> {
    return this.executeOperation('findByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('votes').select('*').eq('user_id', userId);

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
        throw new Error(`Failed to find votes for user: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Check if user has voted on post
   */
  async hasUserVoted(userId: string, postId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('hasUserVoted', async () => {
      const result = await this.findByUserAndPost(userId, postId);
      return result.success && result.data !== null;
    });
  }
}

/**
 * Singleton instance
 */
export const voteRepository = new VoteRepository();
