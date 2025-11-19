/**
 * Templates Data Layer - Database-First Architecture
 * Uses get_content_templates() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';
import type { GetGetContentTemplatesReturn } from '@/src/types/database-overrides';

export async function getContentTemplates(
  category: Database['public']['Enums']['content_category']
): Promise<GetGetContentTemplatesReturn> {
  return fetchCachedRpc<'get_content_templates', GetGetContentTemplatesReturn>(
    { p_category: category },
    {
      rpcName: 'get_content_templates',
      tags: ['templates', `templates-${category}`],
      ttlKey: 'cache.templates.ttl_seconds',
      keySuffix: category,
      useAuthClient: false,
      fallback: [],
      logMeta: { category },
    }
  );
}
