import { VALID_CONTENT_CATEGORIES } from '../../_shared/config/constants/categories.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';

const CORS = getOnlyCorsHeaders;
const SUPPORTED_TYPES = new Set(['rss', 'atom']);

export async function handleFeedsRoute(
  segments: string[],
  url: URL,
  method: string
): Promise<Response> {
  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  if (segments.length > 0) {
    return jsonResponse(
      {
        error: 'Not Found',
        message: 'Feeds path does not accept nested segments',
      },
      404,
      CORS
    );
  }

  const type = (url.searchParams.get('type') || 'rss').toLowerCase();
  const categoryParam = url.searchParams.get('category');
  const category = categoryParam && categoryParam !== 'all' ? categoryParam.toLowerCase() : null;

  if (!SUPPORTED_TYPES.has(type)) {
    return badRequestResponse('Missing or invalid type. Valid types: rss, atom', CORS);
  }

  if (
    category &&
    category !== 'changelog' &&
    !VALID_CONTENT_CATEGORIES.includes(category as (typeof VALID_CONTENT_CATEGORIES)[number])
  ) {
    return badRequestResponse(
      `Invalid category parameter. Valid categories: changelog, ${VALID_CONTENT_CATEGORIES.join(', ')}, or omit for site-wide feed`,
      CORS
    );
  }

  const headers = {
    ...CORS,
    ...buildCacheHeaders('feeds'),
    'X-Robots-Tag': 'index, follow',
    'X-Generated-By': 'supabase.functions.feeds',
  };

  try {
    const payload = await generateFeedPayload(type, category);

    return new Response(payload.xml, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': payload.contentType,
        'X-Content-Source': payload.source,
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:feeds', CORS);
  }
}

async function generateFeedPayload(
  type: string,
  category: string | null
): Promise<{ xml: string; contentType: string; source: string }> {
  if (category === 'changelog') {
    if (type === 'rss') {
      const rpcArgs = {
        p_limit: 50,
      } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_rss_feed']['Args'];
      const { data, error } = await callRpc('generate_changelog_rss_feed', rpcArgs, true);
      if (error || !data) {
        throw error ?? new Error('generate_changelog_rss_feed returned null');
      }
      return {
        xml: data,
        contentType: 'application/rss+xml; charset=utf-8',
        source: 'PostgreSQL changelog (rss)',
      };
    }
    const rpcArgs2 = {
      p_limit: 50,
    } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_atom_feed']['Args'];
    const { data, error } = await callRpc('generate_changelog_atom_feed', rpcArgs2, true);
    if (error || !data) {
      throw error ?? new Error('generate_changelog_atom_feed returned null');
    }
    return {
      xml: data,
      contentType: 'application/atom+xml; charset=utf-8',
      source: 'PostgreSQL changelog (atom)',
    };
  }

  if (type === 'rss') {
    const rpcArgs3 = {
      p_category: category ?? undefined,
      p_limit: 50,
    } satisfies DatabaseGenerated['public']['Functions']['generate_content_rss_feed']['Args'];
    const { data, error } = await callRpc('generate_content_rss_feed', rpcArgs3, true);
    if (error || !data) {
      throw error ?? new Error('generate_content_rss_feed returned null');
    }
    return {
      xml: data,
      contentType: 'application/rss+xml; charset=utf-8',
      source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
    };
  }

  const rpcArgs4 = {
    p_category: category ?? undefined,
    p_limit: 50,
  } satisfies DatabaseGenerated['public']['Functions']['generate_content_atom_feed']['Args'];
  const { data, error } = await callRpc('generate_content_atom_feed', rpcArgs4, true);
  if (error || !data) {
    throw error ?? new Error('generate_content_atom_feed returned null');
  }
  return {
    xml: data,
    contentType: 'application/atom+xml; charset=utf-8',
    source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
  };
}
