/**
 * Public API - Main entry point for public API edge function
 */

import {
  analytics,
  buildStandardContext,
  chain,
  getOnlyCorsHeaders,
  type HttpMethod,
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

import { ROUTES } from './routes.config.ts';

const BASE_CORS = getOnlyCorsHeaders;
const PUBLIC_API_APP_LABEL = 'public-api';
const analyticsPublic = (routeName: string) => analytics(routeName, { app: PUBLIC_API_APP_LABEL });
const createPublicApiContext = (
  route: string,
  options?: { path?: string; method?: string; resource?: string }
) => createDataApiContext(route, { ...options, app: PUBLIC_API_APP_LABEL });

// Use StandardContext directly as it matches our needs
type PublicApiContext = StandardContext;

// Helper to deduplicate manual rate limiting logic
async function withRateLimit(
  ctx: PublicApiContext,
  preset: typeof RATE_LIMIT_PRESETS.heavy,
  handler: () => Promise<Response>
): Promise<Response> {
  const rateLimitResult = checkRateLimit(ctx.request, preset);
  if (!rateLimitResult.allowed) {
    return jsonResponse(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      },
      429,
      BASE_CORS,
      {
        'Retry-After': String(rateLimitResult.retryAfter ?? 60),
        'X-RateLimit-Limit': String(preset.maxRequests),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetAt),
      }
    );
  }

  const response = await handler();
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(preset.maxRequests));
  headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));
  return new Response(response.body, { status: response.status, headers });
}

// Define handlers map
const ROUTE_HANDLERS: Record<string, (ctx: PublicApiContext) => Promise<Response>> = {
  root: (ctx) => handleDirectoryIndex(ctx),
  'og-image': (ctx) => handleOGImageRequest(ctx.request, performance.now()),
  'search-autocomplete': (ctx) => handleAutocomplete(ctx.request, performance.now()),
  'search-facets': () => handleFacets(performance.now()),
  'search-main': (ctx) => handleSearch(ctx.request, performance.now()),
  'transform-highlight': (ctx) => handleContentHighlightRoute(ctx.request),
  'transform-process': (ctx) => handleContentProcessRoute(ctx.request),
  'content-generate': async (ctx) => {
    // Check for sub-routes
    if (ctx.segments[2] === 'upload') {
      return withRateLimit(ctx, RATE_LIMIT_PRESETS.heavy, async () => {
        const logContext = createPublicApiContext('content-generate-upload', {
          path: ctx.pathname,
        });
        return handleUploadPackage(ctx.request, logContext);
      });
    }
    if (ctx.segments[2] === 'process') {
      return withRateLimit(ctx, RATE_LIMIT_PRESETS.heavy, async () =>
        handlePackageGenerationQueue(ctx.request)
      );
    }
    return withRateLimit(ctx, RATE_LIMIT_PRESETS.heavy, async () => {
      const logContext = createPublicApiContext('content-generate', {
        path: ctx.pathname,
        method: ctx.method,
        resource: 'generate-package',
      });
      return handleGeneratePackage(ctx.request, logContext);
    });
  },
  content: (ctx) => {
    const logContext = createPublicApiContext('content', {
      path: ctx.pathname,
      method: ctx.method,
      ...(ctx.segments.length > 1 && ctx.segments[1] !== undefined
        ? { resource: ctx.segments[1] }
        : {}),
    });
    return handleContentRoute(ctx.segments.slice(1), ctx.url, ctx.method, ctx.request, logContext);
  },
  feeds: (ctx) => handleFeedsRoute(ctx.segments.slice(1), ctx.url, ctx.method),
  seo: (ctx) => {
    const logContext = createPublicApiContext('seo', {
      path: ctx.pathname,
      method: ctx.method,
    });
    return handleSeoRoute(ctx.segments.slice(1), ctx.url, ctx.method, logContext);
  },
  sitemap: (ctx) => {
    const logContext = createPublicApiContext('sitemap', {
      path: ctx.pathname,
      method: ctx.method,
    });
    return handleSitemapRoute(ctx.segments.slice(1), ctx.url, ctx.method, ctx.request, logContext);
  },
  status: (ctx) => handleStatusRoute(ctx.segments.slice(1), ctx.url, ctx.method),
  company: (ctx) => handleCompanyRoute(ctx.segments.slice(1), ctx.url, ctx.method),
  trending: (ctx) => handleTrendingRoute(ctx.segments.slice(1), ctx.url, ctx.method),
};

// Matcher generator
function createPathMatcher(pathPattern: string) {
  const parts = pathPattern.split('/').filter(Boolean);
  return (ctx: PublicApiContext) => {
    if (parts.length === 0) return ctx.segments.length === 0;
    // Exact match for specified segments, allowing trailing segments (prefix match)
    if (ctx.segments.length < parts.length) return false;
    for (let i = 0; i < parts.length; i++) {
      if (ctx.segments[i] !== parts[i]) return false;
    }
    return true;
  };
}

// Custom matchers for special cases
const CUSTOM_MATCHERS: Record<string, (ctx: PublicApiContext) => boolean> = {
  sitemap: (ctx) => {
    const first = ctx.segments[0];
    return first === 'sitemap' || first === 'sitemap.xml';
  },
  'search-main': (ctx) => {
    const primary = ctx.segments[0];
    const secondary = ctx.segments[1] ?? '';
    return primary === 'search' && !['autocomplete', 'facets'].includes(secondary);
  },
};

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
  routes: ROUTES.map((route) => {
    const handler = ROUTE_HANDLERS[route.name];
    if (!handler) throw new Error(`Missing handler for route: ${route.name}`);

    let chainHandler = handler;

    // Apply rate limit if configured
    if (route.rateLimit) {
      chainHandler = chain<PublicApiContext>(rateLimit(route.rateLimit))(chainHandler);
    }

    // Apply analytics
    chainHandler = chain<PublicApiContext>(analyticsPublic(route.analytics || route.name))(
      chainHandler
    );

    return {
      name: route.name,
      methods: route.methods as readonly HttpMethod[],
      cors: BASE_CORS,
      match: CUSTOM_MATCHERS[route.name] || createPathMatcher(route.path),
      handler: chainHandler,
    };
  }),
});
