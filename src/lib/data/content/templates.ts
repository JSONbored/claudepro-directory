/**
 * Templates Data Layer - Database-First Architecture
 * Uses get_content_templates() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';

export interface Template {
  id: string;
  type: string;
  name: string;
  description: string;
  category?: string;
  tags?: string;
  [key: string]: unknown;
}

/**
 * Get content templates for a specific category via edge-cached RPC
 */
export async function getContentTemplates(category: string): Promise<Template[]> {
  return fetchCachedRpc<Template[]>(
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
