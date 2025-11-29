/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

import { jsonResponse } from '@heyclaude/edge-runtime/utils/http.ts';
import { applyRateLimitHeaders, createRateLimitErrorResponse } from '@heyclaude/edge-runtime/utils/rate-limit-middleware.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@heyclaude/shared-runtime/rate-limit.ts';
import { handleLogoOptimizeRoute } from './image/logo.ts';
import { handleThumbnailGenerateRoute } from './image/thumbnail.ts';
import { handleContentCardGenerateRoute } from './image/card.ts';

const BASE_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface TransformImageRouteContext {
  request: Request;
  pathname: string;
  method: string;
  segments: string[];
}

export async function handleTransformImageRoute(
  ctx: TransformImageRouteContext
): Promise<Response> {
  const { request, segments } = ctx;
  const subRoute = segments[2];

  if (!subRoute) {
    return jsonResponse(
      {
        error: 'No route specified',
        message: 'Please specify a sub-route',
        availableRoutes: ['/transform/image/logo', '/transform/image/thumbnail', '/transform/image/card'],
      },
      400,
      BASE_CORS
    );
  }

  const rateLimit = checkRateLimit(request, RATE_LIMIT_PRESETS.heavy);
  if (!rateLimit.allowed) {
    return createRateLimitErrorResponse(rateLimit, {
      preset: 'heavy',
      cors: BASE_CORS,
    });
  }

  const respond = async () => {
    if (subRoute === 'logo') {
      return handleLogoOptimizeRoute(request);
    }

    if (subRoute === 'thumbnail') {
      return handleThumbnailGenerateRoute(request);
    }

    if (subRoute === 'card') {
      return handleContentCardGenerateRoute(request);
    }

    return jsonResponse(
      {
        error: 'Not Found',
        message: 'Unknown image transform route',
        path: ctx.pathname,
        availableRoutes: ['/transform/image/logo', '/transform/image/thumbnail', '/transform/image/card'],
      },
      404,
      BASE_CORS
    );
  };

  const response = await respond();
  applyRateLimitHeaders(response, rateLimit, 'heavy');
  return response;
}