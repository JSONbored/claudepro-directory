import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import { VALID_CONTENT_CATEGORIES } from '../../_shared/config/constants/categories.ts';
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

  if (category && category !== 'changelog' && !VALID_CONTENT_CATEGORIES.includes(category)) {
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
      const { data, error } = await supabaseAnon.rpc('generate_changelog_rss_feed', {
        p_limit: 50,
      });
      if (error || !data) {
        throw error ?? new Error('generate_changelog_rss_feed returned null');
      }
      return {
        xml: data,
        contentType: 'application/rss+xml; charset=utf-8',
        source: 'PostgreSQL changelog (rss)',
      };
    }
    const { data, error } = await supabaseAnon.rpc('generate_changelog_atom_feed', {
      p_limit: 50,
    });
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
    const { data, error } = await supabaseAnon.rpc('generate_content_rss_feed', {
      p_category: category,
      p_limit: 50,
    });
    if (error || !data) {
      throw error ?? new Error('generate_content_rss_feed returned null');
    }
    return {
      xml: data,
      contentType: 'application/rss+xml; charset=utf-8',
      source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
    };
  }

  const { data, error } = await supabaseAnon.rpc('generate_content_atom_feed', {
    p_category: category,
    p_limit: 50,
  });
  if (error || !data) {
    throw error ?? new Error('generate_content_atom_feed returned null');
  }
  return {
    xml: data,
    contentType: 'application/atom+xml; charset=utf-8',
    source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
  };
}
