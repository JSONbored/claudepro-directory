'use server';

import { CompaniesService } from '@heyclaude/data-layer';
import { Constants, type Database } from '@heyclaude/database-types';
import { unstable_cache } from 'next/cache';

import { fetchCached } from '../cache/fetch-cached.ts';
import { getCacheTtl } from '../cache-config.ts';
import { searchCompaniesUnified } from '../edge/search-client.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import { generateRequestId } from '../utils/request-id.ts';

import { normalizeRpcResult } from './content-helpers.ts';

const JOBS_CATEGORY = Constants.public.Enums.content_category[9] as string; // 'jobs'


const COMPANY_DETAIL_TTL_KEY = 'cache.company_detail.ttl_seconds';

type GetCompanyAdminProfileReturn =
  Database['public']['Functions']['get_company_admin_profile']['Returns'];

export async function getCompanyAdminProfile(
  companyId: string
): Promise<GetCompanyAdminProfileReturn[number] | null> {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getCompanyAdminProfile',
    module: 'data/companies',
  });

  if (!companyId) {
    return null;
  }

  try {
    const data = await fetchCached(
      (client) => new CompaniesService(client).getCompanyAdminProfile({ p_company_id: companyId }),
      {
        keyParts: ['company-admin', companyId],
        tags: ['companies', `company-id-${companyId}`],
        ttlKey: COMPANY_DETAIL_TTL_KEY,
        useAuth: true,
        fallback: null,
        logMeta: { companyId },
      }
    );

    const normalized = normalizeRpcResult(data);
    if (!normalized) {
      requestLogger.warn('getCompanyAdminProfile: company not found', {
        companyId,
      });
      return null;
    }

    return normalized as GetCompanyAdminProfileReturn[number] | null;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get company admin profile');
    requestLogger.error('getCompanyAdminProfile failed', normalized, {
      companyId,
    });
    throw normalized;
  }
}

export async function getCompanyProfile(
  slug: string
): Promise<Database['public']['Functions']['get_company_profile']['Returns'] | null> {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getCompanyProfile',
    module: 'data/companies',
  });

  try {
    return await fetchCached(
      (client) => new CompaniesService(client).getCompanyProfile({ p_slug: slug }),
      {
        keyParts: ['company', slug],
        tags: ['companies', JOBS_CATEGORY, `company-${slug}`],
        ttlKey: COMPANY_DETAIL_TTL_KEY,
        fallback: null,
        logMeta: { slug },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get company profile');
    requestLogger.error('getCompanyProfile failed', normalized, {
      slug,
    });
    throw normalized;
  }
}

export async function getCompaniesList(
  limit = 50,
  offset = 0
): Promise<Database['public']['Functions']['get_companies_list']['Returns']> {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getCompaniesList',
    module: 'data/companies',
  });

  try {
    return await fetchCached(
      (client) => new CompaniesService(client).getCompaniesList({ p_limit: limit, p_offset: offset }),
      {
        keyParts: ['companies-list', limit, offset],
        tags: ['companies', JOBS_CATEGORY],
        ttlKey: 'cache.company_list.ttl_seconds',
        fallback: { companies: [], total: 0 },
        logMeta: { limit, offset },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get companies list');
    requestLogger.error('getCompaniesList failed', normalized, {
      limit,
      offset,
    });
    throw normalized;
  }
}

export interface CompanySearchResult {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
}

async function fetchCompanySearchResults(
  query: string,
  limit: number
): Promise<CompanySearchResult[]> {
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'fetchCompanySearchResults',
    module: 'data/companies',
  });

  const { trackPerformance } = await import('../utils/performance-metrics');
  
  try {
    const { result } = await trackPerformance(
      async () => {
        const results = await searchCompaniesUnified(query, limit);
        return results.map((entity) => ({
          id: entity.id,
          name: entity.title || entity.slug || '',
          slug: entity.slug,
          description: entity.description,
        }));
      },
      {
        operation: 'fetchCompanySearchResults',
        logger: requestLogger, // Use child logger to avoid passing requestId/operation repeatedly
        requestId, // Pass requestId for return value
        logMeta: { query, limit },
        logLevel: 'info', // Log all operations for observability
      }
    );
    
    return result;
  } catch (error) {
    // trackPerformance already logs the error, but we log again with context about fallback behavior
    const normalized = normalizeError(error, 'Company search failed, returning empty results');
    requestLogger.warn('Company search failed, returning empty results', {
      err: normalized,
      query,
      limit,
      fallbackStrategy: 'empty-array',
    });
    return [];
  }
}

export async function searchCompanies(query: string, limit = 10): Promise<CompanySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const normalized = trimmed.toLowerCase();
  const ttl = getCacheTtl('cache.company_search.ttl_seconds');

  return unstable_cache(
    () => fetchCompanySearchResults(trimmed, limit),
    [`company-search-${normalized}-${limit}`],
    {
      revalidate: ttl,
      tags: ['company-search'],
    }
  )();
}
