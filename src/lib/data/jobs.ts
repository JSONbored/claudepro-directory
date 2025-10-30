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

/**
 * Get featured jobs (premium/featured plans)
 */
export async function getFeaturedJobs(): Promise<Job[]> {
  try {
    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .eq('active', true)
      .in('plan', ['featured', 'premium'])
      .order('order', { ascending: false })
      .order('posted_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch featured jobs', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error(
      'Error in getFeaturedJobs',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get jobs by category
 */
export async function getJobsByCategory(category: string): Promise<Job[]> {
  try {
    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .eq('active', true)
      .eq('category', category)
      .order('posted_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch jobs by category', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error(
      'Error in getJobsByCategory',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get jobs count (for stats)
 */
export async function getJobsCount(): Promise<number> {
  try {
    const supabase = createAnonClient();

    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('active', true);

    if (error) {
      logger.error('Failed to fetch jobs count', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error(
      'Error in getJobsCount',
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}

// Backwards compatibility export
export const jobs: Job[] = [];
// Note: This empty array is for backwards compatibility only
// All code should now use getJobs() instead of importing static jobs array
