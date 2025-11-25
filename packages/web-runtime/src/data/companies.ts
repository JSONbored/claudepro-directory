'use server';

import type { Database } from '@heyclaude/database-types';
import { unstable_cache } from 'next/cache';
import { getCacheTtl } from '../cache-config.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import { searchCompaniesUnified } from '../edge/search-client.ts';
import { fetchCached } from '../cache/fetch-cached.ts';
import { CompaniesService } from '@heyclaude/data-layer';
import { normalizeRpcResult } from './content-helpers.ts';
import { generateRequestId } from '../utils/request-context.ts';

const COMPANY_DETAIL_TTL_KEY = 'cache.company_detail.ttl_seconds';

type GetCompanyAdminProfileReturn =
  Database['public']['Functions']['get_company_admin_profile']['Returns'];

export async function getCompanyAdminProfile(
  companyId: string
): Promise<GetCompanyAdminProfileReturn[number] | null> {
  if (!companyId) {
    return null;
  }

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
    logger.warn('getCompanyAdminProfile: company not found', undefined, {
      requestId: generateRequestId(),
      operation: 'getCompanyAdminProfile',
      companyId,
    });
    return null;
  }

  return normalized as GetCompanyAdminProfileReturn[number] | null;
}

export async function getCompanyProfile(
  slug: string
): Promise<Database['public']['Functions']['get_company_profile']['Returns'] | null> {
  return fetchCached(
    (client) => new CompaniesService(client).getCompanyProfile({ p_slug: slug }),
    {
      keyParts: ['company', slug],
      tags: ['companies', 'jobs', `company-${slug}`],
      ttlKey: COMPANY_DETAIL_TTL_KEY,
      fallback: null,
      logMeta: { slug },
    }
  );
}

export async function getCompaniesList(
  limit = 50,
  offset = 0
): Promise<Database['public']['Functions']['get_companies_list']['Returns']> {
  return fetchCached(
    (client) => new CompaniesService(client).getCompaniesList({ p_limit: limit, p_offset: offset }),
    {
      keyParts: ['companies-list', limit, offset],
      tags: ['companies', 'jobs'],
      ttlKey: 'cache.company_list.ttl_seconds',
      fallback: { companies: [], total: 0 },
      logMeta: { limit, offset },
    }
  );
}

export type CompanySearchResult = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
};

async function fetchCompanySearchResults(
  query: string,
  limit: number
): Promise<CompanySearchResult[]> {
  try {
    const results = await searchCompaniesUnified(query, limit);
    return results.map((entity) => ({
      id: entity.id,
      name: entity.title || entity.slug || '',
      slug: entity.slug,
      description: entity.description,
    }));
  } catch (error) {
    const normalized = normalizeError(error, 'Company search fetch error');
    logger.error('Company search fetch failed', normalized, {
      requestId: generateRequestId(),
      operation: 'fetchCompanySearchResults',
      query,
      limit,
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
  const ttl = await getCacheTtl('cache.company_search.ttl_seconds');

  return unstable_cache(
    () => fetchCompanySearchResults(trimmed, limit),
    [`company-search-${normalized}-${limit}`],
    {
      revalidate: ttl,
      tags: ['company-search'],
    }
  )();
}
