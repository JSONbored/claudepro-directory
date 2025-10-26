/**
 * Job Repository
 *
 * Provides data access layer for job listings with caching and performance monitoring.
 * Handles job CRUD operations, status management, and ownership verification.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Support for soft delete via status field
 *
 * @module repositories/job
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

/** Job entity type from database */
export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * JobRepository
 * Handles all job listing data access
 */
export class JobRepository extends BaseRepository<Job, string> {
  constructor() {
    super('JobRepository');
  }

  /**
   * Find job by ID
   */
  async findById(id: string): Promise<RepositoryResult<Job | null>> {
    return this.executeOperation('findById', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find job: ${error.message}`);
      }

      if (data) {
        if (data.slug) {
        }
      }

      return data;
    });
  }

  /**
   * Find all jobs with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Job[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('jobs').select('*');

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
        throw new Error(`Failed to find jobs: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one job matching criteria
   */
  async findOne(criteria: Partial<Job>): Promise<RepositoryResult<Job | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('jobs').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Job, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find job: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new job
   */
  async create(
    data: Omit<
      Job,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'view_count'
      | 'click_count'
      | 'featured'
      | 'order'
      | 'search_vector'
    >
  ): Promise<RepositoryResult<Job>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const now = new Date().toISOString();

      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          ...data,
          created_at: now,
          updated_at: now,
        } as JobInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create job: ${error.message}`);
      }

      if (job) {
        if (job.slug) {
        }
      }

      return job;
    });
  }

  /**
   * Update existing job
   */
  async update(id: string, data: Partial<Job>): Promise<RepositoryResult<Job>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();

      const { data: job, error } = await supabase
        .from('jobs')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as JobUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update job: ${error.message}`);
      }

      if (job?.slug) {
      }
      if (job?.user_id) {
      }

      if (job) {
        if (job.slug) {
        }
      }

      return job;
    });
  }

  /**
   * Delete job (soft delete by setting status to 'deleted')
   */
  async delete(id: string, soft = true): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const jobResult = await this.findById(id);
      const job = jobResult.success ? jobResult.data : null;

      const supabase = await createClient();

      if (soft) {
        const { error } = await supabase
          .from('jobs')
          .update({ status: 'deleted' } as JobUpdate)
          .eq('id', id);

        if (error) {
          throw new Error(`Failed to soft delete job: ${error.message}`);
        }
      } else {
        const { error } = await supabase.from('jobs').delete().eq('id', id);

        if (error) {
          throw new Error(`Failed to delete job: ${error.message}`);
        }
      }

      if (job?.slug) {
      }
      if (job?.user_id) {
      }

      return true;
    });
  }

  /**
   * Check if job exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count jobs matching criteria
   */
  async count(criteria?: Partial<Job>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('jobs').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Job, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count jobs: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM JOB METHODS
  // =====================================================

  /**
   * Find job by slug
   */
  async findBySlug(slug: string): Promise<RepositoryResult<Job | null>> {
    return this.executeOperation('findBySlug', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.from('jobs').select('*').eq('slug', slug).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find job by slug: ${error.message}`);
      }

      if (data) {
      }

      return data;
    });
  }

  /**
   * Find jobs by user ID
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Job[]>> {
    return this.executeOperation('findByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('jobs').select('*').eq('user_id', userId);

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
        throw new Error(`Failed to find user jobs: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find active (non-deleted) jobs by user
   */
  async findActiveByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Job[]>> {
    return this.executeOperation('findActiveByUser', async () => {
      const supabase = await createClient();
      let query = supabase.from('jobs').select('*').eq('user_id', userId).neq('status', 'deleted');

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
        throw new Error(`Failed to find active user jobs: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Update job with ownership verification
   */
  async updateByOwner(
    id: string,
    userId: string,
    data: Partial<Job>
  ): Promise<RepositoryResult<Job>> {
    return this.executeOperation('updateByOwner', async () => {
      const supabase = await createClient();

      const { data: job, error } = await supabase
        .from('jobs')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as JobUpdate)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update job: ${error.message}`);
      }

      if (job?.slug) {
      }

      if (job) {
        if (job.slug) {
        }
      }

      return job;
    });
  }

  /**
   * Get featured jobs
   */
  async getFeatured(limit = 10): Promise<RepositoryResult<Job[]>> {
    return this.executeOperation('getFeatured', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('featured', true)
        .eq('active', true)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get featured jobs: ${error.message}`);
      }

      return data || [];
    });
  }
}

/**
 * Singleton instance
 */
export const jobRepository = new JobRepository();
