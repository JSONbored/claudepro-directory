/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

import {
  analytics,
  buildStandardContext,
  chain,
  rateLimit,
  type StandardContext,
  serveEdgeApp,
} from '@heyclaude/edge-runtime';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/edge-runtime/utils/http.ts';
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
import { handleSeoRoute } from './routes/seo.ts';
import { handleSitemapRoute } from './routes/sitemap.ts';
import { handleStatusRoute } from './routes/status.ts';
import { handleTrendingRoute } from './routes/trending.ts';

const BASE_CORS = getOnlyCorsHeaders;

// Use StandardContext directly as it matches our needs
type DataApiContext = StandardContext;

serveEdgeApp<DataApiContext>({
  buildContext: (request) => buildStandardContext(request, ['/functions/v1/data-api', '/data-api']),
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
      handler: chain(analytics('root'))((ctx) => handleDirectoryIndex(ctx)),
    },
    {
      name: 'content-generate',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content' && ctx.segments[1] === 'generate-package',
      handler: chain(analytics('content-generate'))(async (ctx) => {
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
      handler: chain(
        analytics('content'),
        rateLimit((ctx) => (ctx.method === 'POST' ? 'heavy' : 'public'))
      )(async (ctx) => {
        const logContext = createDataApiContext('content', {
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
      handler: chain(analytics('feeds'))((ctx) =>
        handleFeedsRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },
    {
      name: 'seo',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'seo',
      handler: chain(analytics('seo'))(async (ctx) => {
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
      handler: chain(
        analytics('sitemap'),
        rateLimit((ctx) => (ctx.method === 'POST' ? 'indexnow' : 'heavy'))
      )(async (ctx) => {
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
      handler: chain(analytics('status'))((ctx) =>
        handleStatusRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },
    {
      name: 'company',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'company',
      handler: chain(analytics('company'))((ctx) =>
        handleCompanyRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },
    {
      name: 'trending',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'trending',
      handler: chain(analytics('trending'))((ctx) =>
        handleTrendingRoute(ctx.segments.slice(1), ctx.url, ctx.method)
      ),
    },
  ],
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
