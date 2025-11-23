import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { pulseJobSearch } from '../pulse.ts';
import { fetchCached } from '../cache/fetch-cached.ts';
import { JobsService, SearchService } from '@heyclaude/data-layer';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

export type JobsFilterResult = Database['public']['Functions']['filter_jobs']['Returns'];

export interface JobsFilterOptions {
  searchQuery?: string;
  category?: string;
  employment?: string;
  experience?: string;
  remote?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Gets jobs with filtering
 */
export async function getFilteredJobs(
  options: JobsFilterOptions
): Promise<JobsFilterResult | null> {
  const { searchQuery, category, employment, experience, remote, limit, offset } = options;
  const hasFilters = Boolean(searchQuery || (category && category !== 'all') || (employment && employment !== 'any') || (experience && experience !== 'any') || (remote !== undefined));

  const filtersLog: Record<string, string | number | boolean | null> = {
    searchQuery: searchQuery ?? null,
    category: category ?? null,
    employment: employment ?? null,
    experience: experience ?? null,
    remote: remote ?? null,
    limit: limit ?? null,
    offset: offset ?? null
  };

  // If no filters, use standard list (cached)
  if (!hasFilters) {
    return fetchCached(
      (client: SupabaseClient<Database>) => new SearchService(client).filterJobs({
        ...(limit !== undefined ? { p_limit: limit } : {}),
        ...(offset !== undefined ? { p_offset: offset } : {})
      }),
      {
        key: `jobs-all-${limit}-${offset}`,
        tags: ['jobs-list'],
        ttlKey: 'cache.jobs.ttl_seconds',
        fallback: null,
        logMeta: filtersLog
      }
    );
  }

  // If filters present, use search (cached with query key)
  try {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      pulseJobSearch(searchQuery, {}, 0).catch((err: unknown) => {
        logger.error('Failed to pulse job search', normalizeError(err));
      });
    }

    return fetchCached(
      (client: SupabaseClient<Database>) => new SearchService(client).filterJobs({
        ...(searchQuery ? { p_search_query: searchQuery } : {}),
        ...(category && category !== 'all' ? { p_category: category as any } : {}),
        ...(employment && employment !== 'any' ? { p_employment_type: employment as any } : {}),
        ...(experience && experience !== 'any' ? { p_experience_level: experience as any } : {}),
        ...(remote !== undefined ? { p_remote_only: remote } : {}),
        ...(limit !== undefined ? { p_limit: limit } : {}),
        ...(offset !== undefined ? { p_offset: offset } : {})
      }),
      {
        key: `jobs-filtered-${JSON.stringify(filtersLog)}`,
        tags: ['jobs-search'],
        ttlKey: 'cache.jobs.ttl_seconds',
        fallback: null,
        logMeta: filtersLog
      }
    );
  } catch (error) {
    const normalized = normalizeError(error);
    logger.error('Failed to fetch filtered jobs', normalized, filtersLog);
    return null;
  }
}

/**
 * Gets a single job by slug
 */
export async function getJobBySlug(slug: string) {
  return fetchCached(
    (client: SupabaseClient<Database>) => new JobsService(client).getJobBySlug({ p_slug: slug }),
    {
      key: `job-${slug}`,
      tags: [`job-${slug}`],
      ttlKey: 'cache.jobs_detail.ttl_seconds',
      fallback: null
    }
  );
}

/**
 * Gets featured jobs
 */
export async function getFeaturedJobs(limit: number = 5) {
  return fetchCached(
    (client: SupabaseClient<Database>) => new JobsService(client).getFeaturedJobs(),
    {
      key: `jobs-featured-${limit}`,
      tags: ['jobs-featured'],
      ttlKey: 'cache.jobs.ttl_seconds',
      fallback: []
    }
  );
}
