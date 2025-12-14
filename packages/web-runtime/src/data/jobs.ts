import 'server-only';

import { JobsService, SearchService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../logger.ts';
import { pulseJobSearch } from '../pulse.ts';
import {
  isValidExperienceLevel,
  isValidJobCategory,
  isValidJobType,
} from '../utils/type-guards.ts';

export type JobsFilterResult = Database['public']['Functions']['filter_jobs']['Returns'];

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
 * Fetches jobs matching the provided filter options directly from the data source without using cache.
 *
 * @param {JobsFilterOptions} options - Filtering options (searchQuery, category, employment, experience, remote, limit, offset, sort)
 * @returns The filtered jobs result, or `null` if an error occurs
 */
async function getFilteredJobsDirect(options: JobsFilterOptions): Promise<JobsFilterResult | null> {
  const reqLogger = logger.child({
    module: 'data/jobs',
    operation: 'getFilteredJobsDirect',
  });

  const { category, employment, experience, limit, offset, remote, searchQuery, sort } = options;

  const filtersLog: Record<string, boolean | null | number | string> = {
    category: category ?? null,
    employment: employment ?? null,
    experience: experience ?? null,
    limit: limit ?? null,
    offset: offset ?? null,
    remote: remote ?? null,
    searchQuery: searchQuery ?? null,
    sort: sort ?? null,
  };

  try {
    // Build RPC args with proper type narrowing using type guards
    const rpcArguments: Database['public']['Functions']['filter_jobs']['Args'] = {};

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

    const service = new SearchService();
    return await service.filterJobs(rpcArguments);
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.warn(
      { err: errorForLogging, ...filtersLog, fallbackStrategy: 'null' },
      'Job filtering failed, returning null'
    );
    return null;
  }
}

/****
 *
 * Get jobs list without filters (cached)
 * Uses 'use cache' to cache jobs lists. This data is public and same for all users.
 * Jobs lists change periodically, so we use the 'half' cacheLife profile.
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<unknown>} Return value description
 */
async function getJobsListCached(limit: number, offset: number): Promise<JobsFilterResult | null> {
  'use cache';

  // Configure cache - use 'half' profile for jobs lists (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('jobs-list');

  const reqLogger = logger.child({
    module: 'data/jobs',
    operation: 'getJobsListCached',
  });

  try {
    const rpcArgs: Database['public']['Functions']['filter_jobs']['Args'] = {};
    if (limit !== undefined) {
      rpcArgs.p_limit = limit;
    }
    if (offset !== undefined) {
      rpcArgs.p_offset = offset;
    }

    const service = new SearchService();
    const result = await service.filterJobs(rpcArgs);

    reqLogger.info(
      { hasResult: Boolean(result), limit, offset },
      'getJobsListCached: fetched successfully'
    );

    return result;
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, limit, offset }, 'getJobsListCached: failed');
    return null;
  }
}

/**********
*
 * Get filtered jobs with search/filters (cached)
 * Uses 'use cache' to cache filtered jobs. This data is public and same for all users.
 * Filtered jobs change periodically, so we use the 'half' cacheLife profile.
 * @param {Database['public']['Functions']['filter_jobs']['Args']} rpcArguments
 * @param {string} searchQuery
 * @param {string} category
 * @param {string} employment
 * @param {string} experience
 * @param {boolean} remote
 * @param {number} limit
 * @param {number} offset
 * @param sort
 * @returns {Promise<unknown>} Return value description
 */
async function getFilteredJobsCached(
  rpcArguments: Database['public']['Functions']['filter_jobs']['Args'],
  searchQuery: string,
  category: string,
  employment: string,
  experience: string,
  remote: boolean,
  limit: number,
  offset: number,
  sort: string
): Promise<JobsFilterResult | null> {
  'use cache';

  // Configure cache - use 'half' profile for filtered jobs (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('jobs-search');

  const reqLogger = logger.child({
    module: 'data/jobs',
    operation: 'getFilteredJobsCached',
  });

  try {
    const service = new SearchService();
    const result = await service.filterJobs(rpcArguments);

    reqLogger.info(
      {
        category,
        employment,
        experience,
        hasResult: Boolean(result),
        limit,
        offset,
        remote,
        searchQuery,
        sort,
      },
      'getFilteredJobsCached: fetched successfully'
    );

    return result;
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      {
        category,
        employment,
        err: errorForLogging,
        experience,
        limit,
        offset,
        remote,
        searchQuery,
        sort,
      },
      'getFilteredJobsCached: failed'
    );
    return null;
  }
}

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

  const { category, employment, experience, limit, offset, remote, searchQuery, sort } = options;
  const hasFilters = Boolean(
    (searchQuery ?? '') !== '' ||
    (category !== undefined && category !== 'all') ||
    (employment !== undefined && employment !== 'any') ||
    (experience !== undefined && experience !== 'any') ||
    remote !== undefined
  );

  const filtersLog: Record<string, boolean | null | number | string> = {
    category: category ?? null,
    employment: employment ?? null,
    experience: experience ?? null,
    limit: limit ?? null,
    offset: offset ?? null,
    remote: remote ?? null,
    searchQuery: searchQuery ?? null,
    sort: sort ?? null,
  };

  // If no filters, use standard list (cached)
  if (!hasFilters) {
    try {
      return await getJobsListCached(limit ?? 0, offset ?? 0);
    } catch (error) {
      const errorForLogging: Error | string = error instanceof Error ? error : String(error);
      reqLogger.error(
        { err: errorForLogging, ...filtersLog },
        'getFilteredJobs: failed to fetch jobs list'
      );
      return null;
    }
  }

  // If filters present and noCache=true, bypass cache (uncached SSR)
  if (noCache) {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      void pulseJobSearch(searchQuery, {}, 0).catch((error: unknown) => {
        const normalized = normalizeError(error, 'Failed to pulse job search');
        logger.error(
          { err: normalized, module: 'data/jobs', operation: 'pulseJobSearch', searchQuery },
          'Failed to pulse job search'
        );
      });
    }
    return getFilteredJobsDirect(options);
  }

  // If filters present, use search (cached with query key)
  try {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      void pulseJobSearch(searchQuery, {}, 0).catch((error: unknown) => {
        const normalized = normalizeError(error, 'Failed to pulse job search');
        logger.error(
          { err: normalized, module: 'data/jobs', operation: 'pulseJobSearch', searchQuery },
          'Failed to pulse job search'
        );
      });
    }

    // Build RPC args with proper type narrowing using type guards
    const rpcArguments: Database['public']['Functions']['filter_jobs']['Args'] = {};

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

    return await getFilteredJobsCached(
      rpcArguments,
      searchQuery ?? '',
      category ?? 'all',
      employment ?? 'any',
      experience ?? 'any',
      remote ?? false,
      limit ?? 0,
      offset ?? 0,
      sort ?? 'newest'
    );
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, ...filtersLog }, 'Failed to fetch filtered jobs');
    return null;
  }
}

/**
 * Gets a single job by slug
 * Uses 'use cache' to cache job details. This data is public and same for all users.
 * Job details change periodically, so we use the 'half' cacheLife profile.
 * @param slug
 */
export async function getJobBySlug(slug: string) {
  'use cache';

  // Configure cache - use 'half' profile for job details (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag(`job-${slug}`);
  cacheTag('jobs');

  const reqLogger = logger.child({
    module: 'data/jobs',
    operation: 'getJobBySlug',
  });

  try {
    const service = new JobsService();
    const result = await service.getJobBySlug({ p_slug: slug });

    reqLogger.info({ hasResult: Boolean(result), slug }, 'getJobBySlug: fetched successfully');

    return result;
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, slug }, 'getJobBySlug: unexpected error');
    return null;
  }
}

/**
 * Retrieve a list of featured jobs for display.
 * Uses 'use cache' to cache featured jobs. This data is public and same for all users.
 * Featured jobs change periodically, so we use the 'half' cacheLife profile.
 *
 * @param limit - Maximum number of featured jobs to return (default 5)
 * @returns An array of featured job records; returns an empty array if none are available or if an error occurs
 */
export async function getFeaturedJobs(limit = 5) {
  'use cache';

  // Configure cache - use 'half' profile for featured jobs (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('jobs-featured');
  cacheTag('jobs');

  const reqLogger = logger.child({
    module: 'data/jobs',
    operation: 'getFeaturedJobs',
  });

  try {
    const service = new JobsService();
    const result = await service.getFeaturedJobs();

    reqLogger.info(
      { count: result !== null && result !== undefined ? result.length : 0, limit },
      'getFeaturedJobs: fetched successfully'
    );

    if (result === null || result === undefined) {
      return [];
    }
    return result;
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, limit }, 'getFeaturedJobs: unexpected error');
    return [];
  }
}
