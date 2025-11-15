/**
 * Jobs Data Layer - Database-First Architecture
 * Uses get_jobs_list() and get_job_detail() RPCs with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

export type Job = Database['public']['Tables']['jobs']['Row'];

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

  return fetchCachedRpc<JobsFilterResult | null>(rpcParams, {
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
}
