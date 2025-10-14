/**
 * User Interaction Repository
 *
 * Provides data access layer for user interactions tracking.
 * Used for personalization, analytics, and recommendation systems.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Supports anonymousinteractions via session_id
 *
 * @module repositories/user-interaction
 */

import { z } from 'zod';
import { UI_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
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

/** UserInteraction entity type from database */
export type UserInteraction = Database['public']['Tables']['user_interactions']['Row'];
export type UserInteractionInsert = Database['public']['Tables']['user_interactions']['Insert'];
export type UserInteractionUpdate = Database['public']['Tables']['user_interactions']['Update'];

/** Interaction type enum */
export const interactionTypeSchema = z.enum([
  'view',
  'click',
  'bookmark',
  'share',
  'download',
  'like',
  'upvote',
  'downvote',
]);

export type InteractionType = z.infer<typeof interactionTypeSchema>;

/** Interaction statistics */
export interface InteractionStats {
  total_interactions: number;
  unique_users: number;
  by_type: Record<string, number>;
  by_content_type: Record<string, number>;
}

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * UserInteractionRepository
 * Handles all user interaction tracking and analytics
 */
export class UserInteractionRepository extends CachedRepository<UserInteraction, string> {
  constructor() {
    super('UserInteractionRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find interaction by ID
   */
  async findById(id: string): Promise<RepositoryResult<UserInteraction | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find interaction: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all interactions with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<UserInteraction[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_interactions').select('*');

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
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find interactions: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one interaction matching criteria
   */
  async findOne(
    criteria: Partial<UserInteraction>
  ): Promise<RepositoryResult<UserInteraction | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_interactions').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof UserInteraction, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find interaction: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new interaction
   * Note: This is typically fire-and-forget for analytics
   */
  async create(data: Omit<UserInteraction, 'id'>): Promise<RepositoryResult<UserInteraction>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: interaction, error } = await supabase
        .from('user_interactions')
        .insert(data as UserInteractionInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create interaction: ${error.message}`);
      }

      // Clear user cache if user_id is present
      if (data.user_id) {
        this.clearCache(this.getCacheKey('user', data.user_id));
      }

      // Clear content cache
      this.clearCache(this.getCacheKey('content', `${data.content_type}:${data.content_slug}`));

      return interaction;
    });
  }

  /**
   * Update existing interaction (rarely used)
   */
  async update(
    id: string,
    data: Partial<UserInteraction>
  ): Promise<RepositoryResult<UserInteraction>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: interaction, error } = await supabase
        .from('user_interactions')
        .update(data as UserInteractionUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update interaction: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (interaction?.user_id) {
        this.clearCache(this.getCacheKey('user', interaction.user_id));
      }

      return interaction;
    });
  }

  /**
   * Delete interaction (rarely used, mostly for GDPR compliance)
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      // Get interaction first for cache invalidation
      const interactionResult = await this.findById(id);
      const interaction = interactionResult.success ? interactionResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('user_interactions').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete interaction: ${error.message}`);
      }

      // Clear caches
      this.clearCache(this.getCacheKey('id', id));
      if (interaction?.user_id) {
        this.clearCache(this.getCacheKey('user', interaction.user_id));
      }

      return true;
    });
  }

  /**
   * Check if interaction exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count interactions matching criteria
   */
  async count(criteria?: Partial<UserInteraction>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_interactions').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof UserInteraction, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count interactions: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM INTERACTION METHODS
  // =====================================================

  /**
   * Find interactions by user
   */
  async findByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserInteraction[]>> {
    return this.executeOperation('findByUser', async () => {
      if (!(options?.offset || options?.limit)) {
        const cacheKey = this.getCacheKey('user', userId);
        const cached = this.getFromCache(cacheKey);
        if (cached) return Array.isArray(cached) ? cached : [cached];
      }

      const supabase = await createClient();
      let query = supabase.from('user_interactions').select('*').eq('user_id', userId);

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
        throw new Error(`Failed to find user interactions: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
        const cacheKey = this.getCacheKey('user', userId);
        this.setCache(cacheKey, data as unknown as UserInteraction);
      }

      return data || [];
    });
  }

  /**
   * Find interactions by content
   */
  async findByContent(
    contentType: string,
    contentSlug: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserInteraction[]>> {
    return this.executeOperation('findByContent', async () => {
      if (!(options?.offset || options?.limit)) {
        const cacheKey = this.getCacheKey('content', `${contentType}:${contentSlug}`);
        const cached = this.getFromCache(cacheKey);
        if (cached) return Array.isArray(cached) ? cached : [cached];
      }

      const supabase = await createClient();
      let query = supabase
        .from('user_interactions')
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

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find content interactions: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
        const cacheKey = this.getCacheKey('content', `${contentType}:${contentSlug}`);
        this.setCache(cacheKey, data as unknown as UserInteraction);
      }

      return data || [];
    });
  }

  /**
   * Find interactions by type
   */
  async findByType(
    interactionType: InteractionType,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserInteraction[]>> {
    return this.executeOperation('findByType', async () => {
      const supabase = await createClient();
      let query = supabase
        .from('user_interactions')
        .select('*')
        .eq('interaction_type', interactionType);

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
        throw new Error(`Failed to find interactions by type: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find interactions by session (for anonymous users)
   */
  async findBySession(
    sessionId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<UserInteraction[]>> {
    return this.executeOperation('findBySession', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_interactions').select('*').eq('session_id', sessionId);

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
        throw new Error(`Failed to find session interactions: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Get interaction statistics
   */
  async getStats(options?: {
    userId?: string;
    contentType?: string;
    contentSlug?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RepositoryResult<InteractionStats>> {
    return this.executeOperation('getStats', async () => {
      const supabase = await createClient();
      let query = supabase.from('user_interactions').select('*');

      // Apply filters
      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options?.contentType) {
        query = query.eq('content_type', options.contentType);
      }
      if (options?.contentSlug) {
        query = query.eq('content_slug', options.contentSlug);
      }
      if (options?.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get interaction stats: ${error.message}`);
      }

      const interactions = data || [];
      const uniqueUsers = new Set(interactions.map((i) => i.user_id).filter(Boolean)).size;

      // Count by type
      const byType: Record<string, number> = {};
      interactions.forEach((i) => {
        byType[i.interaction_type] = (byType[i.interaction_type] || 0) + 1;
      });

      // Count by content type
      const byContentType: Record<string, number> = {};
      interactions.forEach((i) => {
        byContentType[i.content_type] = (byContentType[i.content_type] || 0) + 1;
      });

      const stats: InteractionStats = {
        total_interactions: interactions.length,
        unique_users: uniqueUsers,
        by_type: byType,
        by_content_type: byContentType,
      };

      return stats;
    });
  }

  /**
   * Track interaction (convenience method)
   * Fire-and-forget for analytics - errors logged but not thrown
   */
  async track(
    contentType: string,
    contentSlug: string,
    interactionType: InteractionType,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, unknown>
  ): Promise<RepositoryResult<UserInteraction | null>> {
    return this.executeOperation('track', async (): Promise<UserInteraction | null> => {
      try {
        const result = await this.create({
          content_type: contentType,
          content_slug: contentSlug,
          interaction_type: interactionType,
          user_id: userId || null,
          session_id: sessionId || null,
          metadata:
            (metadata as Database['public']['Tables']['user_interactions']['Row']['metadata']) ||
            null,
          created_at: new Date().toISOString(),
        });

        return result.success ? (result.data ?? null) : null;
      } catch (error) {
        // Log but don't throw - tracking should not break user experience
        logger.error(
          'Failed to track interaction',
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    });
  }

  /**
   * Delete all interactions for a user (GDPR compliance)
   */
  async deleteByUser(userId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteByUser', async () => {
      const supabase = await createClient();
      const { error } = await supabase.from('user_interactions').delete().eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete user interactions: ${error.message}`);
      }

      // Clear cache
      this.clearCache(this.getCacheKey('user', userId));

      return true;
    });
  }

  /**
   * Delete all interactions by session (GDPR compliance)
   */
  async deleteBySession(sessionId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('deleteBySession', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('user_interactions')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        throw new Error(`Failed to delete session interactions: ${error.message}`);
      }

      return true;
    });
  }
}

/**
 * Singleton instance
 */
export const userInteractionRepository = new UserInteractionRepository();
