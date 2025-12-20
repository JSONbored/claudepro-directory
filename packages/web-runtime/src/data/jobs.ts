import 'server-only';

import {
  type FilterJobsArgs,
  type FilterJobsReturns,
} from '@heyclaude/database-types/postgres-types';
import type { Prisma } from '@prisma/client';

type jobsModel = Prisma.jobsGetPayload<{}>;
import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../logger.ts';
import { pulseJobSearch } from '../pulse.ts';
import {
  isValidExperienceLevel,
  isValidJobCategory,
  isValidJobType,
} from '../utils/type-guards.ts';

import { QUERY_LIMITS } from './config/constants.ts';
import { createDataFunction } from './cached-data-factory.ts';
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

/***
 *
 * Build RPC arguments from filter options
 * Extracted to eliminate duplication
 * @param {JobsFilterOptions} options
 * @returns {FilterJobsArgs} Return value description
 */
export function buildFilterJobsArgs(options: JobsFilterOptions): FilterJobsArgs {
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

/***
 *
 * Pulse job search analytics (fire and forget)
 * Extracted to eliminate duplication
 * @param {string} searchQuery
 * @returns {void} Return value description
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
const getJobsListCached = createDataFunction<
  { limit: number; offset: number },
  JobsFilterResult | null
>({
  logContext: (args) => ({ limit: args.limit, offset: args.offset }),
  methodName: 'filterJobs',
  module: 'data/jobs',
  onError: () => null,
  operation: 'getJobsListCached',
  serviceKey: 'search',
  transformArgs: (args) =>
    ({
      p_limit: args.limit,
      p_offset: args.offset,
    }) as FilterJobsArgs,
});

/**
 * Get filtered jobs with search/filters (cached)
 * Uses 'use cache' to cache filtered jobs. This data is public and same for all users.
 */
const getFilteredJobsCached = createDataFunction<FilterJobsArgs, JobsFilterResult | null>({
  logContext: (args) => ({
    category: args.p_category ?? null,
    employment: args.p_employment_type ?? null,
    experience: args.p_experience_level ?? null,
    limit: args.p_limit ?? null,
    offset: args.p_offset ?? null,
    remote: args.p_remote_only ?? null,
    searchQuery: args.p_search_query ?? null,
  }),
  methodName: 'filterJobs',
  module: 'data/jobs',
  onError: () => null,
  operation: 'getFilteredJobsCached',
  serviceKey: 'search',
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
      // BUG FIX: Use default limit instead of 0 when limit is undefined
      // limit ?? 0 would return 0 results, which is not intended
      return await getJobsListCached({
        limit: limit ?? QUERY_LIMITS.pagination.default,
        offset: offset ?? 0,
      });
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
export const getActiveJobSlugs = createDataFunction<number, string[]>({
  logContext: (limit) => ({ limit }),
  methodName: 'getActiveJobSlugs',
  module: 'data/jobs',
  onError: () => [], // Return empty array on error
  operation: 'getActiveJobSlugs',
  serviceKey: 'jobs',
});

/**
 * Gets a single job by slug
 * Uses 'use cache' to cache job details. This data is public and same for all users.
 * Job details change periodically, so we use the 'medium' cacheLife profile.
 */
export const getJobBySlug = createDataFunction<string, unknown>({
  methodName: 'getJobBySlug',
  module: 'data/jobs',
  operation: 'getJobBySlug',
  serviceKey: 'jobs',
  transformArgs: (slug) => ({ p_slug: slug }),
});

/**
 * Retrieve a list of featured jobs for display.
 * Uses 'use cache' to cache featured jobs. This data is public and same for all users.
 * Featured jobs change periodically, so we use the 'long' cacheLife profile.
 * @param limit
 */
export async function getFeaturedJobs(limit = 5): Promise<jobsModel[]> {
  const cachedFn = createDataFunction<void, jobsModel[]>({
    logContext: () => ({ limit }),
    methodName: 'getFeaturedJobs',
    module: 'data/jobs',
    onError: () => [], // Return empty array on error
    operation: 'getFeaturedJobs',
    serviceKey: 'jobs',
    transformResult: (result) => {
      const jobs = result as jobsModel[];
      return jobs.slice(0, limit);
    },
  });

  return (await cachedFn(undefined as void)) ?? [];
}
