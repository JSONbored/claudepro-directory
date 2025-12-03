import 'server-only';

import { JobsService, SearchService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { logError } from '@heyclaude/shared-runtime';
import  { type SupabaseClient } from '@supabase/supabase-js';

import { fetchCached } from '../cache/fetch-cached.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import { pulseJobSearch } from '../pulse.ts';
import { generateRequestId } from '../utils/request-id.ts';
import {
  isValidJobCategory,
  isValidJobType,
  isValidExperienceLevel,
} from '../utils/type-guards.ts';

// Cache TTL key constants to avoid hardcoded string literals
const JOBS_TTL_KEY = 'jobs' as const;
const JOBS_DETAIL_TTL_KEY = 'jobs_detail' as const;

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
async function getFilteredJobsDirect(
  options: JobsFilterOptions
): Promise<JobsFilterResult | null> {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getFilteredJobsDirect',
    module: 'data/jobs',
  });

  const { trackPerformance } = await import('../utils/performance-metrics');
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
    sort: sort ?? null
  };
  
  try {
    const { result } = await trackPerformance(
      async () => {
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
      },
      {
        operation: 'getFilteredJobsDirect',
        logger: reqLogger, // Use child logger to avoid passing requestId/operation repeatedly
        requestId, // Pass requestId for return value
        logMeta: filtersLog,
        logLevel: 'info',
      }
    );
    
    return result;
  } catch (error) {
    // trackPerformance already logs the error, but we log again with context about fallback behavior
    const normalized = normalizeError(error, 'Job filtering failed, returning null');
    reqLogger.warn('Job filtering failed, returning null', {
      err: normalized,
      ...filtersLog,
      fallbackStrategy: 'null',
    });
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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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
    sort: sort ?? null
  };

  // If no filters, use standard list (cached)
  if (!hasFilters) {
    try {
      return await fetchCached(
      (client: SupabaseClient<Database>) => new SearchService(client).filterJobs({
        ...(limit === undefined ? {} : { p_limit: limit }),
        ...(offset === undefined ? {} : { p_offset: offset })
      }),
      {
        keyParts: ['jobs-all', limit ?? 0, offset ?? 0],
        tags: ['jobs-list'],
        ttlKey: JOBS_TTL_KEY,
        fallback: null,
        logMeta: filtersLog
      }
      );
    } catch (error) {
      // Log error if fetchCached fails unexpectedly (e.g., cache system error)
      const normalized = normalizeError(error, 'getFilteredJobs: failed to fetch jobs list');
      reqLogger.error('getFilteredJobs: failed to fetch jobs list', normalized, {
        ...filtersLog,
      });
      return null;
    }
  }

  // If filters present and noCache=true, bypass cache (uncached SSR)
  if (noCache) {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      pulseJobSearch(searchQuery, {}, 0).catch(async (error: unknown) => {
        // Note: Using explicit context here for nested async callbacks
        // While parent bindings are available at runtime, explicit context ensures
        // proper correlation and traceability for fire-and-forget operations
        const callbackRequestId = generateRequestId();
        await logError('Failed to pulse job search', {
          requestId: callbackRequestId,
          operation: 'pulseJobSearch',
          module: 'data/jobs',
          searchQuery,
        }, error);
      });
    }
    return getFilteredJobsDirect(options);
  }

  // If filters present, use search (cached with query key)
  try {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      pulseJobSearch(searchQuery, {}, 0).catch(async (error: unknown) => {
        // Note: Using explicit context here for nested async callbacks
        // While parent bindings are available at runtime, explicit context ensures
        // proper correlation and traceability for fire-and-forget operations
        const callbackRequestId = generateRequestId();
        await logError('Failed to pulse job search', {
          requestId: callbackRequestId,
          operation: 'pulseJobSearch',
          module: 'data/jobs',
          searchQuery,
        }, error);
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
    
    return fetchCached(
      (client: SupabaseClient<Database>) => new SearchService(client).filterJobs(rpcArguments),
      {
        // Next.js automatically handles serialization of keyParts array
        keyParts: [
          'jobs-filtered',
          searchQuery ?? '',
          category ?? 'all',
          employment ?? 'any',
          experience ?? 'any',
          remote ?? false,
          limit ?? 0,
          offset ?? 0,
          sort ?? 'newest',
        ],
        tags: ['jobs-search'],
        ttlKey: JOBS_TTL_KEY,
        fallback: null,
        logMeta: filtersLog
      }
    );
  } catch (error) {
    // Log error if fetchCached fails unexpectedly (e.g., cache system error)
    const normalized = normalizeError(error, 'Failed to fetch filtered jobs');
    reqLogger.error('Failed to fetch filtered jobs', normalized, {
      ...filtersLog,
    });
    return null;
  }
}

/**
 * Gets a single job by slug
 */
export async function getJobBySlug(slug: string) {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getJobBySlug',
    module: 'data/jobs',
  });

  try {
    return await fetchCached(
      (client: SupabaseClient<Database>) => new JobsService(client).getJobBySlug({ p_slug: slug }),
      {
        keyParts: ['job', slug],
        tags: [`job-${slug}`],
        ttlKey: JOBS_DETAIL_TTL_KEY,
        fallback: null,
        logMeta: { slug },
      }
    );
  } catch (error) {
    // Log error if fetchCached fails unexpectedly (e.g., cache system error)
    const normalized = normalizeError(error, 'getJobBySlug failed');
    reqLogger.error('getJobBySlug: unexpected error', normalized, {
      slug,
    });
    return null;
  }
}

/**
 * Retrieve a list of featured jobs for display.
 *
 * @param limit - Maximum number of featured jobs to return (default 5)
 * @returns An array of featured job records; returns an empty array if none are available or if an error occurs
 */
export async function getFeaturedJobs(limit = 5) {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getFeaturedJobs',
    module: 'data/jobs',
  });

  try {
    return await fetchCached(
      (client: SupabaseClient<Database>) => new JobsService(client).getFeaturedJobs(),
      {
        keyParts: ['jobs-featured', limit],
        tags: ['jobs-featured'],
        ttlKey: JOBS_TTL_KEY,
        fallback: [],
        logMeta: { limit },
      }
    );
  } catch (error) {
    // Log error if fetchCached fails unexpectedly (e.g., cache system error)
    const normalized = normalizeError(error, 'getFeaturedJobs failed');
    reqLogger.error('getFeaturedJobs: unexpected error', normalized, {
      limit,
    });
    return [];
  }
}