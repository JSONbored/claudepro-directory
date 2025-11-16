'use server';

/**
 * Companies data layer - Edge/public RPC wrappers
 */

import { unstable_cache } from 'next/cache';
import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';
import type { Tables } from '@/src/types/database-overrides';

type CompanyRow = Tables<'companies'>;
type JobRow = Tables<'jobs'>;
// Use direct database type for views (not overridden in database-overrides.ts)
type CompanyJobStatsRow = Database['public']['Views']['company_job_stats']['Row'];

interface CompanyProfile {
  company: CompanyRow;
  active_jobs: JobRow[];
  stats: Omit<CompanyJobStatsRow, 'company_id' | 'company_slug' | 'company_name'>;
}

interface CompanyWithStats {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  size: string | null;
  industry: string | null;
  featured: boolean;
  created_at: string;
  stats: {
    active_jobs: number;
    total_jobs: number;
    remote_jobs: number;
    total_views: number;
    total_clicks: number;
    latest_job_posted_at: string | null;
  } | null;
}

interface CompaniesListResult {
  companies: CompanyWithStats[];
  total: number;
}

export type CompanySearchResult = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
};

// EDGE_SEARCH_URL removed - now using unified search helper

export async function getCompanyProfile(slug: string): Promise<CompanyProfile | null> {
  return fetchCachedRpc<CompanyProfile | null>(
    { p_slug: slug },
    {
      rpcName: 'get_company_profile',
      tags: ['companies', 'jobs', `company-${slug}`],
      ttlKey: 'cache.company_detail.ttl_seconds',
      keySuffix: slug,
      useAuthClient: false,
      fallback: null,
      logMeta: { slug },
    }
  );
}

export async function getCompaniesList(limit = 50, offset = 0): Promise<CompaniesListResult> {
  return fetchCachedRpc<CompaniesListResult>(
    { p_limit: limit, p_offset: offset },
    {
      rpcName: 'get_companies_list',
      tags: ['companies', 'jobs'],
      ttlKey: 'cache.company_list.ttl_seconds',
      keySuffix: `list-${limit}-${offset}`,
      useAuthClient: false,
      fallback: { companies: [], total: 0 },
      logMeta: { limit, offset },
    }
  );
}

async function fetchCompanySearchResults(
  query: string,
  limit: number
): Promise<CompanySearchResult[]> {
  try {
    // Use unified search helper (server-side)
    const { searchCompaniesUnified } = await import('@/src/lib/edge/search-client');

    const results = await searchCompaniesUnified(query, limit);

    // Transform unified search results to CompanySearchResult format
    return results.map((entity) => ({
      id: entity.id,
      name: entity.title || entity.slug || '',
      slug: entity.slug,
      description: entity.description,
    }));
  } catch (error) {
    const normalized = normalizeError(error, 'Company search fetch error');
    logger.error('Company search fetch failed', normalized, {
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
