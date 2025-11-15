'use server';

/**
 * Companies data layer - Edge/public RPC wrappers
 */

import { unstable_cache } from 'next/cache';
import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type JobRow = Database['public']['Tables']['jobs']['Row'];
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

const EDGE_SEARCH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unified-search`
  : null;

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
  if (!EDGE_SEARCH_URL) {
    throw new Error('Supabase URL is not configured for company search');
  }

  const params = new URLSearchParams();
  params.set('q', query);
  params.set('entities', 'company');
  params.set('limit', String(limit));

  const response = await fetch(`${EDGE_SEARCH_URL}?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Company search fetch failed', new Error(errorText || response.statusText), {
      status: response.status,
      query,
    });
    throw new Error('Company search failed');
  }

  const data = (await response.json()) as {
    results?: Array<{ id: string; title: string; slug: string | null; description: string | null }>;
  };

  return (data.results ?? []).map((entity) => ({
    id: entity.id,
    name: entity.title || entity.slug || '',
    slug: entity.slug,
    description: entity.description,
  }));
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
