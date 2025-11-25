import 'server-only';

import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { pulseJobSearch } from '../pulse.ts';
import { fetchCached } from '../cache/fetch-cached.ts';
import { JobsService, SearchService } from '@heyclaude/data-layer';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import {
  isValidJobCategory,
  isValidJobType,
  isValidExperienceLevel,
} from '../utils/type-guards.ts';
import { generateRequestId } from '../utils/request-context.ts';

export type JobsFilterResult = Database['public']['Functions']['filter_jobs']['Returns'];

export interface JobsFilterOptions {
  searchQuery?: string;
  category?: string;
  employment?: string;
  experience?: string;
  remote?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'salary';
}

/**
 * Direct job filtering without cache (for filtered queries - uncached SSR)
 */
async function getFilteredJobsDirect(
  options: JobsFilterOptions
): Promise<JobsFilterResult | null> {
  const { trackPerformance } = await import('../utils/performance-metrics');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');
  const { searchQuery, category, employment, experience, remote, limit, offset, sort } = options;
  
  const filtersLog: Record<string, string | number | boolean | null> = {
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
        const rpcArgs: Database['public']['Functions']['filter_jobs']['Args'] = {};
        
        if (searchQuery) {
          rpcArgs.p_search_query = searchQuery;
        }
        if (category && category !== 'all' && isValidJobCategory(category)) {
          // Type guard ensures category is valid job_category enum
          rpcArgs.p_category = category as Database['public']['Enums']['job_category'];
        }
        if (employment && employment !== 'any' && isValidJobType(employment)) {
          // Type guard ensures employment is valid job_type enum
          rpcArgs.p_employment_type = employment as Database['public']['Enums']['job_type'];
        }
        if (experience && experience !== 'any' && isValidExperienceLevel(experience)) {
          // Type guard ensures experience is valid experience_level enum
          rpcArgs.p_experience_level = experience as Database['public']['Enums']['experience_level'];
        }
        if (remote !== undefined) {
          rpcArgs.p_remote_only = remote;
        }
        if (limit !== undefined) {
          rpcArgs.p_limit = limit;
        }
        if (offset !== undefined) {
          rpcArgs.p_offset = offset;
        }
        
        // Type compatibility: SupabaseAnonClient is compatible with SupabaseClient<Database>
        // Both are created from the same underlying Supabase client factory with Database type
        // This is safe because createSupabaseAnonClient returns ReturnType<typeof createSupabaseClient<Database>>
        // We use a type assertion here because TypeScript doesn't recognize the structural compatibility
        return await new SearchService(client as SupabaseClient<Database>).filterJobs(rpcArgs);
      },
      {
        operation: 'getFilteredJobsDirect',
        logMeta: filtersLog,
        logLevel: 'info',
      }
    );
    
    return result;
  } catch (error) {
    // trackPerformance already logs the error with performance metrics
    return null;
  }
}

/**
 * Gets jobs with filtering
 * 
 * @param options - Filter options
 * @param noCache - If true, bypass cache for filtered queries (uncached SSR)
 */
export async function getFilteredJobs(
  options: JobsFilterOptions,
  noCache = false
): Promise<JobsFilterResult | null> {
  const { searchQuery, category, employment, experience, remote, limit, offset, sort } = options;
  const hasFilters = Boolean(searchQuery || (category && category !== 'all') || (employment && employment !== 'any') || (experience && experience !== 'any') || (remote !== undefined));

  const filtersLog: Record<string, string | number | boolean | null> = {
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
    return fetchCached(
      (client: SupabaseClient<Database>) => new SearchService(client).filterJobs({
        ...(limit !== undefined ? { p_limit: limit } : {}),
        ...(offset !== undefined ? { p_offset: offset } : {})
      }),
      {
        keyParts: ['jobs-all', limit ?? 0, offset ?? 0],
        tags: ['jobs-list'],
        ttlKey: 'cache.jobs.ttl_seconds',
        fallback: null,
        logMeta: filtersLog
      }
    );
  }

  // If filters present and noCache=true, bypass cache (uncached SSR)
  if (noCache) {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      pulseJobSearch(searchQuery, {}, 0).catch((err: unknown) => {
        const normalized = normalizeError(err);
        logger.error('Failed to pulse job search', normalized, {
          requestId: generateRequestId(),
          operation: 'pulseJobSearch',
        });
      });
    }
    return getFilteredJobsDirect(options);
  }

  // If filters present, use search (cached with query key)
  try {
    // Pulse the search for analytics (fire and forget)
    if (searchQuery) {
      pulseJobSearch(searchQuery, {}, 0).catch((err: unknown) => {
        const normalized = normalizeError(err);
        logger.error('Failed to pulse job search', normalized, {
          requestId: generateRequestId(),
          operation: 'pulseJobSearch',
        });
      });
    }

    // OPTIMIZATION: Use type guards instead of type assertions for runtime validation
    // Build RPC args with proper type narrowing
    const rpcArgs: Database['public']['Functions']['filter_jobs']['Args'] = {};
    
    if (searchQuery) {
      rpcArgs.p_search_query = searchQuery;
    }
    if (category && category !== 'all' && isValidJobCategory(category)) {
      // Type guard ensures category is valid job_category enum
      rpcArgs.p_category = category as Database['public']['Enums']['job_category'];
    }
    if (employment && employment !== 'any' && isValidJobType(employment)) {
      // Type guard ensures employment is valid job_type enum
      rpcArgs.p_employment_type = employment as Database['public']['Enums']['job_type'];
    }
    if (experience && experience !== 'any' && isValidExperienceLevel(experience)) {
      // Type guard ensures experience is valid experience_level enum
      rpcArgs.p_experience_level = experience as Database['public']['Enums']['experience_level'];
    }
    if (remote !== undefined) {
      rpcArgs.p_remote_only = remote;
    }
    if (limit !== undefined) {
      rpcArgs.p_limit = limit;
    }
    if (offset !== undefined) {
      rpcArgs.p_offset = offset;
    }
    
    return fetchCached(
      (client: SupabaseClient<Database>) => new SearchService(client).filterJobs(rpcArgs),
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
        ttlKey: 'cache.jobs.ttl_seconds',
        fallback: null,
        logMeta: filtersLog
      }
    );
  } catch (error) {
    const normalized = normalizeError(error);
    logger.error('Failed to fetch filtered jobs', normalized, {
      requestId: generateRequestId(),
      operation: 'getFilteredJobs',
      ...filtersLog,
    });
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
      keyParts: ['job', slug],
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
      keyParts: ['jobs-featured', limit],
      tags: ['jobs-featured'],
      ttlKey: 'cache.jobs.ttl_seconds',
      fallback: []
    }
  );
}
