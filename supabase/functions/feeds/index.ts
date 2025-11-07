/**
 * Unified Feeds Edge Function - Database-First Architecture
 * Generates RSS 2.0 and Atom 1.0 feeds for changelog and all content categories.
 *
 * Supported Routes:
 * - /changelog/rss.xml → changelog RSS feed
 * - /changelog/atom.xml → changelog Atom feed
 * - /rss.xml → site-wide content RSS feed
 * - /atom.xml → site-wide content Atom feed
 * - /{category}/rss.xml → category-specific RSS feed (mcp, agents, rules, etc.)
 * - /{category}/atom.xml → category-specific Atom feed
 *
 * Performance:
 * - <5ms PostgreSQL XML generation
 * - ~50KB response size per feed
 * - Singleton Supabase client for optimal connection reuse
 * - Direct TEXT return (zero JSONB parsing overhead)
 *
 * Environment Variables:
 *   SUPABASE_URL             - Supabase project URL
 *   SUPABASE_ANON_KEY        - Anonymous key for RPC calls
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  errorResponse,
  methodNotAllowedResponse,
  badRequestResponse,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

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

// Valid content categories matching database category_configs
const VALID_CATEGORIES = [
  'agents',
  'commands',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
  'collections',
  'guides',
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
    const type = url.searchParams.get('type'); // 'rss' or 'atom'
    const category = url.searchParams.get('category'); // null = site-wide, 'changelog', or content category

    // Validate type parameter
    if (!type || !['rss', 'atom'].includes(type)) {
      return badRequestResponse(
        'Missing or invalid type parameter. Valid types: rss, atom',
        getCorsHeaders
      );
    }

    // Validate category parameter if provided
    if (category && category !== 'changelog' && !VALID_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category parameter. Valid categories: changelog, ${VALID_CATEGORIES.join(', ')}, or omit for site-wide feed`,
        getCorsHeaders
      );
    }

    let xmlContent: string | null = null;
    let contentType: string;
    let feedType: string;
    let contentSource: string;

    // Route to appropriate RPC function based on category and type
    if (category === 'changelog') {
      // Changelog feeds
      if (type === 'rss') {
        const { data, error } = await supabase.rpc('generate_changelog_rss_feed', {
          p_limit: 50,
        });
        if (error) {
          console.error('RPC error (changelog rss):', error);
          return errorResponse(error, 'generate_changelog_rss_feed', getCorsHeaders);
        }
        xmlContent = data;
        contentSource = 'PostgreSQL changelog_entries';
      } else {
        const { data, error } = await supabase.rpc('generate_changelog_atom_feed', {
          p_limit: 50,
        });
        if (error) {
          console.error('RPC error (changelog atom):', error);
          return errorResponse(error, 'generate_changelog_atom_feed', getCorsHeaders);
        }
        xmlContent = data;
        contentSource = 'PostgreSQL changelog_entries';
      }
    } else {
      // Content feeds (site-wide or category-specific)
      if (type === 'rss') {
        const { data, error } = await supabase.rpc('generate_content_rss_feed', {
          p_category: category || null, // null = site-wide
          p_limit: 50,
        });
        if (error) {
          console.error('RPC error (content rss):', error);
          return errorResponse(error, 'generate_content_rss_feed', getCorsHeaders);
        }
        xmlContent = data;
        contentSource = category
          ? `PostgreSQL content (${category})`
          : 'PostgreSQL content (all categories)';
      } else {
        const { data, error } = await supabase.rpc('generate_content_atom_feed', {
          p_category: category || null, // null = site-wide
          p_limit: 50,
        });
        if (error) {
          console.error('RPC error (content atom):', error);
          return errorResponse(error, 'generate_content_atom_feed', getCorsHeaders);
        }
        xmlContent = data;
        contentSource = category
          ? `PostgreSQL content (${category})`
          : 'PostgreSQL content (all categories)';
      }
    }

    if (!xmlContent) {
      console.error('Empty feed returned from database');
      return new Response('Internal server error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          ...getCorsHeaders,
        },
      });
    }

    contentType = type === 'rss'
      ? 'application/rss+xml; charset=utf-8'
      : 'application/atom+xml; charset=utf-8';
    feedType = type;

    console.log(`${category || 'site-wide'} ${feedType} feed generated:`, {
      contentLength: xmlContent.length,
      entryCount: (xmlContent.match(/<(item|entry)>/g) || []).length,
    });

    return new Response(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': xmlContent.length.toString(),
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        'X-Robots-Tag': 'index, follow',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': contentSource,
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'feeds', getCorsHeaders);
  }
});
