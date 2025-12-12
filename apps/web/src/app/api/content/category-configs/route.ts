/**
 * Category Configs API Route
 * 
 * Returns category configuration data including features, metadata, and display settings.
 * Used by the frontend to render category-specific UI and determine available features.
 * 
 * @example
 * ```ts
 * // Request
 * GET /api/content/category-configs
 * 
 * // Response (200)
 * [
 *   {
 *     "category": "skills",
 *     "display_name": "Skills",
 *     "features": ["search", "filter", "bookmark"],
 *     "metadata": { ... }
 *   }
 * ]
 * ```
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { createApiRoute, createApiOptionsHandler } from '@heyclaude/web-runtime/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/**
 * Cached helper function to fetch category configs.
 * Uses Cache Components to reduce function invocations.
 *
 * @returns {Promise<unknown>} Category configs with features from the database RPC
 */
async function getCachedCategoryConfigs() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return service.getCategoryConfigs();
}

/**
 * GET /api/content/category-configs - Get category configurations
 * 
 * Returns category configuration data including features, metadata, and display settings.
 * Used by the frontend to render category-specific UI and determine available features.
 */
export const GET = createApiRoute({
  route: '/api/content/category-configs',
  operation: 'CategoryConfigsAPI',
  method: 'GET',
  cors: 'anon',
  openapi: {
    summary: 'Get category configurations',
    description: 'Returns category configuration data including features, metadata, and display settings. Used by the frontend to render category-specific UI and determine available features.',
    tags: ['content', 'categories', 'config'],
    operationId: 'getCategoryConfigs',
    responses: {
      200: {
        description: 'Category configurations retrieved successfully',
      },
    },
  },
  handler: async ({ logger }) => {
    logger.info({}, 'Category configs request received');

    const data = await getCachedCategoryConfigs();

    logger.info(
      {
        count: Array.isArray(data) ? data.length : 'unknown',
      },
      'Category configs retrieved'
    );

    return jsonResponse(data, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'supabase.rpc.get_category_configs_with_features',
      ...buildCacheHeaders('config'),
    });
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
