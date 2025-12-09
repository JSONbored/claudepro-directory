import 'server-only';
import { JobsService, SearchService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../logger.ts';
import { pulseJobSearch } from '../pulse.ts';
import {
  isValidJobCategory,
  isValidJobType,
  isValidExperienceLevel,
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

/**
 * Fetches jobs matching the provided filter options directly from the data source without using cache.
 *
 * @param options - Filtering options (may include `searchQuery`, `category`, `employment`, `experience`, `remote`, `limit`, `offset`, `sort`)
 * @returns The filtered jobs result, or `null` if an error occurs
 */
async function getFilteredJobsDirect(options: JobsFilterOptions): Promise<JobsFilterResult | null> {
  // Create request-scoped child logger
  const reqLogger = logger.child({
    operation: 'getFilteredJobsDirect',
    module: 'data/jobs',
  });

  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');
  const { searchQuery, category, employment, experience, remote, limit, offset, sort } = options;

  const filtersLog: Record<string, boolean | null | number | string> = {
    searchQuery: searchQuery ?? null,
    category: category ?? null,
    employment: employment ?? null,
    experience: experience ?? null,
    remote: remote ?? null,
    limit: limit ?? null,
    offset: offset ?? null,
    sort: sort ?? null,
  };

  try {
    const client = createSupabaseAnonClient();

    // OPTIMIZATION: Use type guards instead of type assertions for runtime validation
    // Build RPC args with proper type narrowing
    const rpcArguments: Database['public']['Functions']['filter_jobs']['Args'] = {};

    if (searchQuery) {
      rpcArguments.p_search_query = searchQuery;
    }
    if (category && category !== 'all' && isValidJobCategory(category)) {
      // Type guard ensures category is valid job_category enum
      rpcArguments.p_category = category;
    }
    if (employment && employment !== 'any' && isValidJobType(employment)) {
      // Type guard ensures employment is valid job_type enum
      rpcArguments.p_employment_type = employment;
    }
    if (experience && experience !== 'any' && isValidExperienceLevel(experience)) {
      // Type guard ensures experience is valid experience_level enum
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

    // Type compatibility: SupabaseAnonClient is compatible with SupabaseClient<Database>
    // Both are created from the same underlying Supabase client factory with Database type
    // This is safe because createSupabaseAnonClient returns ReturnType<typeof createSupabaseClient<Database>>
    // We use a type assertion here because TypeScript doesn't recognize the structural compatibility
    return await new SearchService(client).filterJobs(rpcArguments);
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.warn(
      { err: errorForLogging, ...filtersLog, fallbackStrategy: 'null' },
      'Job filtering failed, returning null'
    );
    return null;
  }
}

/**
 * Get jobs list without filters (cached)
 * Uses 'use cache' to cache jobs lists. This data is public and same for all users.
 * Jobs lists change periodically, so we use the 'half' cacheLife profile.
 * @param limit
 * @param offset
 
 * @returns {unknown} Description of return value*/
async function getJobsListCached(limit: number, offset: number): Promise<JobsFilterResult | null> {
  'use cache';

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for jobs lists (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('jobs-list');

  const reqLogger = logger.child({
    operation: 'getJobsListCached',
    module: 'data/jobs',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      // Admin client required during build: bypasses RLS for faster static generation
      // This is safe because build-time queries are read-only and don't expose user data
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const rpcArgs: Database['public']['Functions']['filter_jobs']['Args'] = {};
    if (limit !== undefined) {
      rpcArgs.p_limit = limit;
    }
    if (offset !== undefined) {
      rpcArgs.p_offset = offset;
    }
    const result = await new SearchService(client).filterJobs(rpcArgs);

    reqLogger.info(
      { limit, offset, hasResult: Boolean(result) },
      'getJobsListCached: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, limit, offset }, 'getJobsListCached: failed');
    return null;
  }
}

/**
 * Get filtered jobs with search/filters (cached)
 * Uses 'use cache' to cache filtered jobs. This data is public and same for all users.
 * Filtered jobs change periodically, so we use the 'half' cacheLife profile.
 * @param rpcArguments
 * @param searchQuery
 * @param category
 * @param employment
 * @param experience
 * @param remote
 * @param limit
 * @param offset
 * @param sort
 
 * @returns {unknown} Description of return value*/
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

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for filtered jobs (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('jobs-search');

  const reqLogger = logger.child({
    operation: 'getFilteredJobsCached',
    module: 'data/jobs',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      // Admin client required during build: bypasses RLS for faster static generation
      // This is safe because build-time queries are read-only and don't expose user data
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new SearchService(client).filterJobs(rpcArguments);

    reqLogger.info(
      {
        searchQuery,
        category,
        employment,
        experience,
        remote,
        limit,
        offset,
        sort,
        hasResult: Boolean(result),
      },
      'getFilteredJobsCached: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      {
        err: errorForLogging,
        searchQuery,
        category,
        employment,
        experience,
        remote,
        limit,
        offset,
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
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'getFilteredJobs',
    module: 'data/jobs',
  });

  const { searchQuery, category, employment, experience, remote, limit, offset, sort } = options;
  const hasFilters = Boolean(
    (searchQuery ?? '') !== '' ||
    (category !== undefined && category !== 'all') ||
    (employment !== undefined && employment !== 'any') ||
    (experience !== undefined && experience !== 'any') ||
    remote !== undefined
  );

  const filtersLog: Record<string, boolean | null | number | string> = {
    searchQuery: searchQuery ?? null,
    category: category ?? null,
    employment: employment ?? null,
    experience: experience ?? null,
    remote: remote ?? null,
    limit: limit ?? null,
    offset: offset ?? null,
    sort: sort ?? null,
  };

  // If no filters, use standard list (cached)
  if (!hasFilters) {
    try {
      return await getJobsListCached(limit ?? 0, offset ?? 0);
    } catch (error) {
      // logger.error() normalizes errors internally, so pass raw error
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
      // Fire-and-forget analytics call - errors are logged but don't block the request
      void pulseJobSearch(searchQuery, {}, 0).catch((error: unknown) => {
        const normalized = normalizeError(error, 'Failed to pulse job search');
        logger.error(
          { err: normalized, operation: 'pulseJobSearch', module: 'data/jobs', searchQuery },
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
      // Fire-and-forget analytics call - errors are logged but don't block the request
      void pulseJobSearch(searchQuery, {}, 0).catch((error: unknown) => {
        const normalized = normalizeError(error, 'Failed to pulse job search');
        logger.error(
          { err: normalized, operation: 'pulseJobSearch', module: 'data/jobs', searchQuery },
          'Failed to pulse job search'
        );
      });
    }

    // OPTIMIZATION: Use type guards instead of type assertions for runtime validation
    // Build RPC args with proper type narrowing
    const rpcArguments: Database['public']['Functions']['filter_jobs']['Args'] = {};

    if (searchQuery) {
      rpcArguments.p_search_query = searchQuery;
    }
    if (category && category !== 'all' && isValidJobCategory(category)) {
      // Type guard ensures category is valid job_category enum
      rpcArguments.p_category = category;
    }
    if (employment && employment !== 'any' && isValidJobType(employment)) {
      // Type guard ensures employment is valid job_type enum
      rpcArguments.p_employment_type = employment;
    }
    if (experience && experience !== 'any' && isValidExperienceLevel(experience)) {
      // Type guard ensures experience is valid experience_level enum
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
    // logger.error() normalizes errors internally, so pass raw error
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

  const { cacheLife, cacheTag } = await import('next/cache');
  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for job details (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag(`job-${slug}`);
  cacheTag('jobs');

  const reqLogger = logger.child({
    operation: 'getJobBySlug',
    module: 'data/jobs',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      // Admin client required during build: bypasses RLS for faster static generation
      // This is safe because build-time queries are read-only and don't expose user data
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new JobsService(client).getJobBySlug({ p_slug: slug });

    reqLogger.info({ slug, hasResult: Boolean(result) }, 'getJobBySlug: fetched successfully');

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
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

  const { cacheLife, cacheTag } = await import('next/cache');
  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for featured jobs (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('jobs-featured');
  cacheTag('jobs');

  const reqLogger = logger.child({
    operation: 'getFeaturedJobs',
    module: 'data/jobs',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      // Admin client required during build: bypasses RLS for faster static generation
      // This is safe because build-time queries are read-only and don't expose user data
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new JobsService(client).getFeaturedJobs();

    reqLogger.info(
      { limit, count: result !== null && result !== undefined ? result.length : 0 },
      'getFeaturedJobs: fetched successfully'
    );

    if (result === null || result === undefined) {
      return [];
    }
    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, limit }, 'getFeaturedJobs: unexpected error');
    return [];
  }
}
