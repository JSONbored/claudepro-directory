/**
 * Badge Repository
 *
 * Provides data access layer for badge definitions with caching and performance monitoring.
 * Handles badge CRUD operations, slug lookups, and active badge filtering.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for badge categories and tiers
 *
 * @module repositories/badge
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

/** Badge entity type from database */
export type Badge = Database['public']['Tables']['badges']['Row'];
export type BadgeInsert = Database['public']['Tables']['badges']['Insert'];
export type BadgeUpdate = Database['public']['Tables']['badges']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * BadgeRepository
 * Handles all badge definition data access
 */
export class BadgeRepository extends CachedRepository<Badge, string> {
  constructor() {
    super('BadgeRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find badge by ID
   */
  async findById(id: string): Promise<RepositoryResult<Badge | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('badges').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find badge: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        if (data.slug) {
          this.setCache(this.getCacheKey('slug', data.slug), data);
        }
      }

      return data;
    });
  }

  /**
   * Find all badges with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Badge[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('badges').select('*');

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
        query = query.order('order', { ascending: true }).order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find badges: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one badge matching criteria
   */
  async findOne(criteria: Partial<Badge>): Promise<RepositoryResult<Badge | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('badges').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Badge, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find badge: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new badge
   */
  async create(data: Omit<Badge, 'id' | 'created_at'>): Promise<RepositoryResult<Badge>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: badge, error } = await supabase
        .from('badges')
        .insert({
          ...data,
          created_at: now,
        } as BadgeInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A badge with this slug already exists');
        }
        throw new Error(`Failed to create badge: ${error.message}`);
      }

      if (badge) {
        this.setCache(this.getCacheKey('id', badge.id), badge);
        if (badge.slug) {
          this.setCache(this.getCacheKey('slug', badge.slug), badge);
        }
      }

      return badge;
    });
  }

  /**
   * Update existing badge
   */
  async update(id: string, data: Partial<Badge>): Promise<RepositoryResult<Badge>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: badge, error } = await supabase
        .from('badges')
        .update(data as BadgeUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update badge: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (badge?.slug) {
        this.clearCache(this.getCacheKey('slug', badge.slug));
      }

      if (badge) {
        this.setCache(this.getCacheKey('id', badge.id), badge);
        if (badge.slug) {
          this.setCache(this.getCacheKey('slug', badge.slug), badge);
        }
      }

      return badge;
    });
  }

  /**
   * Delete badge
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const badgeResult = await this.findById(id);
      const badge = badgeResult.success ? badgeResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('badges').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete badge: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (badge?.slug) {
        this.clearCache(this.getCacheKey('slug', badge.slug));
      }

      return true;
    });
  }

  /**
   * Check if badge exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count badges matching criteria
   */
  async count(criteria?: Partial<Badge>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('badges').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Badge, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count badges: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM BADGE METHODS
  // =====================================================

  /**
   * Find badge by slug
   */
  async findBySlug(slug: string): Promise<RepositoryResult<Badge | null>> {
    return this.executeOperation('findBySlug', async () => {
      const cacheKey = this.getCacheKey('slug', slug);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('badges').select('*').eq('slug', slug).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find badge by slug: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
        this.setCache(this.getCacheKey('id', data.id), data);
      }

      return data;
    });
  }

  /**
   * Get active badges only
   */
  async findActive(options?: QueryOptions): Promise<RepositoryResult<Badge[]>> {
    return this.executeOperation('findActive', async () => {
      const cacheKey = this.getCacheKey('active', 'true');
      const cached = this.getFromCache(cacheKey);
      if (cached) return Array.isArray(cached) ? cached : [cached];

      const supabase = await createClient();
      let query = supabase.from('badges').select('*').eq('active', true);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(options.limit ?? UI_CONFIG.pagination.defaultLimit, UI_CONFIG.pagination.maxLimit);
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order('order', { ascending: true }).order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get active badges: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data as unknown as Badge);
      }

      return data || [];
    });
  }

  /**
   * Find badges by category
   */
  async findByCategory(
    category: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Badge[]>> {
    return this.executeOperation('findByCategory', async () => {
      const supabase = await createClient();
      let query = supabase.from('badges').select('*').eq('category', category).eq('active', true);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(options.limit ?? UI_CONFIG.pagination.defaultLimit, UI_CONFIG.pagination.maxLimit);
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order('order', { ascending: true }).order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find badges by category: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('isSlugAvailable', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('badges')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
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
export const badgeRepository = new BadgeRepository();
