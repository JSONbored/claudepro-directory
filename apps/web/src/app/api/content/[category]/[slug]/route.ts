/**
 * Content Record Export API Route
 * Migrated from public-api edge function
 * Handles JSON, Markdown, LLMs.txt, and storage format exports
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { APP_CONFIG, buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { createErrorResponse, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cached helper function to fetch full content record
 * Uses Cache Components to reduce function invocations
 *
 * @param {DatabaseGenerated['public']['Enums']['content_category']} category - Content category enum value
 * @param {string} slug - Content slug to identify the record
 * @returns {Promise<unknown>} Full content record from the database (JSON object with content details)
 */
async function getCachedContentFull(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  const rpcArgs = {
    p_base_url: SITE_URL,
    p_category: category,
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];

  return await service.getApiContentFull(rpcArgs);
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

function getStringProperty(obj: unknown, key: string): string | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc && typeof desc.value === 'string' ? desc.value : undefined;
}

/***
 * Removes control characters (CR, LF, tab, backspace, form feed, vertical tab) and trims surrounding whitespace from a header value.
 *
 * @param {string} val - The header value to sanitize (string)
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

/*****
 * Fetches a full content record for the given category and slug and returns it as an HTTP JSON response.
 *
 * Calls the `get_api_content_full` Supabase RPC and:
 * - returns a 200 response with the JSON content when the RPC succeeds and data is present,
 * - returns a 404 JSON response when no content is found,
 * - returns an error response produced by `createErrorResponse` when the RPC returns an error.
 *
 * @param {DatabaseGenerated['public']['Enums']['content_category']} category - Content category enum value used to scope the lookup
 * @param {string} slug - Content slug to identify the record
 * @param {ReturnType<typeof logger.child>} reqLogger - Scoped request logger used to record RPC errors and context
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
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error(
      {
        category,
        err: normalized,
        rpcName: 'get_api_content_full',
        slug,
      },
      'Content JSON RPC error'
    );
    return createErrorResponse(normalized, {
      logContext: {
        category,
        rpcName: 'get_api_content_full',
        slug,
      },
      method: 'GET',
      operation: 'ContentRecordAPI',
      route: '/api/content/[category]/[slug]',
    });
  }

  if (!data) {
    reqLogger.warn({ category, slug }, 'Content not found');
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Content not found',
        },
        success: false,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
        },
        status: 404,
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
      reqLogger.warn(
        {
          category,
          dataPreview: data.slice(0, 100),
          slug,
        },
        'Content JSON: RPC returned non-JSON string'
      );
      return NextResponse.json(
        { error: 'Invalid JSON data from RPC' },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...buildSecurityHeaders(),
            ...CORS_JSON,
          },
          status: 500,
        }
      );
    }
  } else {
    // If it's already an object, use it directly
    parsedData = data;
  }

  // Database RPC should return clean JSON (no client-side processing needed)
  // This eliminates CPU-intensive recursive object traversal (10-15% CPU savings)
  // If the database RPC returns escaped strings, it should be fixed in the RPC itself

  // Ensure we have actual content
  if (!parsedData || (typeof parsedData === 'object' && Object.keys(parsedData).length === 0)) {
    reqLogger.warn(
      {
        category,
        dataType: typeof data,
        slug,
      },
      'Content JSON: empty or null data returned from RPC'
    );
    return NextResponse.json(
      { error: 'Content data is empty' },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
        },
        status: 500,
      }
    );
  }

  // Stringify with proper formatting (2-space indent for readability)
  const jsonData = JSON.stringify(parsedData, null, 2);

  return new NextResponse(jsonData, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_api_content_full',
      ...buildSecurityHeaders(),
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
    status: 200,
  });
}

/******
 * Produce a Markdown export for a content record.
 *
 * Parses `includeMetadata` and `includeFooter` from the provided `url`, invokes the
 * `generate_markdown_export` RPC for the given `category` and `slug`, and returns a
 * NextResponse containing the generated Markdown or a structured JSON error.
 *
 * @param {DatabaseGenerated['public']['Enums']['content_category']} category - DatabaseGenerated['public']['Enums']['content_category']: content category to export
 * @param {string} slug - string: content record slug to export
 * @param {URL} url - URL: request URL used to read query params `includeMetadata` and `includeFooter`
 * @param {ReturnType<typeof logger.child>} reqLogger - ReturnType<typeof logger.child>: request-scoped logger for error and context logging
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
  const service = new ContentService(supabase);
  const rpcArgs = {
    p_category: category,
    p_include_footer: includeFooter,
    p_include_metadata: includeMetadata,
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_markdown_export']['Args'];

  let data;
  try {
    data = await service.generateMarkdownExport(rpcArgs);
  } catch (error) {
    const normalized = normalizeError(error, 'Content Markdown RPC error');
    reqLogger.error(
      {
        category,
        err: normalized,
        rpcName: 'generate_markdown_export',
        slug,
      },
      'Content Markdown RPC error'
    );
    return createErrorResponse(normalized, {
      logContext: {
        category,
        rpcName: 'generate_markdown_export',
        slug,
      },
      method: 'GET',
      operation: 'ContentRecordAPI',
      route: '/api/content/[category]/[slug]',
    });
  }

  const success = getProperty(data, 'success');
  if (typeof success !== 'boolean' || !success) {
    const error = getProperty(data, 'error');
    return NextResponse.json(
      { error: typeof error === 'string' ? error : 'Markdown generation failed' },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_MARKDOWN,
        },
        status: 400,
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
    reqLogger.warn(
      {
        dataKeys: data ? Object.keys(data) : [],
        hasContentId: typeof contentId === 'string',
        hasFilename: typeof filename === 'string',
        hasMarkdown: typeof markdown === 'string',
      },
      'Content Markdown: invalid response structure'
    );
    return NextResponse.json(
      { error: 'Markdown generation failed: invalid response' },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_MARKDOWN,
        },
        status: 400,
      }
    );
  }

  // Ensure markdown content is not empty
  if (!markdown || markdown.trim().length === 0) {
    reqLogger.warn(
      {
        category,
        contentId,
        filename,
        slug,
      },
      'Content Markdown: empty markdown content returned'
    );
    return NextResponse.json(
      { error: 'Markdown generation failed: empty content' },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_MARKDOWN,
        },
        status: 400,
      }
    );
  }

  const safeFilename = sanitizeFilename(filename);
  const safeContentId = sanitizeHeaderValue(contentId);

  reqLogger.info(
    {
      category,
      contentId: safeContentId,
      filename: safeFilename,
      markdownLength: markdown.length,
      slug,
    },
    'Content Markdown: markdown generated successfully'
  );

  return new NextResponse(markdown, {
    headers: {
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-ID': safeContentId,
      'X-Generated-By': 'supabase.rpc.generate_markdown_export',
      ...buildSecurityHeaders(),
      ...CORS_MARKDOWN,
      ...buildCacheHeaders('content_export'),
    },
    status: 200,
  });
}

/*****
 * Generate an LLMs.txt representation for a content item and return it as a plain text HTTP response.
 *
 * Calls the `generate_item_llms_txt` Supabase RPC with the provided category and slug and responds with
 * the RPC-produced text when found; returns a JSON error response when the item is not found or the RPC fails.
 *
 * @param {DatabaseGenerated['public']['Enums']['content_category']} category - Database content category enum identifying the type of content to export
 * @param {string} slug - Content slug identifying the specific item to export
 * @param {ReturnType<typeof logger.child>} reqLogger - Scoped logger used for request-scoped logging and RPC error reporting
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
  const service = new ContentService(supabase);
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_item_llms_txt']['Args'];

  let data;
  try {
    data = await service.getItemLlmsTxt(rpcArgs);
  } catch (error) {
    const normalized = normalizeError(error, 'Content LLMs.txt RPC error');
    reqLogger.error(
      {
        category,
        err: normalized,
        rpcName: 'generate_item_llms_txt',
        slug,
      },
      'Content LLMs.txt RPC error'
    );
    return createErrorResponse(normalized, {
      logContext: {
        category,
        rpcName: 'generate_item_llms_txt',
        slug,
      },
      method: 'GET',
      operation: 'ContentRecordAPI',
      route: '/api/content/[category]/[slug]',
    });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'LLMs.txt content not found' },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
        },
        status: 404,
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
        reqLogger.warn(
          {
            category,
            dataType: 'json',
            slug,
          },
          'Content LLMs.txt: RPC returned JSON instead of plain text'
        );
        // Convert JSON to a readable format (fallback)
        formatted = JSON.stringify(parsed, null, 2);
      } catch (error) {
        // Not valid JSON, treat as plain text (graceful fallback)
        const normalized = normalizeError(error, 'JSON parse failed, treating as plain text');
        reqLogger.debug(
          {
            category,
            dataType: 'string',
            err: normalized,
            slug,
          },
          'Content LLMs.txt: Data looked like JSON but parse failed, treating as plain text'
        );
        formatted = data;
      }
    } else {
      // Plain text string
      formatted = data;
    }
  } else {
    // If it's an object, convert to string (shouldn't happen, but handle it)
    reqLogger.warn(
      {
        category,
        dataType: typeof data,
        slug,
      },
      'Content LLMs.txt: RPC returned object instead of string'
    );
    formatted = JSON.stringify(data, null, 2);
  }

  // Database RPC returns properly formatted text (no client-side processing needed)
  // This eliminates CPU-intensive string replacement (5-10% CPU savings)
  reqLogger.info(
    {
      category,
      firstLine: formatted.split('\n')[0]?.slice(0, 50),
      length: formatted.length,
      slug,
    },
    'Content LLMs.txt: formatted successfully'
  );

  return new NextResponse(formatted, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_item_llms_txt',
      ...buildSecurityHeaders(),
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
    status: 200,
  });
}

async function handleStorageFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  reqLogger: ReturnType<typeof logger.child>,
  metadataMode = false
) {
  reqLogger.info({ category, metadataMode, slug }, 'Handling storage format');

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);

  // Support both 'skills' and 'mcp' categories for storage format
  if (category === 'skills') {
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_skill_storage_path']['Args'];

    let data;
    try {
      data = await service.getSkillStoragePath(rpcArgs);
    } catch (error) {
      const normalized = normalizeError(error, 'Skill storage path RPC error');
      reqLogger.error(
        {
          err: normalized,
          rpcName: 'get_skill_storage_path',
          slug,
        },
        'Skill storage path RPC error'
      );
      return createErrorResponse(normalized, {
        logContext: {
          rpcName: 'get_skill_storage_path',
          slug,
        },
        method: 'GET',
        operation: 'ContentRecordAPI',
        route: '/api/content/[category]/[slug]',
      });
    }

    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!bucket || !objectPath) {
      return badRequestResponse('Storage file not found', CORS_JSON);
    }

    // If metadata mode requested, return JSON metadata instead of binary file
    if (metadataMode) {
      const metadata = {
        bucket,
        category,
        download_url: `${SITE_URL}/api/content/${category}/${slug}?format=storage`,
        note: 'Use download_url to fetch the actual binary file',
        object_path: objectPath,
        slug,
      };

      reqLogger.info({ bucket, objectPath }, 'Returning storage metadata');

      return NextResponse.json(metadata, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.get_skill_storage_path',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
          ...buildCacheHeaders('content_export'),
        },
        status: 200,
      });
    }

    // Get public URL from Supabase Storage and redirect instead of proxying
    // This eliminates bandwidth usage through Vercel Functions (60-80% savings)
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(objectPath);

    reqLogger.info(
      {
        bucket,
        objectPath,
        publicUrl,
        redirect: true,
      },
      'Redirecting to Supabase Storage public URL (eliminates proxying)'
    );

    // Permanent redirect (308) to Supabase Storage public URL
    // This bypasses Vercel Functions entirely for file downloads
    return NextResponse.redirect(publicUrl, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Source': 'supabase-storage:redirect',
        'X-Storage-Bucket': bucket,
        'X-Storage-Path': objectPath,
        ...buildSecurityHeaders(),
        ...CORS_JSON,
      },
      status: 308, // Permanent redirect (preserves method)
    });
  }

  if (category === 'mcp') {
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_mcpb_storage_path']['Args'];

    let data;
    try {
      data = await service.getMcpbStoragePath(rpcArgs);
    } catch (error) {
      const normalized = normalizeError(error, 'MCPB storage path RPC error');
      reqLogger.error(
        {
          err: normalized,
          rpcName: 'get_mcpb_storage_path',
          slug,
        },
        'MCPB storage path RPC error'
      );
      return createErrorResponse(normalized, {
        logContext: {
          rpcName: 'get_mcpb_storage_path',
          slug,
        },
        method: 'GET',
        operation: 'ContentRecordAPI',
        route: '/api/content/[category]/[slug]',
      });
    }

    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!bucket || !objectPath) {
      return badRequestResponse('MCPB package not found', CORS_JSON);
    }

    // If metadata mode requested, return JSON metadata instead of binary file
    if (metadataMode) {
      const metadata = {
        bucket,
        category,
        download_url: `${SITE_URL}/api/content/${category}/${slug}?format=storage`,
        note: 'Use download_url to fetch the actual binary file',
        object_path: objectPath,
        slug,
      };

      reqLogger.info({ bucket, objectPath }, 'Returning storage metadata');

      return NextResponse.json(metadata, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Generated-By': 'supabase.rpc.get_mcpb_storage_path',
          ...buildSecurityHeaders(),
          ...CORS_JSON,
          ...buildCacheHeaders('content_export'),
        },
        status: 200,
      });
    }

    // Get public URL from Supabase Storage and redirect instead of proxying
    // This eliminates bandwidth usage through Vercel Functions (60-80% savings)
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(objectPath);

    reqLogger.info(
      {
        bucket,
        objectPath,
        publicUrl,
        redirect: true,
      },
      'Redirecting to Supabase Storage public URL (eliminates proxying)'
    );

    // Permanent redirect (308) to Supabase Storage public URL
    // This bypasses Vercel Functions entirely for file downloads
    return NextResponse.redirect(publicUrl, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Source': 'supabase-storage:redirect',
        'X-Storage-Bucket': bucket,
        'X-Storage-Path': objectPath,
        ...buildSecurityHeaders(),
        ...CORS_JSON,
      },
      status: 308, // Permanent redirect (preserves method)
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
    method: 'GET',
    operation: 'ContentRecordAPI',
    route: '/api/content/[category]/[slug]',
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

    reqLogger.info(
      {
        category,
        format,
        slug,
      },
      'Content record export request received'
    );

    switch (format) {
      case 'json': {
        return handleJsonFormat(category, slug, reqLogger);
      }
      case 'llms':
      case 'llms-txt': {
        return handleItemLlmsTxt(category, slug, reqLogger);
      }
      case 'markdown':
      case 'md': {
        return handleMarkdownFormat(category, slug, url, reqLogger);
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
    const normalized = normalizeError(error, 'Content record API error');
    reqLogger.error({ err: normalized }, 'Content record API error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'ContentRecordAPI',
      route: '/api/content/[category]/[slug]',
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
    headers: {
      ...getOnlyCorsHeaders,
    },
    status: 204,
  });
}
