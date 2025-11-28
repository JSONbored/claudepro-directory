import 'server-only';

import { normalizeError } from '@heyclaude/shared-runtime';
import { generateRequestId, logger, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  jsonResponse,
  getWithAuthCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
} from '@heyclaude/web-runtime/server';
import type { NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'SearchFacetsAPI',
    route: '/api/search/facets',
    method: 'GET',
  });

  reqLogger.info('Facets request received');

  const supabase = createSupabaseAnonClient();

  try {
    const { data, error } = await supabase.rpc('get_search_facets');

    if (error) {
      const normalized = normalizeError(error, 'Facets RPC failed');
      reqLogger.error('Facets RPC failed', normalized);
      return createErrorResponse(error, {
        route: '/api/search/facets',
        operation: 'get_search_facets',
        method: 'GET',
        logContext: {
          requestId,
        },
      });
    }

    interface FacetRow {
      category: string | null;
      content_count: number | null;
      all_tags?: readonly string[] | null;
      authors?: readonly string[] | null;
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
      logContext: {
        requestId,
      },
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}
