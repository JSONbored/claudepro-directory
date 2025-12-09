import 'server-only';
import { normalizeError } from '@heyclaude/shared-runtime';
import { logger, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  jsonResponse,
  getWithAuthCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { type NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;

/**
 * Cached helper function to fetch search facets
 * Uses Cache Components to reduce function invocations
 */
async function getCachedSearchFacets() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.rpc('get_search_facets');
  if (error) throw error;
  return data;
}

export async function GET(_request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'SearchFacetsAPI',
    route: '/api/search/facets',
    method: 'GET',
  });

  reqLogger.info('Facets request received');

  try {
    let data: Awaited<ReturnType<typeof getCachedSearchFacets>> | null = null;
    try {
      data = await getCachedSearchFacets();
    } catch (error) {
      const normalized = normalizeError(error, 'Facets RPC failed');
      reqLogger.error('Facets RPC failed', normalized);
      return createErrorResponse(error, {
        route: '/api/search/facets',
        operation: 'get_search_facets',
        method: 'GET',
        logContext: {},
      });
    }

    interface FacetRow {
      all_tags?: null | readonly string[];
      authors?: null | readonly string[];
      category: null | string;
      content_count: null | number;
    }
    const rows: FacetRow[] = Array.isArray(data) ? (data as FacetRow[]) : [];
    const facets = rows.map((item) => ({
      category: item.category ?? 'unknown',
      contentCount: Number(item.content_count ?? 0),
      tags: Array.isArray(item.all_tags)
        ? item.all_tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      authors: Array.isArray(item.authors)
        ? item.authors.filter((author): author is string => typeof author === 'string')
        : [],
    }));

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
    reqLogger.error('Facets handler failed', normalized);
    return createErrorResponse(error, {
      route: '/api/search/facets',
      operation: 'GET',
      method: 'GET',
      logContext: {},
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}
