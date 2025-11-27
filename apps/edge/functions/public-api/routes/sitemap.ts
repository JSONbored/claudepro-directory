import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  edgeEnv,
  errorResponse,
  fetchWithRetry,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  methodNotAllowedResponse,
  SITE_URL,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import {
  buildSecurityHeaders,
  createDataApiContext,
  getNumberProperty,
  getStringProperty,
  logError,
  logInfo,
  logger,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;
const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_API_KEY = edgeEnv.indexNow.apiKey;
const INDEXNOW_TRIGGER_KEY = edgeEnv.indexNow.triggerKey;

export async function handleSitemapRoute(
  segments: string[],
  url: URL,
  method: string,
  req: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Create log context if not provided
  const finalLogContext = logContext || createDataApiContext('sitemap', {
    path: url.pathname,
    method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(finalLogContext);
  traceStep('Sitemap request received', finalLogContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: finalLogContext.request_id,
    operation: finalLogContext.action || 'sitemap',
    method,
  });
  
  if (segments.length > 0) {
    return badRequestResponse('Sitemap path does not accept nested segments', CORS);
  }

  if (method === 'GET') {
    return handleSitemapGet(url, finalLogContext);
  }

  if (method === 'POST') {
    return handleSitemapIndexNow(req, finalLogContext);
  }

  return methodNotAllowedResponse('GET, POST', CORS);
}

async function handleSitemapGet(url: URL, logContext: BaseLogContext): Promise<Response> {
  const format = (url.searchParams.get('format') || 'xml').toLowerCase();
  
  traceStep(`Generating sitemap (format: ${format})`, logContext);
  
  // Update bindings with format
  logger.setBindings({
    format,
  });

  if (format === 'json') {
    const { data: urls, error } = await supabaseAnon.rpc('get_site_urls', undefined);
    if (error) {
      // Use dbQuery serializer for consistent database query formatting
      return await errorResponse(error, 'data-api:get_site_urls', CORS, {
        ...logContext,
        dbQuery: {
          rpcName: 'get_site_urls',
        },
      });
    }
    // Validate data structure without type assertion
    if (!(urls && Array.isArray(urls)) || urls.length === 0) {
      return jsonResponse({ error: 'No URLs returned from database' }, 500, CORS);
    }


    // Map URLs to response format, filtering out invalid entries
    const mappedUrls: Array<{
      path: string;
      loc: string;
      lastmod?: string;
      changefreq?: string;
      priority?: number;
    }> = [];

    for (const u of urls) {
      const path = getStringProperty(u, 'path');
      if (path) {
        const lastmod = getStringProperty(u, 'lastmod');
        const changefreq = getStringProperty(u, 'changefreq');
        const priority = getNumberProperty(u, 'priority');
        // Build object conditionally to satisfy exactOptionalPropertyTypes
        const urlItem: {
          path: string;
          loc: string;
          lastmod?: string;
          changefreq?: string;
          priority?: number;
        } = {
          path,
          loc: `${SITE_URL}${path}`,
        };
        if (lastmod !== undefined) {
          urlItem.lastmod = lastmod;
        }
        if (changefreq !== undefined) {
          urlItem.changefreq = changefreq;
        }
        if (priority !== undefined) {
          urlItem.priority = priority;
        }
        mappedUrls.push(urlItem);
      }
    }

    traceRequestComplete(logContext);
    return jsonResponse(
      {
        urls: mappedUrls,
        meta: {
          total: mappedUrls.length,
          generated: new Date().toISOString(),
        },
      },
      200,
      {
        ...CORS,
        ...buildCacheHeaders('sitemap'),
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Source': 'PostgreSQL mv_site_urls',
      }
    );
  }

  const rpcArgs = {
    p_base_url: SITE_URL,
  } satisfies DatabaseGenerated['public']['Functions']['generate_sitemap_xml']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_sitemap_xml', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:generate_sitemap_xml', CORS, {
      ...logContext,
      dbQuery: {
        rpcName: 'generate_sitemap_xml',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    });
  }

  if (!data) {
    return jsonResponse({ error: 'Sitemap XML generation returned null' }, 500, CORS);
  }

  traceRequestComplete(logContext);
  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'X-Generated-By': 'supabase.rpc.generate_sitemap_xml',
      'X-Content-Source': 'PostgreSQL mv_site_urls',
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('sitemap'),
    },
  });
}

async function handleSitemapIndexNow(req: Request, logContext: BaseLogContext): Promise<Response> {
  traceStep('Processing IndexNow submission', logContext);
  
  const triggerKey = req.headers.get('X-IndexNow-Trigger-Key');

  if (!INDEXNOW_TRIGGER_KEY) {
    return jsonResponse(
      {
        error: 'Service unavailable',
        message: 'IndexNow trigger key not configured',
      },
      503,
      CORS
    );
  }

  if (triggerKey !== INDEXNOW_TRIGGER_KEY) {
    return jsonResponse({ error: 'Unauthorized', message: 'Invalid trigger key' }, 401, CORS);
  }

  if (!INDEXNOW_API_KEY) {
    return jsonResponse(
      {
        error: 'Service unavailable',
        message: 'IndexNow API key not configured',
      },
      503,
      CORS
    );
  }

  const { data: urls, error } = await supabaseAnon.rpc('get_site_urls', undefined);
  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:get_site_urls', CORS, {
      ...logContext,
      dbQuery: {
        rpcName: 'get_site_urls',
      },
    });
  }
  // Validate data structure without type assertion
  if (!(urls && Array.isArray(urls)) || urls.length === 0) {
    return jsonResponse({ error: 'No URLs to submit to IndexNow' }, 500, CORS);
  }


  const urlList = urls
    .map((u: unknown) => {
      const path = getStringProperty(u, 'path');
      return path ? `${SITE_URL}${path}` : null;
    })
    .filter((url): url is string => url !== null)
    .slice(0, 10000);
  const payload = {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_API_KEY,
    keyLocation: `${SITE_URL}/indexnow.txt`,
    urlList,
  };

  // Make IndexNow call non-blocking with timeout and retry
  try {
    const fetchPromise = fetchWithRetry({
      url: INDEXNOW_API_URL,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      retry: {
        attempts: 2,
        baseDelayMs: 1000,
        retryOn: [500, 502, 503, 504],
        noRetryOn: [400, 401, 403, 404],
      },
      ...(logContext !== undefined ? { logContext } : {}),
    });

    // Use timeout to prevent hanging
    const { response: finalResponse } = await withTimeout(
      fetchPromise,
      TIMEOUT_PRESETS.external,
      'IndexNow request timed out'
    );

    if (!finalResponse.ok) {
      const text = await finalResponse.text();
      return jsonResponse(
        {
          error: 'IndexNow request failed',
          status: finalResponse.status,
          body: text,
        },
        502,
        CORS
      );
    }

    logInfo('IndexNow submitted', {
      ...logContext,
      submitted: urlList.length,
      status: finalResponse.status,
    });
    traceRequestComplete(logContext);

    return jsonResponse(
      {
        ok: true,
        submitted: urlList.length,
      },
      200,
      CORS
    );
  } catch (error) {
    // Log error but return success to avoid blocking
    await logError(
      'IndexNow submission failed',
      {
        ...logContext,
        submitted: urlList.length,
      },
      error
    );
    traceRequestComplete(logContext);

    // Return success even if IndexNow fails (non-blocking)
    return jsonResponse(
      {
        ok: true,
        submitted: urlList.length,
        warning: 'IndexNow submission may have failed, but URLs were queued',
      },
      200,
      CORS
    );
  }
}
