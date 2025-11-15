import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { normalizeError } from '@/src/lib/utils/error.utils';

export interface CompanyAdminProfile {
  id: string;
  owner_id: string | null;
  name: string | null;
  slug: string | null;
  logo: string | null;
  website: string | null;
  description: string | null;
  size: string | null;
  industry: string | null;
  using_cursor_since: string | null;
  featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const COMPANY_DETAIL_TTL_KEY = 'cache.company_detail.ttl_seconds';

export async function getCompanyAdminProfile(
  companyId: string
): Promise<CompanyAdminProfile | null> {
  if (!companyId) {
    return null;
  }

  try {
    const data = await cachedRPCWithDedupe<CompanyAdminProfile[] | CompanyAdminProfile | null>(
      'get_company_admin_profile',
      { p_company_id: companyId },
      {
        tags: ['companies', `company-id-${companyId}`],
        ttlConfigKey: COMPANY_DETAIL_TTL_KEY,
        useAuthClient: true,
        keySuffix: companyId,
      }
    );

    const record = Array.isArray(data) ? (data[0] ?? null) : data;
    if (!record) {
      logger.warn('getCompanyAdminProfile: company not found', { companyId });
      return null;
    }

    return record;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load company admin profile');
    logger.error('getCompanyAdminProfile: RPC failed', normalized, { companyId });
    return null;
  }
}
