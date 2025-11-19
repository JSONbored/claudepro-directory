import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { normalizeRpcResult } from '@/src/lib/data/helpers-utils';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

const COMPANY_DETAIL_TTL_KEY = 'cache.company_detail.ttl_seconds';

type GetCompanyAdminProfileReturn =
  Database['public']['Functions']['get_company_admin_profile']['Returns'];

export async function getCompanyAdminProfile(
  companyId: string
): Promise<GetCompanyAdminProfileReturn[number] | null> {
  if (!companyId) {
    return null;
  }

  // RPC returns array, but we normalize to single object
  const data = await fetchCachedRpc<
    'get_company_admin_profile',
    GetCompanyAdminProfileReturn | null
  >(
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

  const normalized = normalizeRpcResult(data);
  if (!normalized) {
    logger.warn('getCompanyAdminProfile: company not found', { companyId });
    return null;
  }

  return normalized as GetCompanyAdminProfileReturn[number] | null;
}
