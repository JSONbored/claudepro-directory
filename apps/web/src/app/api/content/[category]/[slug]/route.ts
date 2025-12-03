/**
 * Content Record Export API Route
 * Migrated from public-api edge function
 * Handles JSON, Markdown, LLMs.txt, and storage format exports
 */

import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { APP_CONFIG, buildSecurityHeaders } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
  buildCacheHeaders,
  proxyStorageFile,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

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

function sanitizeHeaderValue(val: string): string {
  return val.replaceAll(/[\r\n\t\b\f\v]/g, '').trim();
}

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
 * Fetches full content for a category and slug from Supabase and returns it as a JSON HTTP response.
 *
 * Calls the `get_api_content_full` RPC with the provided category and slug; on success returns a 200
 * JSON response containing the RPC result (stringifying non-string payloads). If the RPC returns
 * no data a 404 JSON response is returned. If the RPC call fails, a structured error response is
 * returned and the error is logged.
 *
 * @param category - The content category to query (one of the `content_category` enum values)
 * @param slug - The content item slug to fetch
 * @param reqLogger - A scoped logger for recording RPC errors and request context
 * @returns A Promise that resolves to a NextResponse representing either the JSON payload (200),
 *          a 404 not-found JSON response, or a structured error response produced by
 *          createErrorResponse when the RPC fails
 *
 * @see createSupabaseAnonClient
 * @see createErrorResponse
 * @see buildSecurityHeaders
 * @see buildCacheHeaders
 */
async function handleJsonFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  reqLogger: ReturnType<typeof logger.child>
) {
  const supabase = createSupabaseAnonClient();
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_base_url: SITE_URL,
  } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];

  const { data, error } = await supabase.rpc('get_api_content_full', rpcArgs);

  if (error) {
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

  const jsonData: string = typeof data === 'string' ? data : JSON.stringify(data);
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
 * Generate and return a Markdown export for a content record.
 *
 * Reads `includeMetadata` and `includeFooter` from the request URL, invokes the
 * `generate_markdown_export` database RPC, validates the RPC response, and
 * returns a NextResponse containing the rendered Markdown or a JSON error
 * response with an appropriate HTTP status.
 *
 * @param category - Content category (must be a valid content_category enum)
 * @param slug - Content slug identifier
 * @param url - Parsed request URL (used to read query parameters)
 * @param reqLogger - Scoped logger for request-scoped logging
 * @returns A NextResponse containing the exported Markdown on success; a JSON NextResponse with an error message and an appropriate HTTP status on failure
 *
 * @see createSupabaseAnonClient
 * @see DatabaseGenerated.public.Functions.generate_markdown_export
 * @see sanitizeFilename
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

  const safeFilename = sanitizeFilename(filename);
  const safeContentId = sanitizeHeaderValue(contentId);

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
 * Generate the LLMs.txt output for a content item and return it as a plain-text HTTP response.
 *
 * Queries the `generate_item_llms_txt` Supabase RPC for the given content category and slug.
 * On RPC error returns a structured error response; if the RPC returns no data returns a 404 JSON response.
 *
 * @param category - The content category (from DatabaseGenerated.public.Enums.content_category)
 * @param slug - The content item's slug identifier
 * @param reqLogger - A scoped logger instance for request-scoped logging
 * @returns A NextResponse containing the LLMs.txt content as `text/plain` with appropriate security, CORS, and cache headers,
 *          or a JSON NextResponse with an error and appropriate status (e.g., 404 or RPC-derived error response).
 *
 * @see generate_item_llms_txt RPC
 * @see createSupabaseAnonClient
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

  const dataString = typeof data === 'string' ? data : String(data);
  const formatted: string = dataString.replaceAll(String.raw`\n`, '\n');

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
  reqLogger: ReturnType<typeof logger.child>
) {
  reqLogger.info('Proxying storage file', { category, slug });

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

    if (!(bucket && objectPath)) {
      return badRequestResponse('Storage file not found', CORS_JSON);
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

    if (!(bucket && objectPath)) {
      return badRequestResponse('MCPB package not found', CORS_JSON);
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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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
        return handleStorageFormat(category, slug, reqLogger);
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

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}