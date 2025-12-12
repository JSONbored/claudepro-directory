import 'server-only';
import { SearchService } from '@heyclaude/data-layer';
import { createErrorResponse, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getWithAuthCorsHeaders,
  handleOptionsRequest,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { type NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;

/**
 * Cached helper function to fetch search facets.
 * Uses Cache Components to reduce function invocations.
 * Database RPC returns frontend-ready data (no client-side mapping needed).
 *
 * Cache configuration: Uses 'static' profile (1 day stale, 6hr revalidate, 30 days expire)
 * defined in next.config.mjs. Search facets are public data that changes infrequently.
 *
 * @returns {Promise<unknown[]>} Array of formatted search facet objects from the database RPC
 */
async function getCachedSearchFacetsFormatted() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire (defined in next.config.mjs)

  const supabase = createSupabaseAnonClient();
  const service = new SearchService(supabase);
  return await service.getSearchFacetsFormatted();
}

export async function GET(_request: NextRequest) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'SearchFacetsAPI',
    route: '/api/search/facets',
  });

  reqLogger.info({}, 'Facets request received');

  try {
    // Database RPC returns frontend-ready data (no client-side mapping needed)
    // This eliminates CPU-intensive array mapping and filtering (5-10% CPU savings)
    let data: Awaited<ReturnType<typeof getCachedSearchFacetsFormatted>> | null = null;
    try {
      data = await getCachedSearchFacetsFormatted();
    } catch (error) {
      const normalized = normalizeError(error, 'Facets RPC failed');
      reqLogger.error({ err: normalized }, 'Facets RPC failed');
      return createErrorResponse(normalized, {
        logContext: { facetType: 'all' },
        method: 'GET',
        operation: 'get_search_facets_formatted',
        route: '/api/search/facets',
      });
    }

    // RPC returns array of { category, content_count, tags, authors } - use directly
    const facets = Array.isArray(data) ? data : [];

    return jsonResponse(
      {
        facets,
      },
      200,
      {
        ...CORS,
        ...buildCacheHeaders('search_facets'),
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Facets handler failed');
    reqLogger.error({ err: normalized }, 'Facets handler failed');
    return createErrorResponse(normalized, {
      logContext: {},
      method: 'GET',
      operation: 'GET',
      route: '/api/search/facets',
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}
