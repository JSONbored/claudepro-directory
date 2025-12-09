/**
 * Content Record Export API Route
 * Migrated from public-api edge function
 * Handles JSON, Markdown, LLMs.txt, and storage format exports
 */

import 'server-only';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { APP_CONFIG, buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
  buildCacheHeaders,
  proxyStorageFile,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cached helper function to fetch full content record
 * Uses Cache Components to reduce function invocations
 * @param category
 * @param slug
 */
async function getCachedContentFull(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_base_url: SITE_URL,
  } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];

  const { data, error } = await supabase.rpc('get_api_content_full', rpcArgs);
  if (error) throw error;
  return data;
}

const CORS_JSON = getOnlyCorsHeaders;
const CORS_MARKDOWN = getWithAcceptCorsHeaders;
const SITE_URL = APP_CONFIG.url;

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  for (const validValue of CONTENT_CATEGORY_VALUES) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
}

function getProperty(obj: unknown, key: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc?.value;
}

/**
 * Removes control characters (CR, LF, tab, backspace, form feed, vertical tab) and trims surrounding whitespace from a header value.
 *
 * @param val - The header value to sanitize (string)
 * @returns The sanitized header value (string) with control characters removed and trimmed
 */
function sanitizeHeaderValue(val: string): string {
  return val.replaceAll(/[\r\n\t\b\f\v]/g, '').trim();
}

/**
 * Sanitizes a filename by removing control characters, double quotes, backslashes, and trimming surrounding whitespace.
 *
 * @param {string} name - The input filename to sanitize.
 * @returns {string} A safe filename; returns `export.md` if the sanitized result is empty.
 */
function sanitizeFilename(name: string): string {
  let cleaned = name
    .replaceAll(/[\r\n\t\b\f\v]/g, '')
    .replaceAll(/["\\]/g, '')
    .trim();
  if (!cleaned) {
    cleaned = 'export.md';
  }
  return cleaned;
}

/**
 * Fetches a full content record for the given category and slug and returns it as an HTTP JSON response.
 *
 * Calls the `get_api_content_full` Supabase RPC and:
 * - returns a 200 response with the JSON content when the RPC succeeds and data is present,
 * - returns a 404 JSON response when no content is found,
 * - returns an error response produced by `createErrorResponse` when the RPC returns an error.
 *
 * @param category - Content category enum value used to scope the lookup
 * @param slug - Content slug to identify the record
 * @param reqLogger - Scoped request logger used to record RPC errors and context
 * @returns A NextResponse containing the exported JSON content on success, a 404 JSON response if not found, or an error response created from RPC errors
 * @see {@link createErrorResponse}
 * @see {@link get_api_content_full}
 */
async function handleJsonFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  reqLogger: ReturnType<typeof logger.child>
) {
  let data: Awaited<ReturnType<typeof getCachedContentFull>> | null = null;
  try {
    data = await getCachedContentFull(category, slug);
  } catch (error) {
    reqLogger.error('Content JSON RPC error', normalizeError(error), {
      rpcName: 'get_api_content_full',
      category,
      slug,
    });
    return createErrorResponse(error, {
      route: '/api/content/[category]/[slug]',
      operation: 'ContentRecordAPI',
      method: 'GET',
      logContext: {
        rpcName: 'get_api_content_full',
        category,
        slug,
      },
    });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Content not found' },
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
        },
      }
    );
  }

  // Handle different return types from get_api_content_full
  // The RPC can return JSONB (which might be a string) or a JSON object
  let parsedData: unknown;
  if (typeof data === 'string') {
    // If it's already a JSON string, parse it
    try {
      parsedData = JSON.parse(data);
    } catch {
      // If parsing fails, treat it as raw text and wrap it
      reqLogger.warn('Content JSON: RPC returned non-JSON string', {
        category,
        slug,
        dataPreview: data.slice(0, 100),
      });
      return NextResponse.json(
        { error: 'Invalid JSON data from RPC' },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...buildSecurityHeaders(),
            ...CORS_JSON,
          },
        }
      );
    }
  } else {
    // If it's already an object, use it directly
    parsedData = data;
  }

  // Deep clean the data to fix escaped newlines and formatting issues
  // Recursively process the object to unescape newlines in string values
  const cleanData = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      // Replace escaped newlines with actual newlines
      // Handle both \\n (double-escaped) and \n (single-escaped)
      return obj
        .replaceAll(String.raw`\n`, '\n')
        .replaceAll(String.raw`\t`, '\t')
        .replaceAll(String.raw`\r`, '\r');
    }
    if (Array.isArray(obj)) {
      return obj.map(cleanData);
    }
    if (obj !== null && typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = cleanData(value);
      }
      return cleaned;
    }
    return obj;
  };

  const cleanedData = cleanData(parsedData);

  // Ensure we have actual content
  if (!cleanedData || (typeof cleanedData === 'object' && Object.keys(cleanedData).length === 0)) {
    reqLogger.warn('Content JSON: empty or null data returned from RPC', {
      category,
      slug,
      dataType: typeof data,
    });
    return NextResponse.json(
      { error: 'Content data is empty' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
        },
      }
    );
  }

  // Stringify with proper formatting (2-space indent for readability)
  const jsonData = JSON.stringify(cleanedData, null, 2);

  return new NextResponse(jsonData, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_api_content_full',
      ...buildSecurityHeaders(),
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
  });
}

/**
 * Produce a Markdown export for a content record.
 *
 * Parses `includeMetadata` and `includeFooter` from the provided `url`, invokes the
 * `generate_markdown_export` RPC for the given `category` and `slug`, and returns a
 * NextResponse containing the generated Markdown or a structured JSON error.
 *
 * @param category - DatabaseGenerated['public']['Enums']['content_category']: content category to export
 * @param slug - string: content record slug to export
 * @param url - URL: request URL used to read query params `includeMetadata` and `includeFooter`
 * @param reqLogger - ReturnType<typeof logger.child>: request-scoped logger for error and context logging
 * @returns A NextResponse containing the Markdown payload on success (status 200) or a JSON error payload on failure (status 400)
 *
 * @see generate_markdown_export RPC
 * @see sanitizeFilename
 * @see sanitizeHeaderValue
 */
async function handleMarkdownFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  url: URL,
  reqLogger: ReturnType<typeof logger.child>
) {
  const includeMetadata = url.searchParams.get('includeMetadata') !== 'false';
  const includeFooter = url.searchParams.get('includeFooter') === 'true';

  const supabase = createSupabaseAnonClient();
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_include_metadata: includeMetadata,
    p_include_footer: includeFooter,
  } satisfies DatabaseGenerated['public']['Functions']['generate_markdown_export']['Args'];

  const { data, error } = await supabase.rpc('generate_markdown_export', rpcArgs);

  if (error) {
    reqLogger.error('Content Markdown RPC error', normalizeError(error), {
      rpcName: 'generate_markdown_export',
      category,
      slug,
    });
    return createErrorResponse(error, {
      route: '/api/content/[category]/[slug]',
      operation: 'ContentRecordAPI',
      method: 'GET',
      logContext: {
        rpcName: 'generate_markdown_export',
        category,
        slug,
      },
    });
  }

  const success = getProperty(data, 'success');
  if (typeof success !== 'boolean' || !success) {
    const error = getProperty(data, 'error');
    return NextResponse.json(
      { error: typeof error === 'string' ? error : 'Markdown generation failed' },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_MARKDOWN,
        },
      }
    );
  }

  const markdown = getProperty(data, 'markdown');
  const filename = getProperty(data, 'filename');
  const contentId = getProperty(data, 'content_id');

  if (
    typeof markdown !== 'string' ||
    typeof filename !== 'string' ||
    typeof contentId !== 'string'
  ) {
    reqLogger.warn('Content Markdown: invalid response structure', {
      hasMarkdown: typeof markdown === 'string',
      hasFilename: typeof filename === 'string',
      hasContentId: typeof contentId === 'string',
      dataKeys: data ? Object.keys(data) : [],
    });
    return NextResponse.json(
      { error: 'Markdown generation failed: invalid response' },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_MARKDOWN,
        },
      }
    );
  }

  // Ensure markdown content is not empty
  if (!markdown || markdown.trim().length === 0) {
    reqLogger.warn('Content Markdown: empty markdown content returned', {
      category,
      slug,
      filename,
      contentId,
    });
    return NextResponse.json(
      { error: 'Markdown generation failed: empty content' },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_MARKDOWN,
        },
      }
    );
  }

  const safeFilename = sanitizeFilename(filename);
  const safeContentId = sanitizeHeaderValue(contentId);

  reqLogger.info('Content Markdown: markdown generated successfully', {
    category,
    slug,
    filename: safeFilename,
    contentId: safeContentId,
    markdownLength: markdown.length,
  });

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'X-Generated-By': 'supabase.rpc.generate_markdown_export',
      'X-Content-ID': safeContentId,
      ...buildSecurityHeaders(),
      ...CORS_MARKDOWN,
      ...buildCacheHeaders('content_export'),
    },
  });
}

/**
 * Generate an LLMs.txt representation for a content item and return it as a plain text HTTP response.
 *
 * Calls the `generate_item_llms_txt` Supabase RPC with the provided category and slug and responds with
 * the RPC-produced text when found; returns a JSON error response when the item is not found or the RPC fails.
 *
 * @param category - Database content category enum identifying the type of content to export
 * @param slug - Content slug identifying the specific item to export
 * @param reqLogger - Scoped logger used for request-scoped logging and RPC error reporting
 * @returns A NextResponse containing the LLMs.txt content as `text/plain; charset=utf-8` with appropriate security and cache headers on success, or a JSON error response (status 4xx/5xx) on RPC errors or when content is not found
 *
 * @see generate_item_llms_txt (Supabase RPC)
 * @see createErrorResponse
 * @see buildSecurityHeaders
 */
async function handleItemLlmsTxt(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  reqLogger: ReturnType<typeof logger.child>
) {
  const supabase = createSupabaseAnonClient();
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_item_llms_txt']['Args'];

  const { data, error } = await supabase.rpc('generate_item_llms_txt', rpcArgs);

  if (error) {
    reqLogger.error('Content LLMs.txt RPC error', normalizeError(error), {
      rpcName: 'generate_item_llms_txt',
      category,
      slug,
    });
    return createErrorResponse(error, {
      route: '/api/content/[category]/[slug]',
      operation: 'ContentRecordAPI',
      method: 'GET',
      logContext: {
        rpcName: 'generate_item_llms_txt',
        category,
        slug,
      },
    });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'LLMs.txt content not found' },
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
        },
      }
    );
  }

  // Handle different return types - RPC might return JSON or plain text
  let formatted: string;
  if (typeof data === 'string') {
    // If it's a string, check if it's JSON
    if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
      try {
        // It's JSON - this shouldn't happen, but handle it gracefully
        const parsed = JSON.parse(data);
        reqLogger.warn('Content LLMs.txt: RPC returned JSON instead of plain text', {
          category,
          slug,
          dataType: 'json',
        });
        // Convert JSON to a readable format (fallback)
        formatted = JSON.stringify(parsed, null, 2);
      } catch {
        // Not valid JSON, treat as plain text
        formatted = data;
      }
    } else {
      // Plain text string
      formatted = data;
    }
  } else {
    // If it's an object, convert to string (shouldn't happen, but handle it)
    reqLogger.warn('Content LLMs.txt: RPC returned object instead of string', {
      category,
      slug,
      dataType: typeof data,
    });
    formatted = JSON.stringify(data, null, 2);
  }

  // Replace escaped newlines with actual newlines
  // Handle both \\n (double-escaped) and \n (single-escaped in string literals)
  formatted = formatted
    .replaceAll(String.raw`\n`, '\n')
    .replaceAll(String.raw`\t`, '\t')
    .replaceAll(String.raw`\r`, '\r');

  reqLogger.info('Content LLMs.txt: formatted successfully', {
    category,
    slug,
    length: formatted.length,
    firstLine: formatted.split('\n')[0]?.slice(0, 50),
  });

  return new NextResponse(formatted, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_item_llms_txt',
      ...buildSecurityHeaders(),
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleStorageFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  reqLogger: ReturnType<typeof logger.child>,
  metadataMode = false
) {
  reqLogger.info('Handling storage format', { category, slug, metadataMode });

  const supabase = createSupabaseAnonClient();

  // Support both 'skills' and 'mcp' categories for storage format
  if (category === 'skills') {
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_skill_storage_path']['Args'];
    const { data, error } = await supabase.rpc('get_skill_storage_path', rpcArgs);

    if (error) {
      reqLogger.error('Skill storage path RPC error', normalizeError(error), {
        rpcName: 'get_skill_storage_path',
        slug,
      });
      return createErrorResponse(error, {
        route: '/api/content/[category]/[slug]',
        operation: 'ContentRecordAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_skill_storage_path',
          slug,
        },
      });
    }

    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      return desc && typeof desc.value === 'string' ? desc.value : undefined;
    };

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!bucket || !objectPath) {
      return badRequestResponse('Storage file not found', CORS_JSON);
    }

    // If metadata mode requested, return JSON metadata instead of binary file
    if (metadataMode) {
      const metadata = {
        bucket,
        object_path: objectPath,
        category,
        slug,
        download_url: `${SITE_URL}/api/content/${category}/${slug}?format=storage`,
        note: 'Use download_url to fetch the actual binary file',
      };

      reqLogger.info('Returning storage metadata', { bucket, objectPath });

      return NextResponse.json(metadata, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.get_skill_storage_path',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
          ...buildCacheHeaders('content_export'),
        },
      });
    }

    return proxyStorageFile({
      bucket,
      path: objectPath,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  }

  if (category === 'mcp') {
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_mcpb_storage_path']['Args'];
    const { data, error } = await supabase.rpc('get_mcpb_storage_path', rpcArgs);

    if (error) {
      reqLogger.error('MCPB storage path RPC error', normalizeError(error), {
        rpcName: 'get_mcpb_storage_path',
        slug,
      });
      return createErrorResponse(error, {
        route: '/api/content/[category]/[slug]',
        operation: 'ContentRecordAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_mcpb_storage_path',
          slug,
        },
      });
    }

    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      return desc && typeof desc.value === 'string' ? desc.value : undefined;
    };

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!bucket || !objectPath) {
      return badRequestResponse('MCPB package not found', CORS_JSON);
    }

    // If metadata mode requested, return JSON metadata instead of binary file
    if (metadataMode) {
      const metadata = {
        bucket,
        object_path: objectPath,
        category,
        slug,
        download_url: `${SITE_URL}/api/content/${category}/${slug}?format=storage`,
        note: 'Use download_url to fetch the actual binary file',
      };

      reqLogger.info('Returning storage metadata', { bucket, objectPath });

      return NextResponse.json(metadata, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.get_mcpb_storage_path',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
          ...buildCacheHeaders('content_export'),
        },
      });
    }

    return proxyStorageFile({
      bucket,
      path: objectPath,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  }

  return badRequestResponse(
    `Storage format not supported for category '${category}'. Supported categories: skills, mcp`,
    CORS_JSON
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const reqLogger = logger.child({
    operation: 'ContentRecordAPI',
    route: '/api/content/[category]/[slug]',
    method: 'GET',
  });

  try {
    const { category, slug } = await params;
    const url = new URL(request.url);

    if (!isValidContentCategory(category)) {
      return badRequestResponse(
        `Invalid category '${category}'. Valid categories: ${CONTENT_CATEGORY_VALUES.join(', ')}`,
        CORS_JSON
      );
    }

    const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

    reqLogger.info('Content record export request received', {
      category,
      slug,
      format,
    });

    switch (format) {
      case 'json': {
        return handleJsonFormat(category, slug, reqLogger);
      }
      case 'markdown':
      case 'md': {
        return handleMarkdownFormat(category, slug, url, reqLogger);
      }
      case 'llms':
      case 'llms-txt': {
        return handleItemLlmsTxt(category, slug, reqLogger);
      }
      case 'storage': {
        // Check if metadata mode is requested (for MCP resources)
        const metadataMode = url.searchParams.get('metadata') === 'true';
        return handleStorageFormat(category, slug, reqLogger, metadataMode);
      }
      default: {
        return badRequestResponse(
          'Invalid format. Valid formats: json, markdown, llms-txt, storage',
          CORS_JSON
        );
      }
    }
  } catch (error) {
    reqLogger.error('Content record API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/content/[category]/[slug]',
      operation: 'ContentRecordAPI',
      method: 'GET',
    });
  }
}

/**
 * Handle CORS preflight requests by returning a 204 No Content response with CORS headers.
 *
 * @returns {NextResponse} A 204 No Content response configured with the `getOnlyCorsHeaders` CORS headers.
 * @see getOnlyCorsHeaders
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
