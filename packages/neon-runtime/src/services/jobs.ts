/**
 * JobsService - Prisma-based service for job listings
 * 
 * This service replaces the Supabase-based JobsService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/jobs.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';
import type { JobCategory } from '../types';

/**
 * Arguments for get_job_detail RPC
 * 
 * @property p_slug - Job slug
 */
export interface GetJobBySlugArgs {
  p_slug: string;
}

/**
 * Arguments for get_jobs_by_category RPC
 * 
 * @property p_category - Job category enum value
 */
export interface GetJobsByCategoryArgs {
  p_category: JobCategory;
}

/**
 * Prisma-based JobsService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class JobsService {
  /**
   * Calls the database RPC: get_jobs_list
   * 
   * @returns Array of job listings
   */
  async getJobs() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_jobs_list()');
        return rows;
      });
    } catch (error) {
      console.error('[JobsService] getJobs error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_job_detail
   * 
   * @param args - RPC function arguments
   * @param args.p_slug - Job slug
   * @returns Job detail or null if not found
   */
  async getJobBySlug(args: GetJobBySlugArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_job_detail($1)', [args.p_slug]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[JobsService] getJobBySlug error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_featured_jobs
   * 
   * @returns Array of featured jobs
   */
  async getFeaturedJobs() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_featured_jobs()');
        return rows;
      });
    } catch (error) {
      console.error('[JobsService] getFeaturedJobs error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_jobs_by_category
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Job category enum value
   * @returns Array of jobs in the specified category
   */
  async getJobsByCategory(args: GetJobsByCategoryArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_jobs_by_category($1)', [
          args.p_category,
        ]);
        return rows;
      });
    } catch (error) {
      console.error('[JobsService] getJobsByCategory error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_jobs_count
   * 
   * @returns Total count of jobs
   */
  async getJobsCount() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_jobs_count()');
        return rows[0]?.get_jobs_count ?? 0;
      });
    } catch (error) {
      console.error('[JobsService] getJobsCount error:', error);
      throw error;
    }
  }
}
