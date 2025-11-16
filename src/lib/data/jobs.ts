/**
 * Jobs Data Layer - Database-First Architecture
 * Uses get_jobs_list() and get_job_detail() RPCs with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import type {
  GetFilterJobsReturn,
  GetGetJobDetailReturn,
  GetGetJobsListReturn,
  Tables,
} from '@/src/types/database-overrides';

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

// JobsFilterResult matches GetFilterJobsReturn from database-overrides.ts
export type JobsFilterResult = GetFilterJobsReturn;

/**
 * Get all active jobs via edge-cached RPC
 */
export async function getJobs(): Promise<Job[]> {
  const data = await fetchCachedRpc<'get_jobs_list', GetGetJobsListReturn>(
    {},
    {
      rpcName: 'get_jobs_list',
      tags: ['jobs'],
      ttlKey: 'cache.jobs.ttl_seconds',
      keySuffix: 'all',
      fallback: [],
    }
  );
  // Map GetGetJobsListReturn to Job (Tables<'jobs'>)
  // GetGetJobsListReturn is a simplified structure, so we need to map it
  return data.map((item) => ({
    ...item,
    // Add missing fields with defaults
    active: item.active ?? true,
    admin_notes: null,
    benefits: item.benefits ?? null,
    click_count: null,
    company_id: null,
    company_logo: null,
    contact_email: item.contact_email ?? null,
    expires_at: item.expires_at ?? new Date().toISOString(),
    is_placeholder: false,
    workplace: item.remote ? 'Remote' : 'On-site',
  })) as Job[];
}

/**
 * Get a job by slug via edge-cached RPC
 */
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const data = await fetchCachedRpc<'get_job_detail', GetGetJobDetailReturn>(
    { p_slug: slug },
    {
      rpcName: 'get_job_detail',
      tags: ['jobs', `jobs-${slug}`],
      ttlKey: 'cache.jobs_detail.ttl_seconds',
      keySuffix: slug,
      fallback: null,
      logMeta: { slug },
    }
  );

  if (!data) return undefined;

  // Map GetGetJobDetailReturn to Job (Tables<'jobs'>)
  return {
    ...data,
    // Add missing fields with defaults
    active: data.active ?? true,
    admin_notes: null,
    benefits: data.benefits ?? null,
    click_count: null,
    company_id: null,
    company_logo: null,
    expires_at: data.expires_at ?? new Date().toISOString(),
    is_placeholder: false,
    workplace: data.remote ? 'Remote' : 'On-site',
  } as Job;
}

/** Get featured jobs via edge-cached RPC */
export async function getFeaturedJobs(): Promise<Job[]> {
  return fetchCachedRpc<'get_featured_jobs', Job[]>(
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
  return fetchCachedRpc<'get_jobs_by_category', Job[]>(
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
  const data = await fetchCachedRpc<'get_jobs_count', number | null>(
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
): Promise<GetFilterJobsReturn | null> {
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

  const result = await fetchCachedRpc<'filter_jobs', GetFilterJobsReturn | null>(rpcParams, {
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

  // Pulse search events (fire and forget) - only if search query provided
  if (searchQuery && result) {
    const { pulseJobSearch } = await import('@/src/lib/utils/pulse');
    pulseJobSearch(
      searchQuery,
      {
        ...(category ? { category } : {}),
        ...(employment ? { employment } : {}),
        ...(experience ? { experience } : {}),
        ...(remote !== undefined ? { remote } : {}),
      },
      result.total_count
    ).catch((error) => {
      // Don't block - just log warning
      logger.warn('Failed to pulse jobs search', {
        error: error instanceof Error ? error.message : String(error),
        query: searchQuery.substring(0, 50),
      });
    });
  }

  return result;
}
