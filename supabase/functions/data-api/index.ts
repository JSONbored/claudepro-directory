/// <reference path="../_shared/deno-globals.d.ts" />

import { getOnlyCorsHeaders, jsonResponse } from '../_shared/utils/http.ts';
import { validatePathSegments, validateQueryString } from '../_shared/utils/input-validation.ts';
import { createDataApiContext, logError, logInfo } from '../_shared/utils/logging.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '../_shared/utils/rate-limit.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
// Static imports to ensure circuit-breaker and timeout utilities are included in the bundle
// These are lazily imported in callRpc, but we need static imports for Supabase bundling
import '../_shared/utils/circuit-breaker.ts';
import '../_shared/utils/timeout.ts';
import { handleCompanyRoute } from './routes/company.ts';
import { handleContentRoute } from './routes/content.ts';
import { handleGeneratePackage } from './routes/content-generate/index.ts';
import { handlePackageGenerationQueue } from './routes/content-generate/queue-worker.ts';
import { handleUploadPackage } from './routes/content-generate/upload.ts';
import { handleFeedsRoute } from './routes/feeds.ts';
import { handleSeoRoute } from './routes/seo.ts';
import { handleSitemapRoute } from './routes/sitemap.ts';
import { handleStatusRoute } from './routes/status.ts';
import { handleTrendingRoute } from './routes/trending.ts';

const BASE_CORS = getOnlyCorsHeaders;

interface DataApiContext extends RouterContext {
  pathname: string;
  segments: string[];
  searchParams: URLSearchParams;
}

const router = createRouter<DataApiContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;

    // Normalize pathname: remove /functions/v1/data-api or /data-api prefix
    // SECURITY: Use strict prefix matching to prevent path traversal
    let pathname = url.pathname;

    // Match /functions/v1/data-api prefix (Supabase Edge Function path)
    if (pathname.startsWith('/functions/v1/data-api')) {
      pathname = pathname.slice('/functions/v1/data-api'.length);
    }
    // Match /data-api prefix (direct call path)
    else if (pathname.startsWith('/data-api')) {
      pathname = pathname.slice('/data-api'.length);
    }
    // If pathname doesn't start with expected prefixes, keep as-is (for root routes)

    pathname = pathname || '/';
    const segments =
      pathname === '/' ? [] : pathname.replace(/^\/+/, '').split('/').filter(Boolean);

    // Input validation
    const queryValidation = validateQueryString(url);
    if (!queryValidation.valid) {
      throw new Error(queryValidation.error);
    }

    const pathValidation = validatePathSegments(segments);
    if (!pathValidation.valid) {
      throw new Error(pathValidation.error);
    }

    return {
      request,
      url,
      pathname,
      segments,
      searchParams: url.searchParams,
      method: normalizedMethod,
      originalMethod,
    };
  },
  defaultCors: BASE_CORS,
  onNoMatch: (ctx) =>
    jsonResponse(
      {
        error: 'Not Found',
        message: 'Unknown data resource',
        path: ctx.pathname,
      },
      404,
      BASE_CORS
    ),
  routes: [
    {
      name: 'root',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments.length === 0,
      handler: (ctx) => respondWithAnalytics(ctx, 'root', () => handleDirectoryIndex(ctx)),
    },
    {
      name: 'content-generate',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content' && ctx.segments[1] === 'generate-package',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'content-generate', async () => {
          // Check for sub-routes
          if (ctx.segments[2] === 'upload') {
            // Upload route: POST /content/generate-package/upload
            // Rate limiting: Heavy preset for package uploads (expensive operation)
            const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.heavy);
            if (!rateLimit.allowed) {
              return jsonResponse(
                {
                  error: 'Too Many Requests',
                  message: 'Rate limit exceeded',
                  retryAfter: rateLimit.retryAfter,
                },
                429,
                BASE_CORS,
                {
                  'Retry-After': String(rateLimit.retryAfter ?? 60),
                  'X-RateLimit-Limit': String(RATE_LIMIT_PRESETS.heavy.maxRequests),
                  'X-RateLimit-Remaining': String(rateLimit.remaining),
                  'X-RateLimit-Reset': String(rateLimit.resetAt),
                }
              );
            }

            const logContext = createDataApiContext('content-generate-upload', {
              path: ctx.pathname,
            });
            const response = await handleUploadPackage(ctx.request, logContext);

            // Add rate limit headers
            const headers = new Headers(response.headers);
            headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
            headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
            headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

            return new Response(response.body, {
              status: response.status,
              headers,
            });
          }

          if (ctx.segments[2] === 'process') {
            // Queue worker route: POST /content/generate-package/process
            // Rate limiting: Moderate preset for queue workers
            const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.heavy);
            if (!rateLimit.allowed) {
              return jsonResponse(
                {
                  error: 'Too Many Requests',
                  message: 'Rate limit exceeded',
                  retryAfter: rateLimit.retryAfter,
                },
                429,
                BASE_CORS,
                {
                  'Retry-After': String(rateLimit.retryAfter ?? 60),
                  'X-RateLimit-Limit': String(RATE_LIMIT_PRESETS.heavy.maxRequests),
                  'X-RateLimit-Remaining': String(rateLimit.remaining),
                  'X-RateLimit-Reset': String(rateLimit.resetAt),
                }
              );
            }

            const response = await handlePackageGenerationQueue(ctx.request);

            // Add rate limit headers
            const headers = new Headers(response.headers);
            headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
            headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
            headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

            return new Response(response.body, {
              status: response.status,
              headers,
            });
          }

          // Manual generation route: POST /content/generate-package
          // Rate limiting: Heavy preset for package generation (expensive operation)
          const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.heavy);
          if (!rateLimit.allowed) {
            return jsonResponse(
              {
                error: 'Too Many Requests',
                message: 'Rate limit exceeded',
                retryAfter: rateLimit.retryAfter,
              },
              429,
              BASE_CORS,
              {
                'Retry-After': String(rateLimit.retryAfter ?? 60),
                'X-RateLimit-Limit': String(RATE_LIMIT_PRESETS.heavy.maxRequests),
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'X-RateLimit-Reset': String(rateLimit.resetAt),
              }
            );
          }

          const logContext = createDataApiContext('content-generate', {
            path: ctx.pathname,
            method: ctx.method,
            resource: 'generate-package',
          });

          const response = await handleGeneratePackage(ctx.request, logContext);

          // Add rate limit headers
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

          return new Response(response.body, {
            status: response.status,
            headers,
          });
        }),
    },
    {
      name: 'content',
      methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'content', async () => {
          // Rate limiting for content endpoints
          // Use heavier preset for POST requests (generation operations)
          const preset =
            ctx.method === 'POST' ? RATE_LIMIT_PRESETS.heavy : RATE_LIMIT_PRESETS.public;
          const rateLimit = checkRateLimit(ctx.request, preset);
          if (!rateLimit.allowed) {
            return jsonResponse(
              {
                error: 'Too Many Requests',
                message: 'Rate limit exceeded',
                retryAfter: rateLimit.retryAfter,
              },
              429,
              BASE_CORS,
              {
                'Retry-After': String(rateLimit.retryAfter ?? 60),
                'X-RateLimit-Limit': String(preset.maxRequests),
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'X-RateLimit-Reset': String(rateLimit.resetAt),
              }
            );
          }

          const logContext = createDataApiContext('content', {
            path: ctx.pathname,
            method: ctx.method,
            ...(ctx.segments.length > 1 && ctx.segments[1] !== undefined
              ? { resource: ctx.segments[1] }
              : {}),
          });

          const response = await handleContentRoute(
            ctx.segments.slice(1),
            ctx.url,
            ctx.method,
            ctx.request,
            logContext
          );

          // Add rate limit headers
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(preset.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

          return new Response(response.body, {
            status: response.status,
            headers,
          });
        }),
    },
    {
      name: 'feeds',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'feeds',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'feeds', () =>
          handleFeedsRoute(ctx.segments.slice(1), ctx.url, ctx.method)
        ),
    },
    {
      name: 'seo',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'seo',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'seo', async () => {
          const logContext = createDataApiContext('seo', {
            path: ctx.pathname,
            method: ctx.method,
          });
          return handleSeoRoute(ctx.segments.slice(1), ctx.url, ctx.method, logContext);
        }),
    },
    {
      name: 'sitemap',
      methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => {
        const firstSegment = ctx.segments[0];
        // Match both 'sitemap' and 'sitemap.xml'
        return firstSegment === 'sitemap' || firstSegment === 'sitemap.xml';
      },
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'sitemap', async () => {
          // Rate limiting: heavier for sitemap, stricter for POST
          const preset =
            ctx.method === 'POST' ? RATE_LIMIT_PRESETS.indexnow : RATE_LIMIT_PRESETS.heavy;

          const rateLimit = checkRateLimit(ctx.request, preset);
          if (!rateLimit.allowed) {
            return jsonResponse(
              {
                error: 'Too Many Requests',
                message: 'Rate limit exceeded',
                retryAfter: rateLimit.retryAfter,
              },
              429,
              BASE_CORS,
              {
                'Retry-After': String(rateLimit.retryAfter ?? 60),
                'X-RateLimit-Limit': String(preset.maxRequests),
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'X-RateLimit-Reset': String(rateLimit.resetAt),
              }
            );
          }

          const logContext = createDataApiContext('sitemap', {
            path: ctx.pathname,
            method: ctx.method,
          });

          const response = await handleSitemapRoute(
            ctx.segments.slice(1),
            ctx.url,
            ctx.method,
            ctx.request,
            logContext
          );

          // Add rate limit headers
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(preset.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

          return new Response(response.body, {
            status: response.status,
            headers,
          });
        }),
    },
    {
      name: 'status',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'status',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'status', () =>
          handleStatusRoute(ctx.segments.slice(1), ctx.url, ctx.method)
        ),
    },
    {
      name: 'company',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'company',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'company', () =>
          handleCompanyRoute(ctx.segments.slice(1), ctx.url, ctx.method)
        ),
    },
    {
      name: 'trending',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'trending',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'trending', () =>
          handleTrendingRoute(ctx.segments.slice(1), ctx.url, ctx.method)
        ),
    },
  ],
});

Deno.serve(async (request) => {
  try {
    // Wrap router with rate limiting and error handling
    return await router(request);
  } catch (error) {
    // Handle validation errors from buildContext
    if (
      error instanceof Error &&
      (error.message.includes('too long') || error.message.includes('invalid'))
    ) {
      return jsonResponse(
        {
          error: 'Bad Request',
          message: error.message,
        },
        400,
        BASE_CORS
      );
    }

    // Re-throw to let router handle it
    throw error;
  }
});

async function handleDirectoryIndex(ctx: DataApiContext): Promise<Response> {
  const response = jsonResponse(
    {
      ok: true,
      resources: [
        {
          path: 'content/sitewide',
          description: 'Sitewide README + LLM exports',
        },
        {
          path: 'content/paginated',
          description: 'Paginated content listings',
        },
        { path: 'content/changelog', description: 'Changelog index + entries' },
        {
          path: 'content/:category/:slug',
          description: 'Content exports (JSON/Markdown/LLMs/storage)',
        },
        {
          path: 'content/generate-package',
          description:
            'Generate package for content (Skills ZIP, MCP .mcpb, etc.) - Internal only (POST)',
          method: 'POST',
        },
        {
          path: 'content/mcp/:slug?action=generate',
          description: 'Check if .mcpb package exists for MCP server (POST)',
          method: 'POST',
        },
        { path: 'company', description: 'Public company profile' },
        { path: 'seo', description: 'Metadata + schema JSON for any route' },
        {
          path: 'feeds',
          description: 'RSS/Atom feeds for content & changelog',
        },
        {
          path: 'sitemap',
          description: 'Sitemap XML/JSON + IndexNow submitter',
        },
        { path: 'status', description: 'API health check' },
        {
          path: 'trending',
          description: 'Trending/popular/recent content data',
        },
      ],
    },
    200,
    BASE_CORS
  );

  if (ctx.originalMethod === 'HEAD') {
    return new Response(null, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}

function respondWithAnalytics(
  ctx: DataApiContext,
  routeName: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const startedAt = performance.now();
  const logContext = createDataApiContext(routeName, {
    path: ctx.pathname,
    method: ctx.method,
    ...(ctx.segments.length > 1 && ctx.segments[1] !== undefined
      ? { resource: ctx.segments[1] }
      : {}),
  });

  const logEvent = (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const durationMs = Math.round(performance.now() - startedAt);
    const logData: Record<string, unknown> = {
      route: routeName,
      path: ctx.pathname || '/',
      method: ctx.method,
      status,
      duration_ms: durationMs,
    };

    const query = ctx.searchParams.toString();
    if (query) {
      logData['query'] = query;
    }
    if (ctx.segments.length > 1) {
      logData['resource'] = ctx.segments[1];
    }
    if (error) {
      logData['error'] = error instanceof Error ? error.message : String(error);
    }

    if (outcome === 'success') {
      logInfo('Route hit', { ...logContext, ...logData });
    } else {
      logError('Route error', { ...logContext, ...logData }, error);
    }
  };

  return handler()
    .then((response) => {
      logEvent(response.status, 'success');
      return response;
    })
    .catch((error) => {
      const status =
        error instanceof Response
          ? error.status
          : typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status?: number }).status) || 500
            : 500;
      logEvent(status, 'error', error);
      throw error;
    });
}
