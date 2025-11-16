import { getOnlyCorsHeaders, jsonResponse } from '../_shared/utils/http.ts';
import { createDataApiContext } from '../_shared/utils/logging.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { handleCompanyRoute } from './routes/company.ts';
import { handleContentRoute } from './routes/content.ts';
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
    const pathname = url.pathname.replace(/^\/data-api/, '') || '/';
    const segments =
      pathname === '/' ? [] : pathname.replace(/^\/+/, '').split('/').filter(Boolean);

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
      name: 'content',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'content', async () => {
          const logContext = createDataApiContext('content', {
            path: ctx.pathname,
            method: ctx.method,
            resource: ctx.segments.length > 1 ? ctx.segments[1] : undefined,
          });
          return handleContentRoute(ctx.segments.slice(1), ctx.url, ctx.method, logContext);
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
      match: (ctx) => ctx.segments[0] === 'sitemap',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'sitemap', async () => {
          const logContext = createDataApiContext('sitemap', {
            path: ctx.pathname,
            method: ctx.method,
          });
          return handleSitemapRoute(
            ctx.segments.slice(1),
            ctx.url,
            ctx.method,
            ctx.request,
            logContext
          );
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

Deno.serve((request) => router(request));

async function handleDirectoryIndex(ctx: DataApiContext): Promise<Response> {
  const response = jsonResponse(
    {
      ok: true,
      resources: [
        { path: 'content/sitewide', description: 'Sitewide README + LLM exports' },
        { path: 'content/paginated', description: 'Paginated content listings' },
        { path: 'content/changelog', description: 'Changelog index + entries' },
        {
          path: 'content/:category/:slug',
          description: 'Content exports (JSON/Markdown/LLMs/storage)',
        },
        { path: 'company', description: 'Public company profile' },
        { path: 'seo', description: 'Metadata + schema JSON for any route' },
        { path: 'feeds', description: 'RSS/Atom feeds for content & changelog' },
        { path: 'sitemap', description: 'Sitemap XML/JSON + IndexNow submitter' },
        { path: 'status', description: 'API health check' },
        { path: 'trending', description: 'Trending/popular/recent content data' },
      ],
    },
    200,
    BASE_CORS
  );

  if (ctx.originalMethod === 'HEAD') {
    return new Response(null, { status: response.status, headers: response.headers });
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
    resource: ctx.segments.length > 1 ? ctx.segments[1] : undefined,
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
      logData.query = query;
    }
    if (ctx.segments.length > 1) {
      logData.resource = ctx.segments[1];
    }
    if (error) {
      logData.error = error instanceof Error ? error.message : String(error);
    }

    if (outcome === 'success') {
      console.log('[data-api] Route hit', { ...logContext, ...logData });
    } else {
      console.error('[data-api] Route error', { ...logContext, ...logData });
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
