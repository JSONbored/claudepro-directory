/**
 * Templates Data Layer - Database-First Architecture
 * Uses get_content_templates() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetContentTemplatesReturn } from '@/src/types/database-overrides';

/**
 * Template type alias for backward compatibility
 * @deprecated Use GetContentTemplatesReturn[number] instead
 */
export type Template = GetContentTemplatesReturn[number];

/**
 * Get content templates for a specific category via edge-cached RPC
 */
export async function getContentTemplates(category: string): Promise<GetContentTemplatesReturn> {
  return fetchCachedRpc<GetContentTemplatesReturn>(
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
