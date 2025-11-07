/**
 * Jobs Data Layer - Database-First Architecture
 * Uses get_jobs_list() and get_job_detail() RPCs
 */

import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Database } from '@/src/types/database.types';

export type Job = Database['public']['Tables']['jobs']['Row'];

/**
 * Get all active jobs via RPC
 */
export async function getJobs(): Promise<Job[]> {
  try {
    const supabase = createAnonClient();

    const { data, error } = await supabase.rpc('get_jobs_list');

    if (error) {
      logger.error('Failed to fetch jobs via RPC', error);
      return [];
    }

    return (data || []) as Job[];
  } catch (error) {
    logger.error('Error in getJobs', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Get a job by slug via RPC
 */
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  try {
    const supabase = createAnonClient();

    const { data, error } = await supabase.rpc('get_job_detail', {
      p_slug: slug,
    });

    if (error) {
      logger.error('Failed to fetch job detail via RPC', error, { slug });
      return undefined;
    }

    return data ? (data as Job) : undefined;
  } catch (error) {
    logger.error(
      'Error in getJobBySlug',
      error instanceof Error ? error : new Error(String(error))
    );
    return undefined;
  }
}

/** Get featured jobs via RPC */
export async function getFeaturedJobs(): Promise<Job[]> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_featured_jobs');

    if (error) {
      logger.error('Failed to fetch featured jobs via RPC', error);
      return [];
    }

    return (data || []) as Job[];
  } catch (error) {
    logger.error(
      'Error in getFeaturedJobs',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/** Get jobs by category via RPC */
export async function getJobsByCategory(category: string): Promise<Job[]> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_jobs_by_category', { p_category: category });

    if (error) {
      logger.error('Failed to fetch jobs by category via RPC', error, { category });
      return [];
    }

    return (data || []) as Job[];
  } catch (error) {
    logger.error(
      'Error in getJobsByCategory',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/** Get jobs count via RPC */
export async function getJobsCount(): Promise<number> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_jobs_count');

    if (error) {
      logger.error('Failed to fetch jobs count via RPC', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    logger.error(
      'Error in getJobsCount',
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}
