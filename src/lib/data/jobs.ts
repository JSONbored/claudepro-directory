/**
 * Jobs Data Layer - Database-First Architecture
 * Uses get_jobs_list() and get_job_detail() RPCs with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { searchUnified } from '@/src/lib/edge/search-client';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

export interface JobsFilterOptions {
  searchQuery?: string;
  category?: string;
  employment?: string;
  experience?: string;
  remote?: boolean;
  limit: number;
  offset: number;
}

// JobsFilterResult uses generated type from database.types.ts
export type JobsFilterResult = Database['public']['Functions']['filter_jobs']['Returns'] | null;

/**
 * Get all active jobs via edge-cached RPC
 */
export async function getJobs(): Promise<Database['public']['Tables']['jobs']['Row'][]> {
  const data = await fetchCachedRpc<
    'get_jobs_list',
    Database['public']['Functions']['get_jobs_list']['Returns']
  >(undefined as never, {
    rpcName: 'get_jobs_list',
    tags: ['jobs'],
    ttlKey: 'cache.jobs.ttl_seconds',
    keySuffix: 'all',
    fallback: [],
  });
  // Map composite type to jobs table row
  // The composite type is a simplified structure, so we need to map it
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
  })) as Database['public']['Tables']['jobs']['Row'][];
}

/**
 * Get a job by slug via edge-cached RPC
 */
export async function getJobBySlug(
  slug: string
): Promise<Database['public']['Tables']['jobs']['Row'] | undefined> {
  const data = await fetchCachedRpc<
    'get_job_detail',
    Database['public']['Functions']['get_job_detail']['Returns'] | null
  >(
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

  // Map job_detail_result composite type to jobs table row
  // The composite type includes all fields from the RPC, but the jobs table row has additional fields
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
  } as Database['public']['Tables']['jobs']['Row'];
}

/** Get featured jobs via edge-cached RPC */
export async function getFeaturedJobs(): Promise<Database['public']['Tables']['jobs']['Row'][]> {
  return fetchCachedRpc<'get_featured_jobs', Database['public']['Tables']['jobs']['Row'][]>(
    undefined as never,
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
export async function getJobsByCategory(
  category: string
): Promise<Database['public']['Tables']['jobs']['Row'][]> {
  return fetchCachedRpc<'get_jobs_by_category', Database['public']['Tables']['jobs']['Row'][]>(
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
  const data = await fetchCachedRpc<'get_jobs_count', number | null>(undefined as never, {
    rpcName: 'get_jobs_count',
    tags: ['jobs'],
    ttlKey: 'cache.jobs.ttl_seconds',
    keySuffix: 'count',
    fallback: null,
  });
  return data ?? 0;
}

// Removed unused normalizeJobForCard function - JobCardJobType now accepts flexible types

/** Filter jobs via unified-search edge function (with highlighting and analytics) */
export async function getFilteredJobs(
  options: JobsFilterOptions
): Promise<Database['public']['Functions']['filter_jobs']['Returns'] | null> {
  const { searchQuery, category, employment, experience, remote, limit, offset } = options;

  try {
    // Check if we have any filters (if no filters and no query, use direct RPC for better performance)
    const hasFilters =
      (category && category !== 'all') ||
      (employment && employment !== 'any') ||
      (experience && experience !== 'any') ||
      remote !== undefined ||
      searchQuery;

    // If no filters and no query, use direct RPC (faster for simple listing)
    if (!hasFilters) {
      const result = await fetchCachedRpc<
        'filter_jobs',
        Database['public']['Functions']['filter_jobs']['Returns'] | null
      >(
        {
          p_limit: limit,
          p_offset: offset,
        },
        {
          rpcName: 'filter_jobs',
          tags: ['jobs'],
          ttlKey: 'cache.jobs.ttl_seconds',
          keySuffix: `all-${limit}-${offset}`,
          fallback: null,
          logMeta: {
            hasSearch: false,
            limit,
            offset,
          },
        }
      );
      return result;
    }

    // Use edge function for filtered searches (provides highlighting, analytics, caching)
    const response = await searchUnified<Database['public']['Tables']['jobs']['Row']>({
      query: searchQuery || '',
      filters: {
        ...(category && category !== 'all' ? { job_category: category } : {}),
        ...(employment && employment !== 'any' ? { job_employment: employment } : {}),
        ...(experience && experience !== 'any' ? { job_experience: experience } : {}),
        ...(remote !== undefined ? { job_remote: remote } : {}),
        limit,
        offset,
      },
    });

    // Transform edge function response to filter_jobs_result format
    // Edge function returns results with highlighting, we need to extract jobs array
    const jobs = (response.results as Database['public']['Tables']['jobs']['Row'][]) || [];

    return {
      jobs,
      total_count: response.pagination.total ?? 0,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to filter jobs via edge function');
    logger.error('getFilteredJobs: edge function call failed', normalized, {
      hasSearch: Boolean(searchQuery),
      category: category || 'all',
      employment: employment || 'any',
      experience: experience || 'any',
      remote: Boolean(remote),
      limit,
      offset,
    });

    // Fallback to direct RPC if edge function fails
    // Convert string values to ENUMs or NULL (NULL means 'all'/'any')
    const rpcParams: Database['public']['Functions']['filter_jobs']['Args'] = {
      ...(searchQuery ? { p_search_query: searchQuery } : {}),
      ...(category && category !== 'all'
        ? {
            p_category: category as Database['public']['Enums']['job_category'],
          }
        : {}),
      ...(employment && employment !== 'any'
        ? {
            p_employment_type: employment as Database['public']['Enums']['job_type'],
          }
        : {}),
      ...(remote !== undefined ? { p_remote_only: remote } : {}),
      ...(experience && experience !== 'any'
        ? {
            p_experience_level: experience as Database['public']['Enums']['experience_level'],
          }
        : {}),
      p_limit: limit,
      p_offset: offset,
    };

    const result = await fetchCachedRpc<
      'filter_jobs',
      Database['public']['Functions']['filter_jobs']['Returns'] | null
    >(rpcParams, {
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
    // Note: Edge function already tracks analytics, but we keep this for backward compatibility
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
        result.total_count ?? 0
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
}
