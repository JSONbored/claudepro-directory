/**
 * Templates Data Layer - Database-First Architecture
 * Uses get_content_templates() RPC with edge-layer caching
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';

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
  try {
    const data = await cachedRPCWithDedupe<Template[]>(
      'get_content_templates',
      { p_category: category },
      {
        tags: ['templates', `templates-${category}`],
        ttlConfigKey: 'cache.templates.ttl_seconds',
        keySuffix: category,
        useAuthClient: false, // Public data
      }
    );

    return data || [];
  } catch (error) {
    logger.error(
      'Error in getContentTemplates',
      error instanceof Error ? error : new Error(String(error)),
      { category }
    );
    return [];
  }
}
