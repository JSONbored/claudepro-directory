import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
  supabaseAnon,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders, createDataApiContext, logInfo } from '@heyclaude/shared-runtime';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function toContentCategory(value: string | null): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

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
  const category =
    categoryParam && categoryParam !== 'all' ? categoryParam.trim().toLowerCase() : null;

  if (!SUPPORTED_TYPES.has(type)) {
    return badRequestResponse('Missing or invalid type. Valid types: rss, atom', CORS);
  }

  if (category && category !== 'changelog' && !toContentCategory(category)) {
    return badRequestResponse(
      `Invalid category parameter. Valid categories: changelog, ${CONTENT_CATEGORY_VALUES.join(', ')}, or omit for site-wide feed`,
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
    const logContext = createDataApiContext('feeds', {
      path: url.pathname,
      method: 'GET',
      app: 'public-api',
      resource: type,
    });
    logInfo('Feed delivery', {
      ...logContext,
      type,
      category: category ?? 'all',
      contentType: payload.contentType,
    });

    return new Response(payload.xml, {
      status: 200,
      headers: {
        ...buildSecurityHeaders(),
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
      const { data, error } = await supabaseAnon.rpc('generate_changelog_rss_feed', rpcArgs);
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
    const { data, error } = await supabaseAnon.rpc('generate_changelog_atom_feed', rpcArgs2);
    if (error || !data) {
      throw error ?? new Error('generate_changelog_atom_feed returned null');
    }
    return {
      xml: data,
      contentType: 'application/atom+xml; charset=utf-8',
      source: 'PostgreSQL changelog (atom)',
    };
  }

  const typedCategory = category && category !== 'changelog' ? toContentCategory(category) : null;

  if (type === 'rss') {
    const rpcArgs3 = {
      ...(typedCategory ? { p_category: typedCategory } : {}),
      p_limit: 50,
    } satisfies DatabaseGenerated['public']['Functions']['generate_content_rss_feed']['Args'];
    const { data, error } = await supabaseAnon.rpc('generate_content_rss_feed', rpcArgs3);
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
    ...(typedCategory ? { p_category: typedCategory } : {}),
    p_limit: 50,
  } satisfies DatabaseGenerated['public']['Functions']['generate_content_atom_feed']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_content_atom_feed', rpcArgs4);
  if (error || !data) {
    throw error ?? new Error('generate_content_atom_feed returned null');
  }
  return {
    xml: data,
    contentType: 'application/atom+xml; charset=utf-8',
    source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
  };
}
