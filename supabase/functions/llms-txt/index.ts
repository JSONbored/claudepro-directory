/**
 * LLMs.txt - Unified router for all llms.txt patterns
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
    const slug = url.searchParams.get('slug');
    const tool = url.searchParams.get('tool');

    // Route to appropriate RPC function based on type parameter
    let content: string | null = null;

    switch (type) {
      case 'sitewide': {
        const { data, error } = await supabaseAnon.rpc('generate_sitewide_llms_txt');
        if (error) {
          console.error('RPC error (sitewide):', error);
          return errorResponse(error, 'generate_sitewide_llms_txt', getOnlyCorsHeaders);
        }
        content = data;
        break;
      }

      case 'category': {
        if (!category) {
          return badRequestResponse('Missing required parameter: category', getOnlyCorsHeaders);
        }
        if (!VALID_CONTENT_CATEGORIES.includes(category)) {
          return badRequestResponse(`Invalid category: ${category}`, getOnlyCorsHeaders);
        }

        const { data, error } = await supabaseAnon.rpc('generate_category_llms_txt', {
          p_category: category,
        });
        if (error) {
          console.error('RPC error (category):', error);
          return errorResponse(error, 'generate_category_llms_txt', getOnlyCorsHeaders);
        }
        content = data;
        break;
      }

      case 'item': {
        if (!(category && slug)) {
          return badRequestResponse(
            'Missing required parameters: category and slug',
            getOnlyCorsHeaders
          );
        }
        if (!VALID_CONTENT_CATEGORIES.includes(category)) {
          return badRequestResponse(`Invalid category: ${category}`, getOnlyCorsHeaders);
        }

        const { data, error } = await supabaseAnon.rpc('generate_item_llms_txt', {
          p_category: category,
          p_slug: slug,
        });

        if (error) {
          console.error('RPC error (item):', error);
          return errorResponse(error, 'generate_item_llms_txt', getOnlyCorsHeaders);
        }

        if (!data) {
          return new Response('Content not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
              'CDN-Cache-Control': 'max-age=3600',
              ...getOnlyCorsHeaders,
            },
          });
        }

        content = data;
        break;
      }

      case 'changelog-index': {
        const { data, error } = await supabaseAnon.rpc('generate_changelog_llms_txt');
        if (error) {
          console.error('RPC error (changelog-index):', error);
          return errorResponse(error, 'generate_changelog_llms_txt', getOnlyCorsHeaders);
        }
        content = data;
        break;
      }

      case 'changelog-entry': {
        if (!slug) {
          return badRequestResponse('Missing required parameter: slug', getOnlyCorsHeaders);
        }

        const { data, error } = await supabaseAnon.rpc('generate_changelog_entry_llms_txt', {
          p_slug: slug,
        });
        if (error) {
          console.error('RPC error (changelog-entry):', error);
          return errorResponse(error, 'generate_changelog_entry_llms_txt', getOnlyCorsHeaders);
        }
        if (!data) {
          return new Response('Changelog entry not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
              'CDN-Cache-Control': 'max-age=3600',
              ...getOnlyCorsHeaders,
            },
          });
        }
        content = data;
        break;
      }

      case 'tool': {
        if (!tool) {
          return badRequestResponse('Missing required parameter: tool', getOnlyCorsHeaders);
        }
        if (tool !== 'config-recommender') {
          return badRequestResponse(`Invalid tool: ${tool}`, getOnlyCorsHeaders);
        }

        const { data, error } = await supabaseAnon.rpc('generate_tool_llms_txt', {
          p_tool_name: tool,
        });
        if (error) {
          console.error('RPC error (tool):', error);
          return errorResponse(error, 'generate_tool_llms_txt', getOnlyCorsHeaders);
        }
        content = data;
        break;
      }

      default:
        return badRequestResponse(
          'Missing or invalid type parameter. Valid types: sitewide, category, item, changelog-index, changelog-entry, tool',
          getOnlyCorsHeaders
        );
    }

    if (!content) {
      return new Response('Content not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'max-age=3600',
          ...getOnlyCorsHeaders,
        },
      });
    }

    console.log('llms.txt generated:', {
      type,
      category: category || 'N/A',
      slug: slug || 'N/A',
      tool: tool || 'N/A',
      bytes: content.length,
    });

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'max-age=3600',
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Window': '3600',
        ...getOnlyCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'llms-txt', getOnlyCorsHeaders);
  }
});
