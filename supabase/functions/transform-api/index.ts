/**
 * Transform API - Unified edge function for data transformations
 * Handles syntax highlighting, content processing, and other expensive operations
 */

import { jsonResponse } from '../_shared/utils/http.ts';
import { createTransformApiContext } from '../_shared/utils/logging.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { handleContentHighlight } from './routes/content.ts';

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

const router = createRouter<TransformApiContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;
    const pathname = url.pathname.replace(/^\/transform-api/, '') || '/';
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
      handler: (ctx) => handleDirectoryIndex(ctx),
    },
    {
      name: 'content-highlight',
      methods: ['POST', 'OPTIONS'],
      cors: BASE_CORS,
      match: (ctx) => ctx.segments[0] === 'content' && ctx.segments[1] === 'highlight',
      handler: (ctx) =>
        respondWithAnalytics(ctx, 'content-highlight', async () => {
          const logContext = createTransformApiContext('content-highlight', {
            path: ctx.pathname,
            method: ctx.method,
          });
          return handleContentHighlight(ctx.request, logContext);
        }),
    },
  ],
});

Deno.serve((request) => router(request));

async function handleDirectoryIndex(ctx: TransformApiContext): Promise<Response> {
  const response = jsonResponse(
    {
      ok: true,
      resources: [
        {
          path: 'content/highlight',
          description: 'Syntax highlighting for code blocks',
          method: 'POST',
        },
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
      logData.error = error instanceof Error ? error.message : String(error);
    }

    if (outcome === 'success') {
      console.log('[transform-api] Route hit', { ...logContext, ...logData });
    } else {
      console.error('[transform-api] Route error', { ...logContext, ...logData });
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
