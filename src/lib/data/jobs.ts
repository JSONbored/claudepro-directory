/**
 * Jobs Data Layer - Database-First Architecture
 * Uses get_jobs_list() and get_job_detail() RPCs with edge-layer caching
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import type { Database } from '@/src/types/database.types';

export type Job = Database['public']['Tables']['jobs']['Row'];

/**
 * Get all active jobs via edge-cached RPC
 */
export async function getJobs(): Promise<Job[]> {
  try {
    const data = await cachedRPCWithDedupe<Job[]>(
      'get_jobs_list',
      {},
      {
        tags: ['jobs'],
        ttlConfigKey: 'cache.jobs.ttl_seconds',
        keySuffix: 'all',
      }
    );

    return (data || []) as Job[];
  } catch (error) {
    logger.error('Error in getJobs', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Get a job by slug via edge-cached RPC
 */
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  try {
    const data = await cachedRPCWithDedupe<Job>(
      'get_job_detail',
      { p_slug: slug },
      {
        tags: ['jobs', `jobs-${slug}`],
        ttlConfigKey: 'cache.jobs_detail.ttl_seconds',
        keySuffix: slug,
      }
    );

    return data ? (data as Job) : undefined;
  } catch (error) {
    logger.error(
      'Error in getJobBySlug',
      error instanceof Error ? error : new Error(String(error)),
      { slug }
    );
    return undefined;
  }
}

/** Get featured jobs via edge-cached RPC */
export async function getFeaturedJobs(): Promise<Job[]> {
  try {
    const data = await cachedRPCWithDedupe<Job[]>(
      'get_featured_jobs',
      {},
      {
        tags: ['jobs'],
        ttlConfigKey: 'cache.jobs.ttl_seconds',
        keySuffix: 'featured',
      }
    );

    return (data || []) as Job[];
  } catch (error) {
    logger.error(
      'Error in getFeaturedJobs',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/** Get jobs by category via edge-cached RPC */
export async function getJobsByCategory(category: string): Promise<Job[]> {
  try {
    const data = await cachedRPCWithDedupe<Job[]>(
      'get_jobs_by_category',
      { p_category: category },
      {
        tags: ['jobs', `jobs-category-${category}`],
        ttlConfigKey: 'cache.jobs.ttl_seconds',
        keySuffix: `category-${category}`,
      }
    );

    return (data || []) as Job[];
  } catch (error) {
    logger.error(
      'Error in getJobsByCategory',
      error instanceof Error ? error : new Error(String(error)),
      { category }
    );
    return [];
  }
}

/** Get jobs count via edge-cached RPC */
export async function getJobsCount(): Promise<number> {
  try {
    const data = await cachedRPCWithDedupe<number>(
      'get_jobs_count',
      {},
      {
        tags: ['jobs'],
        ttlConfigKey: 'cache.jobs.ttl_seconds',
        keySuffix: 'count',
      }
    );

    return data || 0;
  } catch (error) {
    logger.error(
      'Error in getJobsCount',
      error instanceof Error ? error : new Error(String(error))
    );
    return 0;
  }
}
