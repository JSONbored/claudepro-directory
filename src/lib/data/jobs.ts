/**
 * Jobs Data Layer - Database-First Architecture
 * Uses get_jobs_list() and get_job_detail() RPCs with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database-overrides';

export type Job = Tables<'jobs'>;

export interface JobsFilterOptions {
  searchQuery?: string;
  category?: string;
  employment?: string;
  experience?: string;
  remote?: boolean;
  limit: number;
  offset: number;
}

export interface JobsFilterResult {
  jobs: Job[];
  total_count: number;
}

/**
 * Get all active jobs via edge-cached RPC
 */
export async function getJobs(): Promise<Job[]> {
  return fetchCachedRpc<Job[]>(
    {},
    {
      rpcName: 'get_jobs_list',
      tags: ['jobs'],
      ttlKey: 'cache.jobs.ttl_seconds',
      keySuffix: 'all',
      fallback: [],
    }
  );
}

/**
 * Get a job by slug via edge-cached RPC
 */
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const data = await fetchCachedRpc<Job | undefined>(
    { p_slug: slug },
    {
      rpcName: 'get_job_detail',
      tags: ['jobs', `jobs-${slug}`],
      ttlKey: 'cache.jobs_detail.ttl_seconds',
      keySuffix: slug,
      fallback: undefined,
      logMeta: { slug },
    }
  );

  return data ?? undefined;
}

/** Get featured jobs via edge-cached RPC */
export async function getFeaturedJobs(): Promise<Job[]> {
  return fetchCachedRpc<Job[]>(
    {},
    {
      rpcName: 'get_featured_jobs',
      tags: ['jobs'],
      ttlKey: 'cache.jobs.ttl_seconds',
      keySuffix: 'featured',
      fallback: [],
    }
  );
}

/** Get jobs by category via edge-cached RPC */
export async function getJobsByCategory(category: string): Promise<Job[]> {
  return fetchCachedRpc<Job[]>(
    { p_category: category },
    {
      rpcName: 'get_jobs_by_category',
      tags: ['jobs', `jobs-category-${category}`],
      ttlKey: 'cache.jobs.ttl_seconds',
      keySuffix: `category-${category}`,
      fallback: [],
      logMeta: { category },
    }
  );
}

/** Get jobs count via edge-cached RPC */
export async function getJobsCount(): Promise<number> {
  const data = await fetchCachedRpc<number | null>(
    {},
    {
      rpcName: 'get_jobs_count',
      tags: ['jobs'],
      ttlKey: 'cache.jobs.ttl_seconds',
      keySuffix: 'count',
      fallback: null,
    }
  );
  return data ?? 0;
}

/** Filter jobs via filter_jobs RPC */
export async function getFilteredJobs(
  options: JobsFilterOptions
): Promise<JobsFilterResult | null> {
  const { searchQuery, category, employment, experience, remote, limit, offset } = options;

  const rpcParams = {
    ...(searchQuery ? { p_search_query: searchQuery } : {}),
    ...(category && category !== 'all' ? { p_category: category } : {}),
    ...(employment && employment !== 'any' ? { p_employment_type: employment } : {}),
    ...(remote ? { p_remote_only: remote } : {}),
    ...(experience && experience !== 'any' ? { p_experience_level: experience } : {}),
    p_limit: limit,
    p_offset: offset,
  };

  const result = await fetchCachedRpc<JobsFilterResult | null>(rpcParams, {
    rpcName: 'filter_jobs',
    tags: ['jobs', ...(category && category !== 'all' ? [`jobs-${category}`] : [])],
    ttlKey: 'cache.jobs.ttl_seconds',
    keySuffix: [
      searchQuery || 'none',
      category || 'all',
      employment || 'any',
      experience || 'any',
      remote ? 'remote' : 'onsite',
      limit,
      offset,
    ].join('|'),
    fallback: null,
    logMeta: {
      hasSearch: Boolean(searchQuery),
      category: category || 'all',
      employment: employment || 'any',
      experience: experience || 'any',
      remote: Boolean(remote),
      limit,
      offset,
    },
  });

  // Track search analytics (fire and forget) - only if search query provided
  if (searchQuery && result) {
    trackJobsSearchAnalytics(
      searchQuery,
      {
        ...(category ? { category } : {}),
        ...(employment ? { employment } : {}),
        ...(experience ? { experience } : {}),
        ...(remote !== undefined ? { remote } : {}),
      },
      result.total_count
    ).catch((error) => {
      // Don't block on analytics - just log warning
      logger.warn('Failed to track jobs search analytics', {
        error: error instanceof Error ? error.message : String(error),
        query: searchQuery.substring(0, 50),
      });
    });
  }

  return result;
}

/**
 * Track jobs search analytics - Queue-Based
 * Enqueues to user_interactions queue for batched processing (98% egress reduction)
 * Fire and forget - non-blocking
 */
async function trackJobsSearchAnalytics(
  query: string,
  filters: {
    category?: string;
    employment?: string;
    experience?: string;
    remote?: boolean;
  },
  resultCount: number
): Promise<void> {
  if (!query.trim()) return;

  try {
    const supabase = await createClient();

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build filters object for analytics
    const filtersJson = {
      ...(filters.category && filters.category !== 'all' ? { category: filters.category } : {}),
      ...(filters.employment && filters.employment !== 'any'
        ? { employment: filters.employment }
        : {}),
      ...(filters.experience && filters.experience !== 'any'
        ? { experience: filters.experience }
        : {}),
      ...(filters.remote !== undefined ? { remote: filters.remote } : {}),
      entity: 'job', // Mark as job search
    };

    // Enqueue to queue instead of direct insert
    const { enqueuePulseEvent } = await import('@/src/lib/utils/pulse');
    await enqueuePulseEvent({
      user_id: user?.id ?? null,
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: null,
      metadata: {
        query: query.trim(),
        filters: Object.keys(filtersJson).length > 0 ? filtersJson : null,
        result_count: resultCount,
      },
    });
  } catch (error) {
    // Silently fail - analytics should never block search
    logger.warn('Jobs search analytics tracking error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
