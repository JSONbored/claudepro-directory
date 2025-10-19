/**
 * Bookmark Repository
 *
 * Provides data access layer for bookmarks with caching and performance monitoring.
 * Separates data access logic from business logic for better testability and maintainability.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Zod validation for runtime safety
 *
 * @module repositories/bookmark
 */

import { z } from 'zod';
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

/** Bookmark entity type from database */
export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert'];
export type BookmarkUpdate = Database['public']['Tables']['bookmarks']['Update'];

/** Bookmark filter criteria */
export const bookmarkFilterSchema = z.object({
  user_id: z.string().uuid().optional(),
  content_type: z.string().optional(),
  content_slug: z.string().optional(),
});

export type BookmarkFilter = z.infer<typeof bookmarkFilterSchema>;

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * BookmarkRepository
 * Handles all bookmark data access with caching and performance monitoring
 */
export class BookmarkRepository extends CachedRepository<Bookmark, string> {
  constructor() {
    super('BookmarkRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find bookmark by ID
   */
  async findById(id: string): Promise<RepositoryResult<Bookmark | null>> {
    return this.executeOperation('findById', async () => {
      // Check cache first
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('bookmarks').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw new Error(`Failed to find bookmark: ${error.message}`);
      }

      // Cache the result
      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all bookmarks with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Bookmark[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('bookmarks').select('*');

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
        // Default sort by created_at descending
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find bookmarks: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one bookmark matching criteria
   */
  async findOne(criteria: Partial<Bookmark>): Promise<RepositoryResult<Bookmark | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('bookmarks').select('*');

      // Apply filters
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Bookmark, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find bookmark: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new bookmark
   */
  async create(data: Omit<Bookmark, 'id'>): Promise<RepositoryResult<Bookmark>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: bookmark, error } = await supabase
        .from('bookmarks')
        .insert(data as BookmarkInsert)
        .select()
        .single();

      if (error) {
        // Handle duplicate constraint
        if (error.code === '23505') {
          throw new Error('Bookmark already exists');
        }
        throw new Error(`Failed to create bookmark: ${error.message}`);
      }

      // Invalidate user's bookmark cache
      this.clearCache(this.getCacheKey('user', data.user_id));

      return bookmark;
    });
  }

  /**
   * Update existing bookmark
   */
  async update(id: string, data: Partial<Bookmark>): Promise<RepositoryResult<Bookmark>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: bookmark, error } = await supabase
        .from('bookmarks')
        .update(data as BookmarkUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update bookmark: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (bookmark) {
        this.clearCache(this.getCacheKey('user', bookmark.user_id));
      }

      return bookmark;
    });
  }

  /**
   * Delete bookmark (hard delete only - no soft delete for bookmarks)
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get bookmark first to invalidate user cache
      const bookmarkResult = await this.findById(id);
      const bookmark = bookmarkResult.success ? bookmarkResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete bookmark: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (bookmark) {
        this.clearCache(this.getCacheKey('user', bookmark.user_id));
      }

      return true;
    });
  }

  /**
   * Check if bookmark exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count bookmarks matching criteria
   */
  async count(criteria?: Partial<Bookmark>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('bookmarks').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Bookmark, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count bookmarks: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM METHODS
  // =====================================================

  /**
   * Find bookmarks by user ID
   * Commonly used query with dedicated caching
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Bookmark[]>> {
    return this.executeOperation('findByUser', async () => {
      // Check cache first (if no pagination/sorting)
      if (!(options?.offset || options?.limit)) {
        const cacheKey = this.getCacheKey('user', userId);
        const cached = this.getFromCache(cacheKey);
        if (cached) return Array.isArray(cached) ? cached : [cached];
      }

      const supabase = await createClient();
      let query = supabase.from('bookmarks').select('*').eq('user_id', userId);

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
      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user bookmarks: ${error.message}`);
      }

      // Cache if no pagination
      if (!(options?.offset || options?.limit) && data) {
        const cacheKey = this.getCacheKey('user', userId);
        this.setCache(cacheKey, data);
      }

      return data || [];
    });
  }

  /**
   * Find bookmark by content
   * Check if user has bookmarked specific content
   */
  async findByUserAndContent(
    userId: string,
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<Bookmark | null>> {
    return this.executeOperation('findByUserAndContent', async () => {
      const cacheKey = this.getCacheKey('user-content', `${userId}:${contentType}:${contentSlug}`);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find bookmark: ${error.message}`);
      }

      // Cache the result
      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Delete bookmark by content
   * Remove user's bookmark for specific content
   */
  async deleteByUserAndContent(
    userId: string,
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteByUserAndContent', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug);

      if (error) {
        throw new Error(`Failed to delete bookmark: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('user-content', `${userId}:${contentType}:${contentSlug}`));
      this.clearCache(this.getCacheKey('user', userId));

      return true;
    });
  }

  /**
   * Get bookmark count by content
   * How many users bookmarked this content
   */
  async countByContent(
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<number>> {
    return this.executeOperation('countByContent', async () => {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug);

      if (error) {
        throw new Error(`Failed to count bookmarks: ${error.message}`);
      }

      return count || 0;
    });
  }
}

/**
 * Singleton instance
 * Use this for consistent access across the application
 */
export const bookmarkRepository = new BookmarkRepository();
