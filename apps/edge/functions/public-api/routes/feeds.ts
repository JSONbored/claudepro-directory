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
import { buildSecurityHeaders, createDataApiContext, logInfo, logger } from '@heyclaude/shared-runtime';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

type FeedType = 'rss' | 'atom';
const SUPPORTED_TYPES = new Set<FeedType>(['rss', 'atom']);

function toContentCategory(value: string | null): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

const CORS = getOnlyCorsHeaders;
const FEED_LIMIT = 50;

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
    requestId: logContext.request_id,
    operation: logContext.action || 'feeds',
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

async function generateFeedPayload(
  type: FeedType,
  category: string | null
): Promise<{ xml: string; contentType: string; source: string }> {
  if (category === 'changelog') {
    if (type === 'rss') {
      const rpcArgs = {
        p_limit: FEED_LIMIT,
      } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_rss_feed']['Args'];
      const { data, error } = await supabaseAnon.rpc('generate_changelog_rss_feed', rpcArgs);
      if (error || data == null) {
        // Use dbQuery serializer for consistent database query formatting
        const { logError } = await import('@heyclaude/shared-runtime');
        if (error) {
          await logError('RPC call failed in generateFeedPayload', {
            dbQuery: {
              rpcName: 'generate_changelog_rss_feed',
              args: rpcArgs, // Will be redacted by Pino's redact config
            },
          }, error);
        }
        throw error ?? new Error('generate_changelog_rss_feed returned null');
      }
      return {
        xml: data,
        contentType: 'application/rss+xml; charset=utf-8',
        source: 'PostgreSQL changelog (rss)',
      };
    }
    const rpcArgs2 = {
      p_limit: FEED_LIMIT,
    } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_atom_feed']['Args'];
    const { data, error } = await supabaseAnon.rpc('generate_changelog_atom_feed', rpcArgs2);
    if (error || data == null) {
      // Use dbQuery serializer for consistent database query formatting
      const { logError } = await import('@heyclaude/shared-runtime');
      if (error) {
        await logError('RPC call failed in generateFeedPayload', {
          dbQuery: {
            rpcName: 'generate_changelog_atom_feed',
            args: rpcArgs2, // Will be redacted by Pino's redact config
          },
        }, error);
      }
      throw error ?? new Error('generate_changelog_atom_feed returned null');
    }
    return {
      xml: data,
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
    const { data, error } = await supabaseAnon.rpc('generate_content_rss_feed', rpcArgs3);
    if (error || data == null) {
      // Use dbQuery serializer for consistent database query formatting
      const { logError } = await import('@heyclaude/shared-runtime');
      if (error) {
        await logError('RPC call failed in generateFeedPayload', {
          dbQuery: {
            rpcName: 'generate_content_rss_feed',
            args: rpcArgs3, // Will be redacted by Pino's redact config
          },
        }, error);
      }
      throw error ?? new Error('generate_content_rss_feed returned null');
    }
    return {
      xml: data,
      contentType: 'application/rss+xml; charset=utf-8',
      source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
    };
  }

  const rpcArgs4 = {
    ...(typedCategory ? { p_category: typedCategory } : {}),
    p_limit: FEED_LIMIT,
  } satisfies DatabaseGenerated['public']['Functions']['generate_content_atom_feed']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_content_atom_feed', rpcArgs4);
  if (error || data == null) {
    // Use dbQuery serializer for consistent database query formatting
    const { logError } = await import('@heyclaude/shared-runtime');
    if (error) {
      await logError('RPC call failed in generateFeedPayload', {
        dbQuery: {
          rpcName: 'generate_content_atom_feed',
          args: rpcArgs4, // Will be redacted by Pino's redact config
        },
      }, error);
    }
    throw error ?? new Error('generate_content_atom_feed returned null');
  }
  return {
    xml: data,
    contentType: 'application/atom+xml; charset=utf-8',
    source: category ? `PostgreSQL content (${category})` : 'PostgreSQL content (all categories)',
  };
}
