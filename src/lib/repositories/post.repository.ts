/**
 * Post Repository
 *
 * Provides data access layer for community board posts with caching and performance monitoring.
 * Handles post CRUD operations, voting, comments, and duplicate URL detection.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for vote counts and comment counts
 *
 * @module repositories/post
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

/** Post entity type from database */
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'];
export type PostUpdate = Database['public']['Tables']['posts']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * PostRepository
 * Handles all community board post data access
 */
export class PostRepository extends CachedRepository<Post, string> {
  constructor() {
    super('PostRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find post by ID
   */
  async findById(id: string): Promise<RepositoryResult<Post | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find post: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all posts with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Post[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('posts').select('*');

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
        throw new Error(`Failed to find posts: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one post matching criteria
   */
  async findOne(criteria: Partial<Post>): Promise<RepositoryResult<Post | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('posts').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Post, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find post: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new post
   */
  async create(
    data: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'vote_count' | 'comment_count'>
  ): Promise<RepositoryResult<Post>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          ...data,
          created_at: now,
          updated_at: now,
        } as PostInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create post: ${error.message}`);
      }

      // Cache the new post
      if (post) {
        this.setCache(this.getCacheKey('id', post.id), post);
      }

      return post;
    });
  }

  /**
   * Update existing post
   */
  async update(id: string, data: Partial<Post>): Promise<RepositoryResult<Post>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: post, error } = await supabase
        .from('posts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as PostUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update post: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('id', id));

      // Cache the updated post
      if (post) {
        this.setCache(this.getCacheKey('id', post.id), post);
      }

      return post;
    });
  }

  /**
   * Delete post
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const supabase = await createClient();
      const { error } = await supabase.from('posts').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('id', id));

      return true;
    });
  }

  /**
   * Check if post exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count posts matching criteria
   */
  async count(criteria?: Partial<Post>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('posts').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Post, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count posts: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM POST METHODS
  // =====================================================

  /**
   * Find posts by user ID
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Post[]>> {
    return this.executeOperation('findByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('posts').select('*').eq('user_id', userId);

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
        throw new Error(`Failed to find user posts: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find post by URL (for duplicate detection)
   */
  async findByUrl(url: string): Promise<RepositoryResult<Post | null>> {
    return this.executeOperation('findByUrl', async () => {
      const cacheKey = this.getCacheKey('url', url);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('url', url)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find post by URL: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        this.setCache(this.getCacheKey('id', data.id), data);
      }

      return data;
    });
  }

  /**
   * Update post with ownership verification
   */
  async updateByOwner(
    id: string,
    userId: string,
    data: Partial<Post>
  ): Promise<RepositoryResult<Post>> {
    return this.executeOperation('updateByOwner', async () => {
      const supabase = await createClient();

      const { data: post, error } = await supabase
        .from('posts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as PostUpdate)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update post: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('id', id));

      // Cache the updated post
      if (post) {
        this.setCache(this.getCacheKey('id', post.id), post);
      }

      return post;
    });
  }

  /**
   * Delete post with ownership verification
   */
  async deleteByOwner(id: string, userId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteByOwner', async () => {
      const supabase = await createClient();
      const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('id', id));

      return true;
    });
  }

  /**
   * Get popular posts (by vote count)
   */
  async getPopular(limit = 20): Promise<RepositoryResult<Post[]>> {
    return this.executeOperation('getPopular', async () => {
      const cacheKey = this.getCacheKey('popular', String(limit));
      const cached = this.getFromCache(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get popular posts: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data as unknown as Post);
      }

      return data || [];
    });
  }

  /**
   * Get recent posts
   */
  async getRecent(limit = 20): Promise<RepositoryResult<Post[]>> {
    return this.executeOperation('getRecent', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get recent posts: ${error.message}`);
      }

      return data || [];
    });
  }
}

/**
 * Singleton instance
 */
export const postRepository = new PostRepository();
