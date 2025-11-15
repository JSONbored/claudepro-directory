import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';

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

  const data = await fetchCachedRpc<CompanyAdminProfile[] | CompanyAdminProfile | null>(
    { p_company_id: companyId },
    {
      rpcName: 'get_company_admin_profile',
      tags: ['companies', `company-id-${companyId}`],
      ttlKey: COMPANY_DETAIL_TTL_KEY,
      keySuffix: companyId,
      useAuthClient: true,
      fallback: null,
      logMeta: { companyId },
    }
  );

  const record = Array.isArray(data) ? (data[0] ?? null) : data;
  if (!record) {
    logger.warn('getCompanyAdminProfile: company not found', { companyId });
    return null;
  }

  return record;
}
