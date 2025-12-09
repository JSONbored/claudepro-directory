'use server';

import { CompaniesService } from '@heyclaude/data-layer';
import { Constants, type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { searchCompaniesUnified } from '../edge/search-client.ts';
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
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`company-admin-${companyId}`);

  const requestLogger = logger.child({
    operation: 'getCompanyAdminProfile',
    module: 'data/companies',
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
    requestLogger.error({ err: errorForLogging, companyId }, 'getCompanyAdminProfile failed');
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
    operation: 'getCompanyProfile',
    module: 'data/companies',
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
        slug,
        hasResult: Boolean(result),
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
    operation: 'getCompaniesList',
    module: 'data/companies',
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
        limit,
        offset,
        companyCount: result.companies?.length ?? 0,
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
  const requestLogger = logger.child({
    operation: 'fetchCompanySearchResults',
    module: 'data/companies',
  });

  try {
    const results = await searchCompaniesUnified(query, limit);
    return results.map((entity) => ({
      id: entity.id,
      name: entity.title || entity.slug || '',
      slug: entity.slug,
      description: entity.description,
    }));
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : typeof error === 'string' ? error : String(error);
    requestLogger.warn(
      {
        err: errorForLogging,
        query,
        limit,
        fallbackStrategy: 'empty-array',
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
 * @param query
 * @param limit
 */
export async function searchCompanies(query: string, limit = 10): Promise<CompanySearchResult[]> {
  'use cache';
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  // Configure cache - use 'quarter' profile for company search (changes every 5 minutes)
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2 hours expire
  cacheTag('company-search');

  // query and limit are automatically part of cache key
  return fetchCompanySearchResults(trimmed, limit);
}
