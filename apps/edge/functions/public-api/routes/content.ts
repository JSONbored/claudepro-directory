import { ContentService } from '@heyclaude/data-layer';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { supabaseAnon } from '@heyclaude/edge-runtime';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Determine whether a string corresponds to a supported content category.
 *
 * @param value - The string to validate as a content category
 * @returns `true` if `value` is a valid `ContentCategory`, `false` otherwise
 */
function isValidContentCategory(value: string): value is ContentCategory {
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory);
}

import {
  SITE_URL,
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  methodNotAllowedResponse,
  traceStep,
} from '@heyclaude/edge-runtime';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import { buildSecurityHeaders, createDataApiContext, logInfo, logger, validateSlug } from '@heyclaude/shared-runtime';
import { handlePaginatedContent } from './content-paginated.ts';
import { handleRecordExport } from './content-record.ts';

const CORS = getOnlyCorsHeaders;

// Export handlers for use in other modules
// Note: handleContentHighlight logic is now consolidated in content-process.ts to avoid circular dependencies
/**
 * Dispatches incoming /content requests to the appropriate handler based on path segments, HTTP method, and query parameters.
 *
 * @param segments - Path segments following `/content` (e.g., `['mcp','slug']`, `['sitewide']`, `['category','slug']`)
 * @param url - Full request URL (used to read query parameters like `action` and `format`)
 * @param method - HTTP method of the request (e.g., `GET`, `HEAD`, `POST`)
 * @param _request - Original Request object (passed to handlers that may need request details)
 * @param logContext - Optional logging context used to initialize request-scoped logging and tracing
 * @returns An HTTP Response produced by the routed content handler (status and body reflect the specific route outcome)
 */

export async function handleContentRoute(
  segments: string[],
  url: URL,
  method: string,
  _request: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Create log context if not provided
  const finalLogContext = logContext || createDataApiContext('content', {
    path: url.pathname,
    method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(finalLogContext);
  traceStep('Content route request received', finalLogContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: finalLogContext.request_id,
    operation: finalLogContext.action || 'content-route',
    function: finalLogContext.function,
    method,
  });
  
  // Handle POST requests for content generation operations
  if (method === 'POST') {
    const action = url.searchParams.get('action')?.toLowerCase();

    // Handle .mcpb generation check: POST /content/mcp/[slug]?action=generate
    // Note: Currently just checks if package exists (read operation), no auth needed
    // When actual generation is implemented, this will become a write operation
    if (action === 'generate' && segments.length === 2) {
      const [category, slug] = segments;
      if (category === 'mcp' && slug !== undefined) {
        return handleMcpbGeneration(slug, _request, logContext);
      }
      return badRequestResponse(
        `Generation not supported for category '${category}'. Supported: mcp`,
        CORS
      );
    }

    return badRequestResponse(
      'Invalid POST request. Supported: POST /content/mcp/[slug]?action=generate',
      CORS
    );
  }

  // Handle GET requests (existing functionality)
  if (method !== 'GET' && method !== 'HEAD') {
    return methodNotAllowedResponse('GET, HEAD, POST', CORS);
  }

  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  if (segments.length === 0) {
    return badRequestResponse('Missing content path segments', CORS);
  }

  if (segments.length === 1) {
    const [first] = segments;
    if (first === 'sitewide') {
      return handleSitewideContent(url, logContext);
    }
    if (first === 'paginated') {
      return handlePaginatedContent(url);
    }
    if (first === 'changelog') {
      return handleChangelogIndex(format);
    }
    if (first === 'category-configs' || first === 'categories') {
      return handleCategoryConfigs();
    }
    // Validate content category without type assertion
    if (first && isValidContentCategory(first)) {
      return handleCategoryOnly(first, format);
    }
  }

  if (segments.length === 2) {
    const [first, second] = segments;
    if (first === 'changelog' && second !== undefined) {
      return handleChangelogEntry(second, format);
    }
    if (first === 'tools' && second !== undefined) {
      return handleToolLlmsTxt(second, format);
    }
    // Validate content category without type assertion
    if (first && isValidContentCategory(first) && second !== undefined) {
      return handleRecordExport(first, second, url);
    }
    return badRequestResponse(
      `Invalid category '${first}'. Valid categories: ${CONTENT_CATEGORY_VALUES.join(', ')}`,
      CORS
    );
  }

  return jsonResponse(
    {
      error: 'Not Found',
      message: 'Content resource unavailable',
      path: `/content/${segments.join('/')}`,
    },
    404,
    CORS
  );
}

/**
 * Serve sitewide LLMS plain-text content determined by the `format` query parameter.
 *
 * @returns A Response containing sitewide LLMS plain-text when `format` is `llms` or `llms-txt`; otherwise a 400 Bad Request Response that explains the valid formats.
 */
async function handleSitewideContent(url: URL, logContext?: BaseLogContext): Promise<Response> {
  const format = (url.searchParams.get('format') || 'llms').toLowerCase();

  if (format === 'llms' || format === 'llms-txt') {
    return handleSitewideLlmsTxt(logContext);
  }

  return badRequestResponse(
    `Invalid sitewide format '${format}'. Valid formats: llms, llms-txt`,
    CORS
  );
}

/**
 * Generate and return the sitewide LLMS export as plain text.
 *
 * Fetches the sitewide LLMS text from the content service, converts escaped newlines to real newlines,
 * logs the generation (when `logContext` is provided), and returns an HTTP `Response` with `Content-Type: text/plain`
 * plus security, CORS, and cache headers.
 *
 * @returns A `Response` containing the sitewide LLMS export as UTF-8 plain text; on failure, an error response with an appropriate status and JSON body.
 */
async function handleSitewideLlmsTxt(logContext?: BaseLogContext): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getSitewideLlmsTxt();

    if (!data) {
      return jsonResponse(
        {
          error: 'Sitewide LLMs export failed',
          message: 'RPC returned null or invalid',
        },
        500,
        CORS
      );
    }

    const formatted = data.replace(/\\n/g, '\n');

    if (logContext) {
      logInfo('Sitewide llms generated', {
        ...logContext,
        bytes: formatted.length,
      });
    }

    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_sitewide_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:generate_sitewide_llms_txt', CORS, logContext);
  }
}

/**
 * Serve the changelog index in the requested format.
 *
 * @param format - Desired output format; currently only `"llms-changelog"` is accepted.
 * @returns A `Response` containing the changelog in LLMS text when `format` is `"llms-changelog"`, or a 400 Bad Request `Response` describing the invalid format otherwise.
 */
async function handleChangelogIndex(format: string): Promise<Response> {
  if (format === 'llms-changelog') {
    return handleChangelogLlmsTxt();
  }
  return badRequestResponse(`Invalid format '${format}' for changelog index`, CORS);
}

/**
 * Parse a string into a ContentCategory when it matches a known category.
 *
 * @param value - The input string to convert to a ContentCategory; may be `null`.
 * @returns The matching `ContentCategory` when `value` is valid, `null` otherwise.
 */
function parseContentCategory(value: string | null): ContentCategory | null {
  if (!value) return null;
  return isValidContentCategory(value) ? value : null;
}

/**
 * Route a category-only request to the handler for the requested response format.
 *
 * @param category - The content category identifier to operate on.
 * @param format - The requested output format; only `'llms-category'` is supported.
 * @returns A Response for the requested category format: a successful LLMS text response when `format` is `'llms-category'` and the category is valid, or a 400 Bad Request response describing the invalid category or format.
 */
async function handleCategoryOnly(category: string, format: string): Promise<Response> {
  if (format === 'llms-category') {
    const typedCategory = parseContentCategory(category);
    if (!typedCategory) {
      return badRequestResponse(`Invalid category '${category}'`, CORS);
    }
    return handleCategoryLlmsTxt(typedCategory);
  }
  return badRequestResponse(`Invalid format '${format}' for category-only route`, CORS);
}

/**
 * Route handler that returns a changelog entry in the requested format.
 *
 * @param slug - The changelog entry identifier (slug)
 * @param format - Output format; supported value is `'llms-entry'`
 * @returns A `Response` containing the changelog entry in the requested format when `format` is `'llms-entry'`, otherwise a 400 Bad Request `Response`
 */
async function handleChangelogEntry(slug: string, format: string): Promise<Response> {
  if (format === 'llms-entry') {
    return handleChangelogEntryLlmsTxt(slug);
  }
  return badRequestResponse(`Invalid format '${format}' for changelog entry`, CORS);
}

/**
 * Serve the LLMS text for a tool when the requested format is `llms-tool`.
 *
 * @param tool - The tool identifier (slug) to retrieve LLMS content for.
 * @param format - Expected output format; only `'llms-tool'` is accepted.
 * @returns An HTTP `Response` containing the tool's LLMS text when `format` is `'llms-tool'`, or a 400 Bad Request `Response` otherwise.
 */
async function handleToolLlmsTxt(tool: string, format: string): Promise<Response> {
  if (format === 'llms-tool') {
    return handleToolLlms(tool);
  }
  return badRequestResponse(`Invalid format '${format}' for tool`, CORS);
}

/**
 * Generate the LLMs.txt plain-text content for a specific content category.
 *
 * @param category - The content category to retrieve the LLMs.txt for
 * @returns The HTTP Response containing the category LLMs.txt as UTF-8 plain text (status 200) or an appropriate error response (for example 400 if not found or other error responses produced by the data API)
 */
async function handleCategoryLlmsTxt(category: ContentCategory): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getCategoryLlmsTxt({ p_category: category });

    if (!data) {
      return badRequestResponse('Category LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_category_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:generate_category_llms_txt', CORS);
  }
}

/**
 * Serve the site changelog formatted for LLM consumption as plain text.
 *
 * @returns A Response containing the changelog text with `Content-Type: text/plain; charset=utf-8` and cache/security/CORS headers on success (HTTP 200); a 400 Response when the changelog is missing or invalid; or an error-mapped Response if an exception occurs.
 */
async function handleChangelogLlmsTxt(): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getChangelogLlmsTxt();

    if (!data) {
      return badRequestResponse('Changelog LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:generate_changelog_llms_txt', CORS);
  }
}

/**
 * Generate the LLMS.txt representation for a changelog entry identified by `slug`.
 *
 * @param slug - The changelog entry slug to retrieve and format
 * @returns A Response containing the changelog entry as plain text: `200` with the formatted LLMS.txt on success, `400` if not found or invalid, or an error response on failure
 */
async function handleChangelogEntryLlmsTxt(slug: string): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getChangelogEntryLlmsTxt({ p_slug: slug });

    if (!data) {
      return badRequestResponse('Changelog entry LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_entry_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:generate_changelog_entry_llms_txt', CORS);
  }
}

/**
 * Fetches the LLMS text for a named tool and returns it as a plain-text HTTP response.
 *
 * @param tool - The tool name used to look up its LLMS `.txt` content
 * @returns A `Response` with status `200` and the LLMS content as `text/plain` when found; a `400` response if the tool content is not found; or an error response produced by the data API on failure.
 */
async function handleToolLlms(tool: string): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getToolLlmsTxt({ p_tool_name: tool });

    if (!data) {
      return badRequestResponse('Tool LLMs.txt not found', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_tool_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:generate_tool_llms_txt', CORS);
  }
}

/**
 * Retrieve content category configurations and return them as a JSON HTTP response.
 *
 * Attempts to fetch category configuration records from the content service. If configs
 * are found, responds with the data and appropriate security, CORS, cache headers, and
 * an `X-Generated-By` marker; if no configs are available, responds with a 404 JSON error.
 *
 * @returns A Response containing the category configuration data (status 200) or a JSON error (status 404). In error cases, delegates to the centralized error responder.
 */
async function handleCategoryConfigs(): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getCategoryConfigs();

    if (!data) {
      return jsonResponse(
        {
          error: 'Not Found',
          message: 'Category configs not available',
        },
        404,
        CORS
      );
    }

    return jsonResponse(data, 200, {
      ...CORS,
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('config'),
      'X-Generated-By': 'supabase.rpc.get_category_configs_with_features',
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:get_category_configs_with_features', CORS);
  }
}

/**
 * Generate or report the status of an .mcpb package for an MCP server identified by `slug`.
 *
 * @param slug - The MCP server slug to validate and operate on
 * @param _request - The incoming HTTP request (unused by the handler)
 * @param logContext - Optional structured logging context to attach to log entries
 * @returns A Response containing either the existing `.mcpb` storage URL and success metadata, a 501 Not Implemented message when on-demand generation is not available, or an error response describing validation or retrieval failures
 */
async function handleMcpbGeneration(
  slug: string,
  _request: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Validate slug format (prevent path traversal)
  const sanitizedSlug = slug.trim();
  const slugValidation = validateSlug(sanitizedSlug);
  if (!slugValidation.valid) {
    return badRequestResponse(slugValidation.error || 'Invalid slug', CORS);
  }

  if (logContext) {
    logInfo('Fetching MCP server for generation', {
      ...logContext,
      slug: sanitizedSlug,
    });
  }

  const service = new ContentService(supabaseAnon);

  try {
    // Fetch MCP server using service
    const data = await service.getApiContentFull({
      p_category: 'mcp',
      p_slug: sanitizedSlug,
      p_base_url: SITE_URL,
    });

    if (!data) {
      return jsonResponse(
        {
          error: 'Not Found',
          message: `MCP server with slug '${sanitizedSlug}' not found`,
        },
        404,
        CORS
      );
    }

    // Parse JSON string returned by RPC (handled in service, but double check here)
    const contentData = data;

    // Validate content data structure without type assertion
    if (typeof contentData !== 'object' || contentData === null) {
      return jsonResponse(
        {
          error: 'Invalid Response',
          message: 'RPC returned invalid data structure',
        },
        500,
        CORS
      );
    }

    // Safely check for required properties
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

    // Validate that this looks like a content row by checking for required fields
    const contentSlug = getStringProperty(contentData, 'slug');
    const contentCategory = getStringProperty(contentData, 'category');

    if (!(contentSlug && contentCategory)) {
      return jsonResponse(
        {
          error: 'Invalid Response',
          message: 'RPC returned incomplete data',
        },
        500,
        CORS
      );
    }

    const mcpServer = contentData as DatabaseGenerated['public']['Tables']['content']['Row'];

    // Check if .mcpb already exists
    const mcpbStorageUrl = mcpServer.mcpb_storage_url;
    if (mcpbStorageUrl && typeof mcpbStorageUrl === 'string') {
      if (logContext) {
        logInfo('MCPB package already exists', {
          ...logContext,
          slug: sanitizedSlug,
          storage_url: mcpbStorageUrl,
        });
      }

      return jsonResponse(
        {
          success: true,
          slug: sanitizedSlug,
          mcpb_storage_url: mcpbStorageUrl,
          already_exists: true,
          message: 'MCPB package already exists. Use the existing URL.',
        },
        200,
        {
          ...CORS,
          ...buildSecurityHeaders(),
          'X-Generated-By': 'supabase.rpc.get_api_content_full',
        }
      );
    }

    // .mcpb doesn't exist - return 501 (Not Implemented)
    if (logContext) {
      logInfo('MCPB package does not exist - generation not yet implemented', {
        ...logContext,
        slug: sanitizedSlug,
      });
    }

    return jsonResponse(
      {
        error: 'Not Implemented',
        message:
          'On-demand generation is not yet implemented. Please run `pnpm build:mcpb` to generate packages.',
        slug: sanitizedSlug,
        instructions: 'Run the build script: pnpm build:mcpb',
      },
      501,
      {
        ...CORS,
        ...buildSecurityHeaders(),
        'X-Generated-By': 'data-api:handleMcpbGeneration',
      }
    );
  } catch (error) {
    return await errorResponse(error, 'data-api:get_api_content_full', CORS, logContext);
  }
}