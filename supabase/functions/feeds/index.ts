/**
 * Unified Feeds - RSS/Atom feeds for changelog and content categories
 */

import { VALID_CONTENT_CATEGORIES } from '../_shared/constants/categories.ts';
import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getOnlyCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getOnlyCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');

    if (!(type && ['rss', 'atom'].includes(type))) {
      return badRequestResponse(
        'Missing or invalid type parameter. Valid types: rss, atom',
        getOnlyCorsHeaders
      );
    }

    if (category && category !== 'changelog' && !VALID_CONTENT_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category parameter. Valid categories: changelog, ${VALID_CONTENT_CATEGORIES.join(', ')}, or omit for site-wide feed`,
        getOnlyCorsHeaders
      );
    }

    let xmlContent: string | null = null;
    let contentSource: string;

    if (category === 'changelog') {
      if (type === 'rss') {
        const { data, error } = await supabaseAnon.rpc('generate_changelog_rss_feed', {
          p_limit: 50,
        });
        if (error) {
          console.error('RPC error (changelog rss):', error);
          return errorResponse(error, 'generate_changelog_rss_feed', getOnlyCorsHeaders);
        }
        xmlContent = data;
        contentSource = 'PostgreSQL changelog_entries';
      } else {
        const { data, error } = await supabaseAnon.rpc('generate_changelog_atom_feed', {
          p_limit: 50,
        });
        if (error) {
          console.error('RPC error (changelog atom):', error);
          return errorResponse(error, 'generate_changelog_atom_feed', getOnlyCorsHeaders);
        }
        xmlContent = data;
        contentSource = 'PostgreSQL changelog_entries';
      }
    } else if (type === 'rss') {
      const { data, error } = await supabaseAnon.rpc('generate_content_rss_feed', {
        p_category: category || null,
        p_limit: 50,
      });
      if (error) {
        console.error('RPC error (content rss):', error);
        return errorResponse(error, 'generate_content_rss_feed', getOnlyCorsHeaders);
      }
      xmlContent = data;
      contentSource = category
        ? `PostgreSQL content (${category})`
        : 'PostgreSQL content (all categories)';
    } else {
      const { data, error } = await supabaseAnon.rpc('generate_content_atom_feed', {
        p_category: category || null,
        p_limit: 50,
      });
      if (error) {
        console.error('RPC error (content atom):', error);
        return errorResponse(error, 'generate_content_atom_feed', getOnlyCorsHeaders);
      }
      xmlContent = data;
      contentSource = category
        ? `PostgreSQL content (${category})`
        : 'PostgreSQL content (all categories)';
    }

    if (!xmlContent) {
      console.error('Empty feed returned from database');
      return new Response('Internal server error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          ...getOnlyCorsHeaders,
        },
      });
    }

    const contentType =
      type === 'rss' ? 'application/rss+xml; charset=utf-8' : 'application/atom+xml; charset=utf-8';

    console.log(`${category || 'site-wide'} ${type} feed generated:`, {
      bytes: xmlContent.length,
      entryCount: (xmlContent.match(/<(item|entry)>/g) || []).length,
    });

    return new Response(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        'CDN-Cache-Control': 'max-age=600',
        'X-Robots-Tag': 'index, follow',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': contentSource,
        ...getOnlyCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'feeds', getOnlyCorsHeaders);
  }
});
