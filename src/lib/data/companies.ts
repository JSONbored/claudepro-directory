/**
 * Companies data layer - Edge-cached RPC wrappers
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
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

/**
 * Get company profile with active jobs and stats (public, cached)
 * Uses get_company_profile() RPC which leverages company_job_stats materialized view
 */
export async function getCompanyProfile(slug: string): Promise<CompanyProfile | null> {
  try {
    const data = await cachedRPCWithDedupe<CompanyProfile>(
      'get_company_profile',
      { p_slug: slug },
      {
        tags: ['companies', 'jobs', `company-${slug}`],
        ttlConfigKey: 'cache.company_detail.ttl_seconds',
        keySuffix: slug,
        useAuthClient: false, // Public data
      }
    );

    return data;
  } catch (error) {
    logger.error(
      'Error in getCompanyProfile',
      error instanceof Error ? error : new Error(String(error)),
      { slug }
    );
    return null;
  }
}

/**
 * Get paginated companies list with stats (public, cached)
 * Uses get_companies_list() RPC - single optimized query with materialized view join
 */
export async function getCompaniesList(limit = 50, offset = 0): Promise<CompaniesListResult> {
  try {
    const data = await cachedRPCWithDedupe<CompaniesListResult>(
      'get_companies_list',
      { p_limit: limit, p_offset: offset },
      {
        tags: ['companies', 'jobs'],
        ttlConfigKey: 'cache.company_list.ttl_seconds',
        keySuffix: `list-${limit}-${offset}`,
        useAuthClient: false, // Public data
      }
    );

    return data || { companies: [], total: 0 };
  } catch (error) {
    logger.error(
      'Error in getCompaniesList',
      error instanceof Error ? error : new Error(String(error)),
      { limit, offset }
    );
    return { companies: [], total: 0 };
  }
}
