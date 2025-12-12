'use server';

import { CompaniesService, SearchService } from '@heyclaude/data-layer';
import { Constants, type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../logger.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

import { normalizeRpcResult } from './content-helpers.ts';

const JOBS_CATEGORY = Constants.public.Enums.content_category[9] as string; // 'jobs'

type GetCompanyAdminProfileReturn =
  Database['public']['Functions']['get_company_admin_profile']['Returns'];

/**
 * Get company admin profile
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-company cache keys (companyId in cache tag)
 * - Not prerendered (runs at request time)
 * @param companyId
 */
export async function getCompanyAdminProfile(
  companyId: string
): Promise<GetCompanyAdminProfileReturn[number] | null> {
  'use cache: private';

  if (!companyId) {
    return null;
  }

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`company-admin-${companyId}`);

  const requestLogger = logger.child({
    module: 'data/companies',
    operation: 'getCompanyAdminProfile',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new CompaniesService(client);

    const data = await service.getCompanyAdminProfile({ p_company_id: companyId });

    const normalized = normalizeRpcResult(data);
    if (!normalized) {
      requestLogger.warn({ companyId }, 'getCompanyAdminProfile: company not found');
      return null;
    }

    requestLogger.info(
      {
        companyId,
        hasResult: Boolean(normalized),
      },
      'getCompanyAdminProfile: fetched successfully'
    );

    return normalized as GetCompanyAdminProfileReturn[number] | null;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error({ companyId, err: errorForLogging }, 'getCompanyAdminProfile failed');
    throw error;
  }
}

/**
 * Get company profile by slug
 * Uses 'use cache' to cache company profiles. This data is public and same for all users.
 * Company profiles change periodically, so we use the 'half' cacheLife profile.
 * @param slug
 */
export async function getCompanyProfile(
  slug: string
): Promise<Database['public']['Functions']['get_company_profile']['Returns'] | null> {
  'use cache';

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for company profiles (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('companies');
  cacheTag(JOBS_CATEGORY);
  cacheTag(`company-${slug}`);

  const requestLogger = logger.child({
    module: 'data/companies',
    operation: 'getCompanyProfile',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new CompaniesService(client).getCompanyProfile({ p_slug: slug });

    requestLogger.info(
      {
        hasResult: Boolean(result),
        slug,
      },
      'getCompanyProfile: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error({ err: errorForLogging, slug }, 'getCompanyProfile failed');
    throw error;
  }
}

/**
 * Get companies list
 * Uses 'use cache' to cache companies lists. This data is public and same for all users.
 * Company lists change periodically, so we use the 'half' cacheLife profile.
 * @param limit
 * @param offset
 */
export async function getCompaniesList(
  limit = 50,
  offset = 0
): Promise<Database['public']['Functions']['get_companies_list']['Returns']> {
  'use cache';

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for company lists (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('companies');
  cacheTag(JOBS_CATEGORY);

  const requestLogger = logger.child({
    module: 'data/companies',
    operation: 'getCompaniesList',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new CompaniesService(client).getCompaniesList({
      p_limit: limit,
      p_offset: offset,
    });

    requestLogger.info(
      {
        companyCount: result.companies?.length ?? 0,
        limit,
        offset,
        total: result.total ?? 0,
      },
      'getCompaniesList: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error(
      {
        err: errorForLogging,
        limit,
        offset,
      },
      'getCompaniesList failed'
    );
    throw error;
  }
}

export interface CompanySearchResult {
  description: null | string;
  id: string;
  name: string;
  slug: null | string;
}

async function fetchCompanySearchResults(
  query: string,
  limit: number
): Promise<CompanySearchResult[]> {
  'use cache';
  const { cacheLife, cacheTag } = await import('next/cache');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'quarter' profile for company search (same as API route)
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire
  cacheTag('company-search');
  cacheTag('companies');

  const requestLogger = logger.child({
    module: 'data/companies',
    operation: 'fetchCompanySearchResults',
  });

  try {
    // Use SearchService directly (same as API route)
    // Follows architectural strategy: data layer -> database RPC -> DB
    const supabase = createSupabaseAnonClient();
    const searchService = new SearchService(supabase);

    const unifiedArgs: Database['public']['Functions']['search_unified']['Args'] = {
      p_entities: ['company'],
      p_highlight_query: query,
      p_limit: limit,
      p_offset: 0,
      p_query: query,
    };

    const searchResponse = await searchService.searchUnified(unifiedArgs);
    const results = searchResponse.data || [];

    return results.map((entity) => ({
      description: entity.description as string,
      id: entity.id as string,
      name: entity.title || entity.slug || '',
      slug: entity.slug as string,
    }));
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : (typeof error === 'string' ? error : String(error));
    requestLogger.warn(
      {
        err: errorForLogging,
        fallbackStrategy: 'empty-array',
        limit,
        query,
      },
      'Company search failed, returning empty results'
    );
    return [];
  }
}

/**
 * Search companies by query
 *
 * Uses 'use cache' to cache search results. Query and limit become part of the cache key.
 * This data is public and same for all users with the same query, so it can be cached.
 * Company search results change frequently, so we use the 'quarter' cacheLife profile.
 *
 * Follows architectural strategy: data layer -> database RPC -> DB
 * @param query
 * @param limit
 */
export async function searchCompanies(query: string, limit = 10): Promise<CompanySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  // fetchCompanySearchResults already has 'use cache', so we just call it
  // query and limit are automatically part of cache key
  return fetchCompanySearchResults(trimmed, limit);
}
