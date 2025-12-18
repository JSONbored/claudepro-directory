'use server';
import { type content_category } from '@heyclaude/data-layer/prisma';
import {
  type GetCompaniesListReturns,
  type GetCompanyAdminProfileReturns,
  type GetCompanyProfileReturns,
  type SearchUnifiedArgs,
} from '@heyclaude/database-types/postgres-types';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';
import { normalizeRpcResult } from './content-helpers.ts';

const JOBS_CATEGORY: content_category = 'jobs';

type GetCompanyAdminProfileReturn = GetCompanyAdminProfileReturns;

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
 */
export const getCompanyAdminProfile = createCachedDataFunction<
  string,
  GetCompanyAdminProfileReturn[number]
>({
  serviceKey: 'companies',
  methodName: 'getCompanyAdminProfile',
  cacheMode: 'private',
  cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
  cacheTags: (companyId) => [`company-admin-${companyId}`],
  module: 'data/companies',
  operation: 'getCompanyAdminProfile',
  validate: (companyId) => Boolean(companyId),
  transformArgs: (companyId) => ({ p_company_id: companyId }),
  normalizeResult: (result) => {
    const normalized = normalizeRpcResult(result as GetCompanyAdminProfileReturns);
    return (normalized as GetCompanyAdminProfileReturn[number]) || null;
  },
  throwOnError: true,
});

/**
 * Get company profile by slug
 * Uses 'use cache' to cache company profiles. This data is public and same for all users.
 * Company profiles change periodically, so we use the 'long' cacheLife profile.
 */
export const getCompanyProfile = createCachedDataFunction<string, GetCompanyProfileReturns>({
  serviceKey: 'companies',
  methodName: 'getCompanyProfile',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: (slug) => generateResourceTags('companies', slug, [JOBS_CATEGORY]),
  module: 'data/companies',
  operation: 'getCompanyProfile',
  transformArgs: (slug) => ({ p_slug: slug }),
  throwOnError: true,
});

/**
 * Get companies list
 * Uses 'use cache' to cache companies lists. This data is public and same for all users.
 * Company lists change periodically, so we use the 'long' cacheLife profile.
 */
export async function getCompaniesList(
  limit = 50,
  offset = 0
): Promise<GetCompaniesListReturns> {
  const cachedFn = createCachedDataFunction<
    { limit: number; offset: number },
    GetCompaniesListReturns
  >({
    serviceKey: 'companies',
    methodName: 'getCompaniesList',
    cacheMode: 'public',
    cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
    cacheTags: () => generateResourceTags('companies', undefined, [JOBS_CATEGORY]),
    module: 'data/companies',
    operation: 'getCompaniesList',
    transformArgs: (args) => ({
      p_limit: args.limit,
      p_offset: args.offset,
    }),
    logContext: (args) => ({
      limit: args.limit,
      offset: args.offset,
    }),
    throwOnError: true,
  });

  return (await cachedFn({ limit, offset })) ?? ({ companies: [], total: 0 } as GetCompaniesListReturns);
}

export interface CompanySearchResult {
  description: null | string;
  id: string;
  name: string;
  slug: null | string;
}

/**
 * Fetch company search results (internal cached function)
 * Uses search service to find companies matching query
 */
const fetchCompanySearchResults = createCachedDataFunction<
  { query: string; limit: number },
  CompanySearchResult[]
>({
  serviceKey: 'search',
  methodName: 'searchUnified',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('companies', undefined, ['company-search']),
  module: 'data/companies',
  operation: 'fetchCompanySearchResults',
  transformArgs: (args) =>
    ({
      p_entities: ['company'],
      p_highlight_query: args.query,
      p_limit: args.limit,
      p_offset: 0,
      p_query: args.query,
    }) as SearchUnifiedArgs,
  transformResult: (result) => {
    const searchResponse = result as { data?: Array<{ description?: string; id?: string; title?: string; slug?: string }> };
    const results = searchResponse.data || [];
    return results.map((entity) => ({
      description: entity.description || null,
      id: entity.id || '',
      name: entity.title || entity.slug || '',
      slug: entity.slug || null,
    }));
  },
  onError: () => [], // Return empty array on error
});

/**
 * Search companies by query
 *
 * Uses 'use cache' to cache search results. Query and limit become part of the cache key.
 * This data is public and same for all users with the same query, so it can be cached.
 * Company search results change frequently, so we use the 'long' cacheLife profile.
 *
 * Follows architectural strategy: data layer -> database RPC -> DB
 */
export async function searchCompanies(query: string, limit = 10): Promise<CompanySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  return (await fetchCompanySearchResults({ query: trimmed, limit })) ?? [];
}
