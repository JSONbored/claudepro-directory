import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { SITE_URL, supabaseAnon } from '@heyclaude/edge-runtime';

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Determine whether a string is one of the allowed content category enum values.
 *
 * @param value - The candidate category string to validate
 * @returns `true` if `value` equals one of the allowed content category enum values, `false` otherwise
 */
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  // Validate without type assertion
  for (const validValue of CONTENT_CATEGORY_VALUES) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
}

import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
  initRequestLogging,
  proxyStorageFile,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders, createDataApiContext, logger } from '@heyclaude/shared-runtime';

const CORS_JSON = getOnlyCorsHeaders;
const CORS_MARKDOWN = getWithAcceptCorsHeaders;

/**
 * Handle a request to export a content record in one of several formats (JSON, Markdown, LLMs text, or proxied storage).
 *
 * @param category - Content category identifier (validated against known content categories)
 * @param slug - Content slug identifying the specific record to export
 * @param url - Full request URL; query parameters (e.g., `format`, `includeMetadata`, `includeFooter`) control export behavior
 * @returns A Response containing the exported content with appropriate headers, or a 400/ error Response describing validation or RPC failures
 */
export async function handleRecordExport(
  category: string,
  slug: string,
  url: URL
): Promise<Response> {
  const logContext = createDataApiContext('content-record', {
    path: url.pathname,
    method: 'GET',
    app: 'public-api',
    category,
    slug,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Content record export request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'content-record-export',
    category,
    slug,
  });
  
  // Validate category is valid ENUM value (for all formats)
  // Database will also validate, but we check early for better error messages
  if (!isValidContentCategory(category)) {
    return badRequestResponse(
      `Invalid category '${category}'. Valid categories: ${CONTENT_CATEGORY_VALUES.join(', ')}`,
      CORS_JSON
    );
  }

  // Type guard has narrowed category to ENUM - database will validate
  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  
  // Update bindings with format
  logger.setBindings({
    format,
  });
  traceStep(`Processing record export (format: ${format})`, logContext);

  switch (format) {
    case 'json':
      return handleJsonFormat(category, slug, logContext);
    case 'markdown':
    case 'md':
      return handleMarkdownFormat(category, slug, url, logContext);
    case 'llms':
    case 'llms-txt':
      return handleItemLlmsTxt(category, slug, logContext);
    case 'storage':
      return handleStorageFormat(category, slug, logContext);
    default:
      return badRequestResponse(
        'Invalid format. Valid formats: json, markdown, llms-txt, storage',
        CORS_JSON
      );
  }
}

/**
 * Fetches the full content for a given category and slug and returns it as a JSON HTTP response.
 *
 * If the underlying RPC reports an error the function returns an error response; if the RPC returns no data it returns a 400 bad request response.
 *
 * @param category - The validated content category value used by the RPC
 * @param slug - The content slug identifying the item to fetch
 * @param logContext - Request context used for tracing and error reporting
 * @returns A Response containing the content as a JSON string and appropriate headers; status 200 on success, 400 for missing content or RPC errors
 */
async function handleJsonFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  logContext: ReturnType<typeof createDataApiContext>
): Promise<Response> {
  traceStep('Fetching JSON format content', logContext);
  
  // Category is already validated ENUM - database will validate
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_base_url: SITE_URL,
  } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];
  const { data, error } = await supabaseAnon.rpc('get_api_content_full', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:get_api_content_full', CORS_JSON, {
      ...logContext,
      dbQuery: {
        rpcName: 'get_api_content_full',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    });
  }

  if (!data) {
    return badRequestResponse('Content not found', CORS_JSON);
  }

  // RPC returns JSON string - ensure it's properly typed as string for Response body
  const jsonData: string = typeof data === 'string' ? data : JSON.stringify(data);
  traceRequestComplete(logContext);
  return new Response(jsonData, {
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
 * Generate a markdown export for the specified content record.
 *
 * Reads `includeMetadata` (defaults to `true`) and `includeFooter` (`'true'` to include) from `url.searchParams`,
 * calls the `generate_markdown_export` RPC, validates the RPC response, and returns the markdown with appropriate
 * content-disposition, content-id, security, CORS, and caching headers.
 *
 * @param url - URL whose search parameters control export options (`includeMetadata`, `includeFooter`)
 * @returns A Response with the exported Markdown as the body and headers:
 *          `Content-Type: text/markdown; charset=utf-8`, `Content-Disposition` with a sanitized filename,
 *          `X-Content-ID`, `X-Generated-By`, plus security, CORS, and cache headers. Error conditions produce
 *          bad-request or RPC error responses.
async function handleMarkdownFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  url: URL,
  logContext: ReturnType<typeof createDataApiContext>
): Promise<Response> {
  traceStep('Generating markdown format content', logContext);
  
  const includeMetadata = url.searchParams.get('includeMetadata') !== 'false';
  const includeFooter = url.searchParams.get('includeFooter') === 'true';

  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_include_metadata: includeMetadata,
    p_include_footer: includeFooter,
  } satisfies DatabaseGenerated['public']['Functions']['generate_markdown_export']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_markdown_export', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:generate_markdown_export', CORS_MARKDOWN, {
      ...logContext,
      dbQuery: {
        rpcName: 'generate_markdown_export',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    });
  }

  if (!data) {
    return badRequestResponse('Markdown generation failed: RPC returned null', CORS_MARKDOWN);
  }

  // Validate data structure without type assertion
  if (typeof data !== 'object' || data === null || !('success' in data)) {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  // Safely extract properties
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const success = getProperty(data, 'success');
  if (typeof success !== 'boolean') {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  if (!success) {
    // Failure case
    const error = getProperty(data, 'error');
    if (typeof error !== 'string') {
      return badRequestResponse('Markdown generation failed: invalid error', CORS_MARKDOWN);
    }
    return badRequestResponse(error, CORS_MARKDOWN);
  }

  // Success case - validate required fields
  const markdown = getProperty(data, 'markdown');
  const filename = getProperty(data, 'filename');
  const contentId = getProperty(data, 'content_id');

  if (
    typeof markdown !== 'string' ||
    typeof filename !== 'string' ||
    typeof contentId !== 'string'
  ) {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  const result = {
    success: true,
    markdown,
    filename,
    content_id: contentId,
  };

  // Sanitize header values to prevent injection
  const sanitizeHeaderValue = (val: string): string => {
    // Remove CR/LF and other control characters
    return val.replace(/[\r\n\t\b\f\v]/g, '').trim();
  };

  const sanitizeFilename = (name: string): string => {
    // Remove CR/LF, replace disallowed chars, ensure non-empty
    let cleaned = name
      .replace(/[\r\n\t\b\f\v]/g, '')
      .replace(/["\\]/g, '') // Remove quotes and backslashes
      .trim();

    if (!cleaned) {
      cleaned = 'export.md';
    }
    return cleaned;
  };

  const safeFilename = sanitizeFilename(result.filename);
  const safeContentId = sanitizeHeaderValue(result.content_id);

  // TypeScript narrows to success case - all fields are properly typed
  traceRequestComplete(logContext);
  return new Response(result.markdown, {
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
 * Generate LLMs.txt content for a content item and return it as a plain-text HTTP response.
 *
 * @param category - The content category enum value for the requested item
 * @param slug - The content item's slug identifier
 * @param logContext - Request tracing/logging context created by createDataApiContext
 * @returns A `Response` whose body is the LLMs.txt content (plain text) with status 200 on success; response headers include `Content-Type: text/plain`, `X-Generated-By`, security headers, CORS headers, and cache headers. 
 */
async function handleItemLlmsTxt(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  logContext: ReturnType<typeof createDataApiContext>
): Promise<Response> {
  traceStep('Generating LLMs.txt format content', logContext);
  
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_item_llms_txt']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_item_llms_txt', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:generate_item_llms_txt', CORS_JSON, {
      ...logContext,
      dbQuery: {
        rpcName: 'generate_item_llms_txt',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    });
  }

  if (!data) {
    return badRequestResponse('LLMs.txt content not found', CORS_JSON);
  }

  // Ensure data is a string for Response body
  const dataString = typeof data === 'string' ? data : String(data);
  const formatted: string = dataString.replace(/\\n/g, '\n');
  traceRequestComplete(logContext);
  return new Response(formatted, {
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

/**
 * Proxies a stored file for the given content category and slug, returning a streaming response for the file or an error response.
 *
 * @param category - Content category to resolve; supports `'skills'` and `'mcp'` for storage lookups
 * @param slug - The content slug used to resolve the storage path
 * @param logContext - Request logging context used for tracing and error reporting
 * @returns A Response that streams the proxied storage file with long‑term caching headers on success, or a bad request / error Response when the storage path cannot be resolved or an RPC call fails
 */
async function handleStorageFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  logContext: ReturnType<typeof createDataApiContext>
): Promise<Response> {
  traceStep(`Proxying storage file (category: ${category})`, logContext);
  
  // Support both 'skills' and 'mcp' categories for storage format
  if (category === 'skills') {
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_skill_storage_path']['Args'];
    const { data, error } = await supabaseAnon.rpc('get_skill_storage_path', rpcArgs);

    if (error) {
      // Use dbQuery serializer for consistent database query formatting
      return await errorResponse(error, 'data-api:get_skill_storage_path', CORS_JSON, {
        ...logContext,
        dbQuery: {
          rpcName: 'get_skill_storage_path',
          args: rpcArgs, // Will be redacted by Pino's redact config
        },
      });
    }

    // Validate data structure without type assertion
    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    // Safely extract properties
    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      if (desc && typeof desc.value === 'string') {
        return desc.value;
      }
      return undefined;
    };

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!(bucket && objectPath)) {
      return badRequestResponse('Storage file not found', CORS_JSON);
    }

    const typedLocation = { bucket, object_path: objectPath };

    traceRequestComplete(logContext);
    return proxyStorageFile({
      bucket: typedLocation.bucket,
      path: typedLocation.object_path,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  }

  if (category === 'mcp') {
    // get_mcpb_storage_path RPC function (uses generated types from @heyclaude/database-types)
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_mcpb_storage_path']['Args'];
    const { data, error } = await supabaseAnon.rpc('get_mcpb_storage_path', rpcArgs);

    if (error) {
      // Use dbQuery serializer for consistent database query formatting
      return await errorResponse(error, 'data-api:get_mcpb_storage_path', CORS_JSON, {
        ...logContext,
        dbQuery: {
          rpcName: 'get_mcpb_storage_path',
          args: rpcArgs, // Will be redacted by Pino's redact config
        },
      });
    }

    // Validate data structure without type assertion
    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    // Safely extract properties
    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      if (desc && typeof desc.value === 'string') {
        return desc.value;
      }
      return undefined;
    };

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!(bucket && objectPath)) {
      return badRequestResponse('MCPB package not found', CORS_JSON);
    }

    const typedLocation = { bucket, object_path: objectPath };

    traceRequestComplete(logContext);
    return proxyStorageFile({
      bucket: typedLocation.bucket,
      path: typedLocation.object_path,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  }

  return badRequestResponse(
    `Storage format not supported for category '${category}'. Supported categories: skills, mcp`,
    CORS_JSON
  );
}