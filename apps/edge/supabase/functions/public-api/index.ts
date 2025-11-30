/**
 * Public API - Main entry point for public API edge function
 */

import { analytics } from '@heyclaude/edge-runtime/middleware/analytics.ts';
import { buildStandardContext, type StandardContext } from '@heyclaude/edge-runtime/utils/context.ts';
import { chain } from '@heyclaude/edge-runtime/middleware/chain.ts';
import type { Handler } from '@heyclaude/edge-runtime/middleware/types.ts';
import type { HttpMethod } from '@heyclaude/edge-runtime/utils/router.ts';
import { jsonResponse } from '@heyclaude/edge-runtime/utils/http.ts';
import { rateLimit } from '@heyclaude/edge-runtime/middleware/rate-limit.ts';
import { serveEdgeApp } from '@heyclaude/edge-runtime/app.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@heyclaude/shared-runtime/rate-limit.ts';
import { createDataApiContext } from '@heyclaude/shared-runtime/logging.ts';
import { handleGeneratePackage } from './routes/content-generate/index.ts';
import { handlePackageGenerationQueue } from './routes/content-generate/queue-worker.ts';
import { handleUploadPackage } from './routes/content-generate/upload.ts';
import { handleOGImageRequest } from './routes/og/index.ts';
import { handleTransformImageRoute } from './routes/transform/index.ts';

import { ROUTES } from './routes.config.ts';

/**
 * CORS headers for public API endpoints
 * Includes GET, POST, OPTIONS to support both read and write operations
 */
const PUBLIC_API_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action, Authorization',
};

const BASE_CORS = PUBLIC_API_CORS;
const PUBLIC_API_APP_LABEL = 'public-api';
const analyticsPublic = (routeName: string) => analytics(routeName, { app: PUBLIC_API_APP_LABEL });
const createPublicApiContext = (
  route: string,
  options?: { path?: string; method?: string; resource?: string }
) => createDataApiContext(route, { ...options, app: PUBLIC_API_APP_LABEL });

// Use StandardContext directly as it matches our needs
type PublicApiContext = StandardContext;

/**
 * Enforces a rate limit for the incoming request and returns either a 429 error or the handler's response augmented with rate-limit headers.
 *
 * @param ctx - The request context used to evaluate the rate limit
 * @param preset - The rate limit preset to apply for this request
 * @param handler - Function invoked when the request is allowed; its response will be returned with rate-limit headers
 * @returns A Response. If the request exceeds the limit, a 429 JSON response with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers is returned; otherwise the handler's response is returned augmented with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
 */
async function withRateLimit(
  ctx: PublicApiContext,
  preset: (typeof RATE_LIMIT_PRESETS)[keyof typeof RATE_LIMIT_PRESETS],
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
  'og-image': (ctx) => handleOGImageRequest(ctx.request),
  'transform-image': (ctx) =>
    handleTransformImageRoute({
      request: ctx.request,
      pathname: ctx.pathname,
      method: ctx.method,
      segments: ctx.segments,
    }),
  'content-generate': (ctx) => {
    // segments[0] = 'content', segments[1] = 'generate-package', segments[2] = sub-route
    const subRoute = ctx.segments[2];
    if (subRoute === 'upload') {
      return withRateLimit(ctx, RATE_LIMIT_PRESETS.heavy, () => {
        const logContext = createPublicApiContext('content-generate-upload', {
          path: ctx.pathname,
        });
        return handleUploadPackage(ctx.request, logContext);
      });
    }
    if (subRoute === 'process') {
      return withRateLimit(ctx, RATE_LIMIT_PRESETS.heavy, () => {
        const logContext = createPublicApiContext('content-generate-process', {
          path: ctx.pathname,
        });
        return handlePackageGenerationQueue(ctx.request, logContext);
      });
    }
    return withRateLimit(ctx, RATE_LIMIT_PRESETS.heavy, () => {
      const logContext = createPublicApiContext('content-generate', {
        path: ctx.pathname,
        method: ctx.method,
        resource: 'generate-package',
      });
      return handleGeneratePackage(ctx.request, logContext);
    });
  },
};

/**
 * Create a matcher that determines whether a request path begins with a given segment pattern.
 *
 * Leading and trailing slashes in `pathPattern` are ignored; an empty pattern matches only when the request has no segments.
 *
 * @param pathPattern - Route pattern using `/`-separated segments (for example "search/auto" or "sitemap")
 * @returns `true` if `ctx.segments` begins with the pattern's segments (segment-wise prefix), `false` otherwise
 */
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
const CUSTOM_MATCHERS: Record<string, (ctx: PublicApiContext) => boolean> = {};

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

    let chainHandler: Handler<PublicApiContext> = handler;

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