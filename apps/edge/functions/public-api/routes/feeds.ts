import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  methodNotAllowedResponse,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders, createDataApiContext, logError, logInfo, logger } from '@heyclaude/shared-runtime';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

type FeedType = 'rss' | 'atom';
const SUPPORTED_TYPES = new Set<FeedType>(['rss', 'atom']);

/**
 * Convert a string to a `ContentCategory` when it matches one of the allowed category values.
 *
 * @param value - The input string to normalize; may be `null`.
 * @returns The matching `ContentCategory` if `value` is one of the allowed categories, `null` otherwise.
 */
function toContentCategory(value: string | null): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

const CORS = getOnlyCorsHeaders;

/**
 * Executes a database RPC, logs failures with context, and returns the RPC's data.
 *
 * @param rpcName - Identifier used in logs and error messages
 * @param rpcCall - Function that performs the RPC and resolves to an object with `data` and `error`
 * @param args - Arguments passed to the RPC; included in logged context (may be redacted)
 * @returns The `data` returned by the RPC
 * @throws The RPC `error` if present, or an `Error` when the RPC returned `null` data
 */
async function executeRpcWithLogging<T>(
  rpcName: string,
  rpcCall: () => PromiseLike<{ data: T | null; error: unknown }>,
  args: Record<string, unknown>
): Promise<T> {
  const { data, error } = await rpcCall();
  if (error || data == null) {
    if (error) {
      await logError('RPC call failed in generateFeedPayload', {
        dbQuery: {
          rpcName,
          args, // Will be redacted by Pino's redact config
        },
      }, error);
    }
    throw error ?? new Error(`${rpcName} returned null`);
  }
  return data;
}
const FEED_LIMIT = 50;

/**
 * Serve the /feeds route by validating the request and returning RSS or Atom feed XML.
 *
 * Parses `type` and `category` from the URL query parameters and returns a feed response with appropriate headers,
 * or a JSON error response for invalid or unsupported requests.
 *
 * @param segments - Remaining path segments after `/feeds`; must be empty (nested segments produce 404)
 * @param url - The incoming request URL; `type` and `category` are read from its query parameters
 * @param method - The HTTP method of the request
 * @returns An HTTP Response containing feed XML with appropriate Content-Type and headers on success, or a JSON error response with the corresponding status code on failure
 */
export async function handleFeedsRoute(
  segments: string[],
  url: URL,
  method: string
): Promise<Response> {
  const logContext = createDataApiContext('feeds', {
    path: url.pathname,
    method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Feeds request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'feeds',
    method,
  });
  
  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  if (segments.length > 0) {
    return jsonResponse(
      {
        error: 'Not Found',
        message: 'Feeds path does not accept nested segments',
      },
      404,
      CORS
    );
  }

  const typeParam = (url.searchParams.get('type') || 'rss').toLowerCase();
  const categoryParam = url.searchParams.get('category');
  const category =
    categoryParam && categoryParam !== 'all' ? categoryParam.trim().toLowerCase() : null;

  if (!SUPPORTED_TYPES.has(typeParam as FeedType)) {
    return badRequestResponse('Invalid type. Valid types: rss, atom', CORS);
  }
  const type = typeParam as FeedType;

  if (category && category !== 'changelog' && !toContentCategory(category)) {
    return badRequestResponse(
      `Invalid category parameter. Valid categories: changelog, ${CONTENT_CATEGORY_VALUES.join(', ')}, or omit/use 'all' for site-wide feed`,
      CORS
    );
  }

  const headers = {
    ...CORS,
    ...buildCacheHeaders('feeds'),
    'X-Robots-Tag': 'index, follow',
    'X-Generated-By': 'supabase.functions.feeds',
  };

  try {
    traceStep('Generating feed payload', logContext);
    
    // Update bindings with feed type and category
    logger.setBindings({
      feedType: type,
      category: category || 'all',
    });
    
    const payload = await generateFeedPayload(type, category);
    
    logInfo('Feed delivery', {
      ...logContext,
      type,
      category: category ?? 'all',
      contentType: payload.contentType,
    });
    traceRequestComplete(logContext);

    return new Response(payload.xml, {
      status: 200,
      headers: {
        ...buildSecurityHeaders(),
        ...headers,
        'Content-Type': payload.contentType,
        'X-Content-Source': payload.source,
      },
    });
  } catch (error) {
    // Use dbQuery serializer for consistent database query formatting
    // Note: RPC name will be in the error message or logged by generateFeedPayload
    return await errorResponse(error, 'data-api:feeds', CORS, {
      ...logContext,
      dbQuery: {
        // RPC name will be determined from error context or logged separately
        feedType: type,
        category: category || 'all',
      },
    });
  }
}

/**
 * Generate the feed XML, the appropriate Content-Type header value, and a human-readable source label for the requested feed type and category.
 *
 * @param type - The feed format to generate (`'rss'` or `'atom'`).
 * @param category - The content category to filter by; use `'changelog'` to produce the changelog feed, `null` (or omitted) to include all categories.
 * @returns An object with:
 *  - `xml` — the generated feed XML as a string,
 *  - `contentType` — the MIME `Content-Type` value for the feed,
 *  - `source` — a descriptive source label (e.g., `"PostgreSQL changelog (rss)"` or `"PostgreSQL content (category)"`).
 */
async function generateFeedPayload(
  type: FeedType,
  category: string | null
): Promise<{ xml: string; contentType: string; source: string }> {
  if (category === 'changelog') {
    if (type === 'rss') {
      const rpcArgs = {
        p_limit: FEED_LIMIT,
      } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_rss_feed']['Args'];
      const feedData = await executeRpcWithLogging(
        'generate_changelog_rss_feed',
        () => supabaseAnon.rpc('generate_changelog_rss_feed', rpcArgs),
        rpcArgs
      );
      return {
        xml: feedData,
        contentType: 'application/rss+xml; charset=utf-8',
        source: 'PostgreSQL changelog (rss)',
      };
    }
    const rpcArgs2 = {
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_atom_feed']['Args'];
    const feedData = await executeRpcWithLogging(
      'generate_changelog_atom_feed',
      () => supabaseAnon.rpc('generate_changelog_atom_feed', rpcArgs2),
      rpcArgs2
    );
    return {
      xml: feedData,
      contentType: 'application/atom+xml; charset=utf-8',
      source: 'PostgreSQL changelog (atom)',
    };
  }

  const typedCategory = category && category !== 'changelog' ? toContentCategory(category) : null;

  if (type === 'rss') {
    const rpcArgs3 = {
      ...(typedCategory ? { p_category: typedCategory } : {}),
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_content_rss_feed']['Args'];
    const feedData = await executeRpcWithLogging(
      'generate_content_rss_feed',
      () => supabaseAnon.rpc('generate_content_rss_feed', rpcArgs3),
      rpcArgs3
    );
    return {
      xml: feedData,
      contentType: 'application/rss+xml; charset=utf-8',
      source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
    };
  }

  const rpcArgs4 = {
    ...(typedCategory ? { p_category: typedCategory } : {}),
    p_limit: FEED_LIMIT,
  } satisfies DatabaseGenerated['public']['Functions']['generate_content_atom_feed']['Args'];
  const feedData = await executeRpcWithLogging(
    'generate_content_atom_feed',
    () => supabaseAnon.rpc('generate_content_atom_feed', rpcArgs4),
    rpcArgs4
  );
  return {
    xml: feedData,
    contentType: 'application/atom+xml; charset=utf-8',
    source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
  };
}