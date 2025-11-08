/**
 * Markdown Export - Returns markdown content for any category/slug
 */

import { VALID_CONTENT_CATEGORIES } from '../_shared/constants/categories.ts';
import { getWithAcceptCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

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
      headers: getWithAcceptCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getWithAcceptCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const pathMatch = url.pathname.match(
      /(?:\/functions\/v1\/markdown-export)?\/([^/]+)\/([^/]+?)(?:\.md)?$/
    );

    if (!pathMatch) {
      return badRequestResponse(
        'Invalid path format. Expected: /{category}/{slug} or /{category}/{slug}.md',
        getWithAcceptCorsHeaders
      );
    }

    const [, category, slug] = pathMatch;

    if (!VALID_CONTENT_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category '${category}'. Valid categories: ${VALID_CONTENT_CATEGORIES.join(', ')}`,
        getWithAcceptCorsHeaders
      );
    }

    const includeMetadata = url.searchParams.get('includeMetadata') !== 'false';
    const includeFooter = url.searchParams.get('includeFooter') === 'true';

    const { data, error } = await supabaseAnon.rpc('generate_markdown_export', {
      p_category: category,
      p_slug: slug,
      p_include_metadata: includeMetadata,
      p_include_footer: includeFooter,
    });

    if (error) {
      console.error('RPC error (markdown-export):', error);
      return errorResponse(error, 'generate_markdown_export', getWithAcceptCorsHeaders);
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
            ...getWithAcceptCorsHeaders,
          },
        }
      );
    }

    const result = data as MarkdownExportResult;

    if (!(result.success && result.markdown)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to generate markdown',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getWithAcceptCorsHeaders,
          },
        }
      );
    }

    console.log('Markdown export generated:', {
      category,
      slug,
      bytes: result.markdown.length,
      filename: result.filename,
      content_id: result.content_id,
    });

    return new Response(result.markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `inline; filename="${result.filename}"`,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=3600',
        'X-Robots-Tag': 'index, follow',
        'X-Content-Type-Options': 'nosniff',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Content-Source': 'PostgreSQL generate_markdown_export',
        'X-Content-ID': result.content_id,
        ...getWithAcceptCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'markdown-export', getWithAcceptCorsHeaders);
  }
});
