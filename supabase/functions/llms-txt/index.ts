/**
 * LLMs.txt Edge Function - Unified Router
 * Single edge function handling all llms.txt patterns via query parameters
 *
 * Performance optimizations:
 * - Singleton Supabase client (reused across requests)
 * - Direct TEXT return from RPC functions (no JSONB parsing)
 * - Single RPC call per request
 * - Minimal egress (pre-formatted output from database)
 * - Rate limiting headers for API consumers
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY');
}

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_CATEGORIES = [
  'agents',
  'commands',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
  'collections',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getCorsHeaders);
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
        // /llms.txt - Site-wide index
        const { data, error } = await supabase.rpc('generate_sitewide_llms_txt');
        if (error) {
          console.error('RPC error (sitewide):', error);
          return errorResponse(error, 'generate_sitewide_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      case 'category': {
        // /[category]/llms.txt - Category listing
        if (!category) {
          return badRequestResponse('Missing required parameter: category', getCorsHeaders);
        }
        if (!VALID_CATEGORIES.includes(category)) {
          return badRequestResponse(`Invalid category: ${category}`, getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_category_llms_txt', {
          p_category: category,
        });
        if (error) {
          console.error('RPC error (category):', error);
          return errorResponse(error, 'generate_category_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      case 'item': {
        // /[category]/[slug]/llms.txt - Individual item (returns pre-formatted TEXT)
        if (!category || !slug) {
          return badRequestResponse(
            'Missing required parameters: category and slug',
            getCorsHeaders
          );
        }
        if (!VALID_CATEGORIES.includes(category)) {
          return badRequestResponse(`Invalid category: ${category}`, getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_item_llms_txt', {
          p_category: category,
          p_slug: slug,
        });

        if (error) {
          console.error('RPC error (item):', error);
          return errorResponse(error, 'generate_item_llms_txt', getCorsHeaders);
        }

        if (!data) {
          return new Response('Content not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store, must-revalidate',
              ...getCorsHeaders,
            },
          });
        }

        content = data;
        break;
      }

      case 'changelog-index': {
        // /changelog/llms.txt - Changelog index
        const { data, error } = await supabase.rpc('generate_changelog_llms_txt');
        if (error) {
          console.error('RPC error (changelog-index):', error);
          return errorResponse(error, 'generate_changelog_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      case 'changelog-entry': {
        // /changelog/[slug]/llms.txt - Individual changelog entry
        if (!slug) {
          return badRequestResponse('Missing required parameter: slug', getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_changelog_entry_llms_txt', {
          p_slug: slug,
        });
        if (error) {
          console.error('RPC error (changelog-entry):', error);
          return errorResponse(error, 'generate_changelog_entry_llms_txt', getCorsHeaders);
        }
        if (!data) {
          return new Response('Changelog entry not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store, must-revalidate',
              ...getCorsHeaders,
            },
          });
        }
        content = data;
        break;
      }

      case 'tool': {
        // /tools/[tool]/llms.txt - Tool documentation
        if (!tool) {
          return badRequestResponse('Missing required parameter: tool', getCorsHeaders);
        }
        if (tool !== 'config-recommender') {
          return badRequestResponse(`Invalid tool: ${tool}`, getCorsHeaders);
        }

        const { data, error } = await supabase.rpc('generate_tool_llms_txt', {
          p_tool_name: tool,
        });
        if (error) {
          console.error('RPC error (tool):', error);
          return errorResponse(error, 'generate_tool_llms_txt', getCorsHeaders);
        }
        content = data;
        break;
      }

      default:
        return badRequestResponse(
          'Missing or invalid type parameter. Valid types: sitewide, category, item, changelog-index, changelog-entry, tool',
          getCorsHeaders
        );
    }

    if (!content) {
      return new Response('Content not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
          ...getCorsHeaders,
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
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'llms-txt', getCorsHeaders);
  }
});
