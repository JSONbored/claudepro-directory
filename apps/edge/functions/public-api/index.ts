/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

import {
  analytics,
  buildStandardContext,
  chain,
  getOnlyCorsHeaders,
  jsonResponse,
  rateLimit,
  type StandardContext,
  serveEdgeApp,
} from '@heyclaude/edge-runtime';
import {
  checkRateLimit,
  createDataApiContext,
  RATE_LIMIT_PRESETS,
} from '@heyclaude/shared-runtime';
import { handleCompanyRoute } from './routes/company.ts';
import { handleContentRoute } from './routes/content.ts';
import { handleGeneratePackage } from './routes/content-generate/index.ts';
import { handlePackageGenerationQueue } from './routes/content-generate/queue-worker.ts';
import { handleUploadPackage } from './routes/content-generate/upload.ts';
import { handleFeedsRoute } from './routes/feeds.ts';
import { handleOGImageRequest } from './routes/og/index.ts';
import { handleDirectoryIndex } from './routes/root.ts';
import { handleAutocomplete, handleFacets, handleSearch } from './routes/search/index.ts';
import { handleSeoRoute } from './routes/seo.ts';
import { handleSitemapRoute } from './routes/sitemap.ts';
import { handleStatusRoute } from './routes/status.ts';
import {
  handleContentHighlightRoute,
  handleContentProcessRoute,
} from './routes/transform/index.ts';
import { handleTrendingRoute } from './routes/trending.ts';

const BASE_CORS = getOnlyCorsHeaders;
const PUBLIC_API_APP_LABEL = 'public-api';
const analyticsPublic = (routeName: string) => analytics(routeName, { app: PUBLIC_API_APP_LABEL });
const createPublicApiContext = (
  route: string,
  options?: { path?: string; method?: string; resource?: string }
) => createDataApiContext(route, { ...options, app: PUBLIC_API_APP_LABEL });

// Use StandardContext directly as it matches our needs
type PublicApiContext = StandardContext;

serveEdgeApp<PublicApiContext>({
  buildContext: (request) =>
    buildStandardContext(request, ['/functions/v1/public-api', '/public-api']),
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
      handler: chain(analyticsPublic('root'))((ctx) => handleDirectoryIndex(ctx)),
    },

    {
      name: 'og-image',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'og',
      handler: chain(analyticsPublic('og-image'))((ctx) =>
        handleOGImageRequest(ctx.request, performance.now())
      ),
    },

    {
      name: 'search-autocomplete',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'search' && ctx.segments[1] === 'autocomplete',
      handler: chain(analyticsPublic('search-autocomplete'))((ctx) =>
        handleAutocomplete(ctx.request, performance.now())
      ),
    },

    {
      name: 'search-facets',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'search' && ctx.segments[1] === 'facets',
      handler: chain(analyticsPublic('search-facets'))(() => handleFacets(performance.now())),
    },

    {
      name: 'search-main',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => {
        const primary = ctx.segments[0];
        const secondary = ctx.segments[1] ?? '';
        return primary === 'search' && !['autocomplete', 'facets'].includes(secondary);
      },
      handler: chain(analyticsPublic('search-main'))((ctx) =>
        handleSearch(ctx.request, performance.now())
      ),
    },

    {
      name: 'transform-highlight',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'transform' && ctx.segments[1] === 'highlight',
      handler: chain(analyticsPublic('transform-highlight'))((ctx) =>
        handleContentHighlightRoute(ctx.request)
      ),
    },

    {
      name: 'transform-process',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'transform' && ctx.segments[1] === 'process',
      handler: chain(analyticsPublic('transform-process'))((ctx) =>
        handleContentProcessRoute(ctx.request)
      ),
    },

    {
      name: 'content-generate',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content' && ctx.segments[1] === 'generate-package',
      handler: chain(analyticsPublic('content-generate'))(async (ctx) => {
        // Check for sub-routes
        if (ctx.segments[2] === 'upload') {
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
          const logContext = createPublicApiContext('content-generate-upload', {
            path: ctx.pathname,
          });
          const response = await handleUploadPackage(ctx.request, logContext);
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
          return new Response(response.body, { status: response.status, headers });
        }
        if (ctx.segments[2] === 'process') {
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
          const headers = new Headers(response.headers);
          headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
          headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
          return new Response(response.body, { status: response.status, headers });
        }
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
        const logContext = createPublicApiContext('content-generate', {
          path: ctx.pathname,
          method: ctx.method,
          resource: 'generate-package',
        });
        const response = await handleGeneratePackage(ctx.request, logContext);
        const headers = new Headers(response.headers);
        headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PRESETS.heavy.maxRequests));
        headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
        return new Response(response.body, { status: response.status, headers });
      }),
    },

    {
      name: 'content',
      methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content',
      handler: chain(
        analyticsPublic('content'),
        rateLimit('public')
      )((ctx) => {
        const logContext = createPublicApiContext('content', {
          path: ctx.pathname,
          method: ctx.method,
          ...(ctx.segments.length > 1 && ctx.segments[1] !== undefined
            ? { resource: ctx.segments[1] }
            : {}),
        });
        return handleContentRoute(
          ctx.segments.slice(1),
          ctx.url,
          ctx.method,
          ctx.request,
          logContext
        );
      }),
    },

    {
      name: 'feeds',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'feeds',
      handler: chain(analyticsPublic('feeds'))((ctx) =>
        handleFeedsRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },

    {
      name: 'seo',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'seo',
      handler: chain(analyticsPublic('seo'))((ctx) => {
        const logContext = createPublicApiContext('seo', {
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
        return firstSegment === 'sitemap' || firstSegment === 'sitemap.xml';
      },
      handler: chain(
        analyticsPublic('sitemap'),
        rateLimit('heavy')
      )((ctx) => {
        const logContext = createPublicApiContext('sitemap', {
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
      handler: chain(analyticsPublic('status'))((ctx) =>
        handleStatusRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },

    {
      name: 'company',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'company',
      handler: chain(analyticsPublic('company'))((ctx) =>
        handleCompanyRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },

    {
      name: 'trending',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'trending',
      handler: chain(analyticsPublic('trending'))((ctx) =>
        handleTrendingRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },
  ],
});
