/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * Transform API - Unified edge function for data transformations
 * Handles syntax highlighting, content processing, and other expensive operations
 */

import { errorToString } from '../_shared/utils/error-handling.ts';
import { jsonResponse } from '../_shared/utils/http.ts';
import { createTransformApiContext, logError, logInfo } from '../_shared/utils/logging.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '../_shared/utils/rate-limit.ts';
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
} from '../_shared/utils/rate-limit-middleware.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { handleContentHighlight } from './routes/content.ts';
import { handleContentProcess } from './routes/content-process.ts';

// Allow POST for transformation requests
const BASE_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface TransformApiContext extends RouterContext {
  pathname: string;
  segments: string[];
  searchParams: URLSearchParams;
}

// Type guard to validate HTTP method
function isValidHttpMethod(value: string): value is HttpMethod {
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  for (const validMethod of validMethods) {
    if (value === validMethod) {
      return true;
    }
  }
  return false;
}

const router = createRouter<TransformApiContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const methodUpper = request.method.toUpperCase();
    const originalMethod = isValidHttpMethod(methodUpper) ? methodUpper : 'GET';
    const normalizedMethod = originalMethod === 'HEAD' ? 'GET' : originalMethod;

    // Strict pathname normalization (prevent path traversal)
    let pathname = url.pathname;
    if (pathname.startsWith('/functions/v1/transform-api')) {
      pathname = pathname.slice('/functions/v1/transform-api'.length);
    } else if (pathname.startsWith('/transform-api')) {
      pathname = pathname.slice('/transform-api'.length);
    }
    pathname = pathname || '/';
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
        message: 'Unknown transformation resource',
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
      handler: (ctx) => Promise.resolve(handleDirectoryIndex(ctx)),
    },
    {
      name: 'content-highlight',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content' && ctx.segments[1] === 'highlight',
      handler: function handleContentHighlightRoute(ctx: TransformApiContext): Promise<Response> {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.transform);
        if (!rateLimit.allowed) {
          return Promise.resolve(
            createRateLimitErrorResponse(rateLimit, {
              preset: 'transform',
              cors: BASE_CORS,
            })
          );
        }
        return respondWithAnalytics(ctx, 'content-highlight', async () => {
          const logContext = createTransformApiContext('content-highlight', {
            path: ctx.pathname,
            method: ctx.method,
          });
          const response = await handleContentHighlight(ctx.request, logContext);
          applyRateLimitHeaders(response, rateLimit, 'transform');
          return response;
        });
      },
    },
    {
      name: 'content-process',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content' && ctx.segments[1] === 'process',
      handler: function handleContentProcessRoute(ctx: TransformApiContext): Promise<Response> {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.transform);
        if (!rateLimit.allowed) {
          return Promise.resolve(
            createRateLimitErrorResponse(rateLimit, {
              preset: 'transform',
              cors: BASE_CORS,
            })
          );
        }
        return respondWithAnalytics(ctx, 'content-process', async () => {
          const logContext = createTransformApiContext('content-process', {
            path: ctx.pathname,
            method: ctx.method,
          });
          const response = await handleContentProcess(ctx.request, logContext);
          applyRateLimitHeaders(response, rateLimit, 'transform');
          return response;
        });
      },
    },
  ],
});

Deno.serve((request) => router(request));

function handleDirectoryIndex(ctx: TransformApiContext): Response {
  const response = jsonResponse(
    {
      ok: true,
      resources: [
        {
          path: 'content/highlight',
          description: 'Syntax highlighting for code blocks',
          method: 'POST',
        },
        {
          path: 'content/process',
          description:
            'Batched content processing (language detection + filename generation + highlighting)',
          method: 'POST',
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
  ctx: TransformApiContext,
  routeName: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const startedAt = performance.now();
  const logContext = createTransformApiContext(routeName, {
    path: ctx.pathname,
    method: ctx.method,
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

    if (error) {
      logData['error'] = errorToString(error);
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
      let status = 500;
      if (error instanceof Response) {
        status = error.status;
      } else if (typeof error === 'object' && error !== null) {
        const getProperty = (obj: unknown, key: string): unknown => {
          if (typeof obj !== 'object' || obj === null) {
            return undefined;
          }
          const desc = Object.getOwnPropertyDescriptor(obj, key);
          return desc?.value;
        };

        const statusValue = getProperty(error, 'status');
        if (typeof statusValue === 'number') {
          status = statusValue;
        }
      }
      logEvent(status, 'error', error);
      throw error;
    });
}
