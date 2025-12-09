/**
 * Category Configs API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Cached helper function to fetch category configs.
 */
async function getCachedCategoryConfigs() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  return service.getCategoryConfigs();
}

export async function GET(_request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'CategoryConfigsAPI',
    route: '/api/content/category-configs',
    method: 'GET',
  });

  try {
    reqLogger.info('Category configs request received');

    const data = await getCachedCategoryConfigs();

    reqLogger.info('Category configs retrieved', {
      count: Array.isArray(data) ? data.length : 'unknown',
    });

    return jsonResponse(data, 200, CORS, {
      'X-Generated-By': 'supabase.rpc.get_category_configs_with_features',
      ...buildCacheHeaders('config'),
    });
  } catch (error) {
    reqLogger.error('Category configs API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/content/category-configs',
      operation: 'CategoryConfigsAPI',
      method: 'GET',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS,
    },
  });
}
