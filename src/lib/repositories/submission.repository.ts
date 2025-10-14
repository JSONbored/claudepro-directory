/**
 * Submission Repository
 *
 * Provides data access layer for content submissions with caching and performance monitoring.
 * Handles submission CRUD operations, status tracking, and user submission queries.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for submission status tracking
 *
 * @module repositories/submission
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

/** Submission entity type from database */
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * SubmissionRepository
 * Handles all content submission data access
 */
export class SubmissionRepository extends CachedRepository<Submission, string> {
  constructor() {
    super('SubmissionRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Find submission by ID
   */
  async findById(id: string): Promise<RepositoryResult<Submission | null>> {
    return this.executeOperation('findById', async () => {
      const cacheKey = this.getCacheKey('id', id);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();
      const { data, error } = await supabase.from('submissions').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find submission: ${error.message}`);
      }

      if (data) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Find all submissions with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Submission[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('submissions').select('*');

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
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find submissions: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one submission matching criteria
   */
  async findOne(criteria: Partial<Submission>): Promise<RepositoryResult<Submission | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('submissions').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Submission, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find submission: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new submission
   */
  async create(
    data: Omit<Submission, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RepositoryResult<Submission>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: submission, error } = await supabase
        .from('submissions')
        .insert({
          ...data,
          created_at: now,
          updated_at: now,
        } as SubmissionInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create submission: ${error.message}`);
      }

      if (submission) {
        this.setCache(this.getCacheKey('id', submission.id), submission);
        // Clear user cache
        this.clearCache(this.getCacheKey('user', submission.user_id));
      }

      return submission;
    });
  }

  /**
   * Update existing submission
   */
  async update(id: string, data: Partial<Submission>): Promise<RepositoryResult<Submission>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: submission, error } = await supabase
        .from('submissions')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as SubmissionUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update submission: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (submission?.user_id) {
        this.clearCache(this.getCacheKey('user', submission.user_id));
      }

      if (submission) {
        this.setCache(this.getCacheKey('id', submission.id), submission);
      }

      return submission;
    });
  }

  /**
   * Delete submission
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const submissionResult = await this.findById(id);
      const submission = submissionResult.success ? submissionResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('submissions').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete submission: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (submission?.user_id) {
        this.clearCache(this.getCacheKey('user', submission.user_id));
      }

      return true;
    });
  }

  /**
   * Check if submission exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count submissions matching criteria
   */
  async count(criteria?: Partial<Submission>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('submissions').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Submission, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count submissions: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM SUBMISSION METHODS
  // =====================================================

  /**
   * Find submissions by user ID
   */
  async findByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Submission[]>> {
    return this.executeOperation('findByUser', async () => {
      const cacheKey = this.getCacheKey('user', userId);
      const cached = this.getFromCache(cacheKey);
      if (cached && !options) return Array.isArray(cached) ? cached : [cached];

      const supabase = await createClient();
      let query = supabase.from('submissions').select('*').eq('user_id', userId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(options.limit ?? UI_CONFIG.pagination.defaultLimit, UI_CONFIG.pagination.maxLimit);
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user submissions: ${error.message}`);
      }

      if (data && !options) {
        this.setCache(cacheKey, data as unknown as Submission);
      }

      return data || [];
    });
  }

  /**
   * Find submissions by status
   */
  async findByStatus(
    status: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Submission[]>> {
    return this.executeOperation('findByStatus', async () => {
      const supabase = await createClient();
      let query = supabase.from('submissions').select('*').eq('status', status);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(options.limit ?? UI_CONFIG.pagination.defaultLimit, UI_CONFIG.pagination.maxLimit);
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find submissions by status: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find submission by content slug
   */
  async findByContentSlug(
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<Submission | null>> {
    return this.executeOperation('findByContentSlug', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find submission by slug: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Find submission by PR number
   */
  async findByPR(prNumber: number): Promise<RepositoryResult<Submission | null>> {
    return this.executeOperation('findByPR', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('pr_number', prNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find submission by PR: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Update submission status
   */
  async updateStatus(
    id: string,
    status: string,
    metadata?: { rejection_reason?: string; merged_at?: string }
  ): Promise<RepositoryResult<Submission>> {
    return this.executeOperation('updateStatus', async () => {
      const supabase = await createClient();

      const updateData: Partial<Submission> = {
        status,
        updated_at: new Date().toISOString(),
        ...metadata,
      };

      const { data: submission, error } = await supabase
        .from('submissions')
        .update(updateData as SubmissionUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update submission status: ${error.message}`);
      }

      this.clearCache(this.getCacheKey('id', id));
      if (submission?.user_id) {
        this.clearCache(this.getCacheKey('user', submission.user_id));
      }

      if (submission) {
        this.setCache(this.getCacheKey('id', submission.id), submission);
      }

      return submission;
    });
  }

  /**
   * Get pending submissions count for user
   */
  async countPendingByUser(userId: string): Promise<RepositoryResult<number>> {
    return this.executeOperation('countPendingByUser', async () => {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to count pending submissions: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // STATS METHODS
  // =====================================================

  /**
   * Get submission statistics
   * Returns total, pending, and merged this week counts
   */
  async getStats(): Promise<
    RepositoryResult<{
      total: number;
      pending: number;
      mergedThisWeek: number;
    }>
  > {
    return this.executeOperation('getStats', async () => {
      const cacheKey = this.getCacheKey('stats', 'all');
      const cached = this.getFromCache(cacheKey);
      if (cached)
        return cached as unknown as {
          total: number;
          pending: number;
          mergedThisWeek: number;
        };

      const supabase = await createClient();

      // Parallel queries for speed
      const [totalResult, pendingResult, mergedWeekResult] = await Promise.all([
        // Total submissions (all time)
        supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true }),

        // Pending review
        supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Merged this week
        supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'merged')
          .gte('merged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      if (totalResult.error) {
        throw new Error(`Failed to count total submissions: ${totalResult.error.message}`);
      }
      if (pendingResult.error) {
        throw new Error(`Failed to count pending submissions: ${pendingResult.error.message}`);
      }
      if (mergedWeekResult.error) {
        throw new Error(`Failed to count merged submissions: ${mergedWeekResult.error.message}`);
      }

      const stats = {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        mergedThisWeek: mergedWeekResult.count || 0,
      };

      this.setCache(cacheKey, stats as unknown as Submission);
      return stats;
    });
  }

  /**
   * Get recently merged submissions with user details
   */
  async getRecentMerged(limit = 5): Promise<
    RepositoryResult<
      Array<{
        id: string;
        content_name: string;
        content_type: string;
        merged_at: string;
        user: { name: string; slug: string } | null;
      }>
    >
  > {
    return this.executeOperation('getRecentMerged', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('submissions')
        .select(
          `
          id,
          content_name,
          content_type,
          merged_at,
          user_id,
          users!inner (
            name,
            slug
          )
        `
        )
        .eq('status', 'merged')
        .not('merged_at', 'is', null)
        .order('merged_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent merged: ${error.message}`);
      }

      // Define type for Supabase query result with joined users table
      type SubmissionWithMergedAt = {
        id: string;
        content_name: string;
        content_type: string;
        merged_at: string;
        users: { name: string | null; slug: string | null };
      };

      // Transform to match expected format
      const transformed = ((data || []) as SubmissionWithMergedAt[]).map((item) => ({
        id: item.id,
        content_name: item.content_name,
        content_type: item.content_type,
        merged_at: item.merged_at,
        user:
          item.users?.name && item.users?.slug
            ? {
                name: item.users.name,
                slug: item.users.slug,
              }
            : null,
      }));

      return transformed;
    });
  }

  /**
   * Get top contributors with merged submission counts
   */
  async getTopContributors(limit = 5): Promise<
    RepositoryResult<
      Array<{
        rank: number;
        name: string;
        slug: string;
        mergedCount: number;
      }>
    >
  > {
    return this.executeOperation('getTopContributors', async () => {
      const supabase = await createClient();

      // Count merged submissions per user
      const { data, error } = await supabase
        .from('submissions')
        .select('user_id, users!inner(name, slug)')
        .eq('status', 'merged');

      if (error) {
        throw new Error(`Failed to fetch contributors: ${error.message}`);
      }

      // Group by user and count
      const userCounts = new Map<string, { name: string; slug: string; count: number }>();

      // Define type for Supabase query result with joined users table
      type TopContributorSubmission = {
        users: { name: string | null; slug: string | null };
      };

      for (const submission of data || []) {
        const user = (submission as TopContributorSubmission).users;
        if (!(user?.name && user?.slug)) continue;

        const existing = userCounts.get(user.slug) || {
          name: user.name,
          slug: user.slug,
          count: 0,
        };
        existing.count++;
        userCounts.set(user.slug, existing);
      }

      // Sort by count and get top N
      const sorted = Array.from(userCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      // Transform to schema format with ranks
      const contributors = sorted.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        slug: user.slug,
        mergedCount: user.count,
      }));

      return contributors;
    });
  }
}

/**
 * Singleton instance
 */
export const submissionRepository = new SubmissionRepository();
