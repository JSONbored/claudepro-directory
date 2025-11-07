/**
 * Markdown Export Edge Function - Database-First Architecture
 * Returns markdown content for any category/slug with JSON envelope for analytics.
 *
 * Supported Routes:
 * - /{category}/{slug}.md → Markdown export (rewritten from Next.js)
 * - Direct call: /functions/v1/markdown-export/{category}/{slug}
 *
 * Query Parameters:
 * - includeMetadata: boolean (default: true) - Add YAML frontmatter
 * - includeFooter: boolean (default: false) - Add attribution footer
 *
 * Response Format (JSON Envelope for analytics):
 * {
 *   "success": true,
 *   "markdown": "...",
 *   "filename": "slug.md",
 *   "content_id": "uuid",
 *   "length": 1234
 * }
 *
 * Performance:
 * - <50ms PostgreSQL RPC execution
 * - ~5-10KB response size per content item
 * - Singleton Supabase client for optimal connection reuse
 * - Aggressive caching (3600s max-age, 86400s stale-while-revalidate)
 *
 * Skills Category:
 * - Markdown export always available (this endpoint)
 * - ZIP downloads available via storage_url (separate button in UI)
 * - Users get BOTH options: quick markdown copy OR full packaged ZIP
 *
 * Replaces: src/lib/actions/markdown-actions.ts (77 lines)
 *
 * Environment Variables:
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_ANON_KEY     - Anonymous key for RPC calls
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
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
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

interface MarkdownExportResult {
  success: boolean;
  markdown?: string;
  filename?: string;
  length?: number;
  content_id?: string;
  error?: string;
}

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
    // Parse path: handles both direct (/category/slug) and Supabase Functions routing (/functions/v1/markdown-export/category/slug)
    const url = new URL(req.url);
    const pathMatch = url.pathname.match(
      /(?:\/functions\/v1\/markdown-export)?\/([^/]+)\/([^/]+?)(?:\.md)?$/
    );

    if (!pathMatch) {
      return badRequestResponse(
        'Invalid path format. Expected: /{category}/{slug} or /{category}/{slug}.md',
        getCorsHeaders
      );
    }

    const [, category, slug] = pathMatch;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        getCorsHeaders
      );
    }

    // Parse query parameters
    const includeMetadata = url.searchParams.get('includeMetadata') !== 'false'; // default true
    const includeFooter = url.searchParams.get('includeFooter') === 'true'; // default false

    // Call RPC function to generate markdown
    const { data, error } = await supabase.rpc('generate_markdown_export', {
      p_category: category,
      p_slug: slug,
      p_include_metadata: includeMetadata,
      p_include_footer: includeFooter,
    });

    if (error) {
      console.error('RPC error (markdown-export):', error);
      return errorResponse(error, 'generate_markdown_export', getCorsHeaders);
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Content not found',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders,
          },
        }
      );
    }

    // Cast to expected type (RPC returns JSONB)
    const result = data as MarkdownExportResult;

    if (!result.success || !result.markdown) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to generate markdown',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders,
          },
        }
      );
    }

    console.log('Markdown export generated:', {
      category,
      slug,
      contentLength: result.markdown.length,
      filename: result.filename,
      content_id: result.content_id,
    });

    // Return raw markdown content as text/markdown
    // Direct download/copy - no JSON wrapper needed
    return new Response(result.markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `inline; filename="${result.filename}"`,
        'Content-Length': result.markdown.length.toString(),
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=3600',
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': 'PostgreSQL generate_markdown_export',
        'X-Content-ID': result.content_id,
        ...getCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'markdown-export', getCorsHeaders);
  }
});
