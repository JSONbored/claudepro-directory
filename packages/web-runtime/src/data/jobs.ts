import 'server-only';

import {
  type FilterJobsArgs,
  type FilterJobsReturns,
} from '@heyclaude/database-types/postgres-types';
import { type jobsModel } from '@heyclaude/database-types/prisma/models';
import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../logger.ts';
import { pulseJobSearch } from '../pulse.ts';
import {
  isValidExperienceLevel,
  isValidJobCategory,
  isValidJobType,
} from '../utils/type-guards.ts';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';
import { getService } from './service-factory.ts';

export type JobsFilterResult = FilterJobsReturns;

export interface JobsFilterOptions {
  category?: string;
  employment?: string;
  experience?: string;
  limit?: number;
  offset?: number;
  remote?: boolean;
  searchQuery?: string;
  sort?: 'newest' | 'oldest' | 'salary';
}

/**
 * Build RPC arguments from filter options
 * Extracted to eliminate duplication
 */
function buildFilterJobsArgs(options: JobsFilterOptions): FilterJobsArgs {
  const { category, employment, experience, limit, offset, remote, searchQuery } = options;
  const rpcArguments: FilterJobsArgs = {};

  if (searchQuery) {
    rpcArguments.p_search_query = searchQuery;
  }
  if (category && category !== 'all' && isValidJobCategory(category)) {
    rpcArguments.p_category = category;
  }
  if (employment && employment !== 'any' && isValidJobType(employment)) {
    rpcArguments.p_employment_type = employment;
  }
  if (experience && experience !== 'any' && isValidExperienceLevel(experience)) {
    rpcArguments.p_experience_level = experience;
  }
  if (remote !== undefined) {
    rpcArguments.p_remote_only = remote;
  }
  if (limit !== undefined) {
    rpcArguments.p_limit = limit;
  }
  if (offset !== undefined) {
    rpcArguments.p_offset = offset;
  }

  return rpcArguments;
}

/**
 * Pulse job search analytics (fire and forget)
 * Extracted to eliminate duplication
 */
function pulseJobSearchAsync(searchQuery: string): void {
  void pulseJobSearch(searchQuery, {}, 0).catch((error: unknown) => {
    const normalized = normalizeError(error, 'Failed to pulse job search');
    logger.error(
      { err: normalized, module: 'data/jobs', operation: 'pulseJobSearch', searchQuery },
      'Failed to pulse job search'
    );
  });
}

/**
 * Get jobs list without filters (cached)
 * Uses 'use cache' to cache jobs lists. This data is public and same for all users.
 */
const getJobsListCached = createCachedDataFunction<
  { limit: number; offset: number },
  JobsFilterResult | null
>({
  serviceKey: 'search',
  methodName: 'filterJobs',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('jobs', undefined, ['jobs-list']),
  module: 'data/jobs',
  operation: 'getJobsListCached',
  transformArgs: (args) => ({
    p_limit: args.limit,
    p_offset: args.offset,
  } as FilterJobsArgs),
  onError: () => null,
  logContext: (args) => ({ limit: args.limit, offset: args.offset }),
});

/**
 * Get filtered jobs with search/filters (cached)
 * Uses 'use cache' to cache filtered jobs. This data is public and same for all users.
 */
const getFilteredJobsCached = createCachedDataFunction<FilterJobsArgs, JobsFilterResult | null>({
  serviceKey: 'search',
  methodName: 'filterJobs',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('jobs', undefined, ['jobs-search']),
  module: 'data/jobs',
  operation: 'getFilteredJobsCached',
  onError: () => null,
  logContext: (args) => ({
    category: args.p_category ?? null,
    employment: args.p_employment_type ?? null,
    experience: args.p_experience_level ?? null,
    limit: args.p_limit ?? null,
    offset: args.p_offset ?? null,
    remote: args.p_remote_only ?? null,
    searchQuery: args.p_search_query ?? null,
  }),
});

/**
 * Retrieve jobs using the provided filter options, optionally bypassing the cache.
 *
 * @param options - Filtering parameters (searchQuery, category, employment, experience, remote, limit, offset, sort)
 * @param noCache - When true, bypass cached results for filtered queries (uncached server-side rendering)
 * @returns Filtered jobs result including hits and pagination metadata, or `null` if retrieval fails
 */
export async function getFilteredJobs(
  options: JobsFilterOptions,
  noCache = false
): Promise<JobsFilterResult | null> {
  const reqLogger = logger.child({
    module: 'data/jobs',
    operation: 'getFilteredJobs',
  });

  const { category, employment, experience, limit, offset, remote, searchQuery } = options;
  const hasFilters = Boolean(
    (searchQuery ?? '') !== '' ||
    (category !== undefined && category !== 'all') ||
    (employment !== undefined && employment !== 'any') ||
    (experience !== undefined && experience !== 'any') ||
    remote !== undefined
  );

  // If no filters, use standard list (cached)
  if (!hasFilters) {
    try {
      return await getJobsListCached({ limit: limit ?? 0, offset: offset ?? 0 });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch jobs list');
      reqLogger.error({ err: normalized }, 'getFilteredJobs: failed to fetch jobs list');
      return null;
    }
  }

  // Pulse analytics for search queries (fire and forget)
  if (searchQuery) {
    pulseJobSearchAsync(searchQuery);
  }

  // If noCache=true, bypass cache (uncached SSR) - call service directly
  if (noCache) {
    try {
      const service = await getService('search');
      const rpcArgs = buildFilterJobsArgs(options);
      return await service.filterJobs(rpcArgs);
    } catch (error) {
      const normalized = normalizeError(error, 'Job filtering failed');
      reqLogger.warn({ err: normalized }, 'Job filtering failed, returning null');
      return null;
    }
  }

  // If filters present, use cached search
  try {
    const rpcArgs = buildFilterJobsArgs(options);
    return await getFilteredJobsCached(rpcArgs);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch filtered jobs');
    reqLogger.error({ err: normalized }, 'Failed to fetch filtered jobs');
    return null;
  }
}

/**
 * Get active job slugs for static generation
 *
 * OPTIMIZATION: Uses Prisma directly instead of RPC for better performance.
 * Only fetches slugs needed for generateStaticParams, avoiding unnecessary data processing.
 */
export const getActiveJobSlugs = createCachedDataFunction<number, string[]>({
  serviceKey: 'jobs',
  methodName: 'getActiveJobSlugs',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: () => generateResourceTags('jobs', undefined, ['jobs-slugs']),
  module: 'data/jobs',
  operation: 'getActiveJobSlugs',
  onError: () => [], // Return empty array on error
  logContext: (limit) => ({ limit }),
});

/**
 * Gets a single job by slug
 * Uses 'use cache' to cache job details. This data is public and same for all users.
 * Job details change periodically, so we use the 'medium' cacheLife profile.
 */
export const getJobBySlug = createCachedDataFunction<string, unknown>({
  serviceKey: 'jobs',
  methodName: 'getJobBySlug',
  cacheMode: 'public',
  cacheLife: 'medium', // 1hr stale, 15min revalidate, 1 day expire - optimized for SEO
  cacheTags: (slug) => generateResourceTags('jobs', slug),
  module: 'data/jobs',
  operation: 'getJobBySlug',
  transformArgs: (slug) => ({ p_slug: slug }),
});

/**
 * Retrieve a list of featured jobs for display.
 * Uses 'use cache' to cache featured jobs. This data is public and same for all users.
 * Featured jobs change periodically, so we use the 'long' cacheLife profile.
 */
export async function getFeaturedJobs(limit = 5): Promise<jobsModel[]> {
  const cachedFn = createCachedDataFunction<void, jobsModel[]>({
    serviceKey: 'jobs',
    methodName: 'getFeaturedJobs',
    cacheMode: 'public',
    cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
    cacheTags: () => generateResourceTags('jobs', undefined, ['jobs-featured']),
    module: 'data/jobs',
    operation: 'getFeaturedJobs',
    transformResult: (result) => {
      const jobs = result as jobsModel[];
      return jobs.slice(0, limit);
    },
    onError: () => [], // Return empty array on error
    logContext: () => ({ limit }),
  });

  return (await cachedFn(undefined as void)) ?? [];
}
