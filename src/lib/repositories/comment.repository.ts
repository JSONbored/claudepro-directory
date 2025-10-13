/**
 * Comment Repository
 *
 * Provides data access layer for post comments with caching and performance monitoring.
 * Handles comment CRUD operations and ownership verification.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for nested comments (future)
 *
 * @module repositories/comment
 */

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

/** Comment entity type from database */
export type Comment = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * CommentRepository
 * Handles all comment data access
 */
export class CommentRepository extends CachedRepository<Comment, string> {
  constructor() {
    super('CommentRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find comment by ID
   */
  async findById(id: string): Promise<RepositoryResult<Comment | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('comments').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find comment: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all comments with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Comment[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('comments').select('*');

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
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
        throw new Error(`Failed to find comments: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one comment matching criteria
   */
  async findOne(criteria: Partial<Comment>): Promise<RepositoryResult<Comment | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('comments').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Comment, value);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find comment: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new comment
   */
  async create(
    data: Omit<Comment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RepositoryResult<Comment>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          ...data,
          created_at: now,
          updated_at: now,
        } as CommentInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create comment: ${error.message}`);
      }

      // Invalidate post comments cache
      if (comment) {
        this.clearCache(this.getCacheKey('post', comment.post_id));
      }

      return comment;
    });
  }

  /**
   * Update existing comment
   */
  async update(id: string, data: Partial<Comment>): Promise<RepositoryResult<Comment>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: comment, error } = await supabase
        .from('comments')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as CommentUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update comment: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('id', id));
      if (comment) {
        this.clearCache(this.getCacheKey('post', comment.post_id));
      }

      return comment;
    });
  }

  /**
   * Delete comment
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get comment first for cache invalidation
      const commentResult = await this.findById(id);
      const comment = commentResult.success ? commentResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('comments').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete comment: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (comment) {
        this.clearCache(this.getCacheKey('post', comment.post_id));
      }

      return true;
    });
  }

  /**
   * Check if comment exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count comments matching criteria
   */
  async count(criteria?: Partial<Comment>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('comments').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Comment, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count comments: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM COMMENT METHODS
  // =====================================================

  /**
   * Find comments by post ID
   */
  async findByPost(postId: string, options?: QueryOptions): Promise<RepositoryResult<Comment[]>> {
    return this.executeOperation('findByPost', async () => {
      const supabase = await createClient();
      let query = supabase.from('comments').select('*').eq('post_id', postId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find comments for post: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find comments by user ID
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Comment[]>> {
    return this.executeOperation('findByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('comments').select('*').eq('user_id', userId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find comments for user: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Delete comment with ownership verification
   */
  async deleteByOwner(id: string, userId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteByOwner', async () => {
      // Get comment first for cache invalidation
      const commentResult = await this.findById(id);
      const comment = commentResult.success ? commentResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete comment: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (comment) {
        this.clearCache(this.getCacheKey('post', comment.post_id));
      }

      return true;
    });
  }

  /**
   * Get recent comments across all posts
   */
  async getRecent(limit = 20): Promise<RepositoryResult<Comment[]>> {
    return this.executeOperation('getRecent', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get recent comments: ${error.message}`);
      }

      return data || [];
    });
  }
}

/**
 * Singleton instance
 */
export const commentRepository = new CommentRepository();
