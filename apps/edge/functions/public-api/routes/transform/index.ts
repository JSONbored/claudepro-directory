/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Transform API Handler
 * Handles syntax highlighting, content processing, and other expensive operations
 */

import { applyRateLimitHeaders, createRateLimitErrorResponse } from '@heyclaude/edge-runtime';
import {
  checkRateLimit,
  createTransformApiContext,
  errorToString,
  logError,
  logInfo,
  RATE_LIMIT_PRESETS,
} from '@heyclaude/shared-runtime';
import { handleContentHighlight, handleContentProcess } from '../../routes/content-process.ts';

// Allow POST for transformation requests
const BASE_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function respondWithAnalytics(
  routeName: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const startedAt = performance.now();
  const logContext = createTransformApiContext(routeName, {
    path: 'transform-api',
    method: 'POST',
  });

  const logEvent = (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const durationMs = Math.round(performance.now() - startedAt);
    const logData: Record<string, unknown> = {
      route: routeName,
      path: 'transform-api',
      method: 'POST',
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

export async function handleContentHighlightRoute(req: Request): Promise<Response> {
  const rateLimit = checkRateLimit(req, RATE_LIMIT_PRESETS.transform);
  if (!rateLimit.allowed) {
    return Promise.resolve(
      createRateLimitErrorResponse(rateLimit, {
        preset: 'transform',
        cors: BASE_CORS,
      })
    );
  }
  return respondWithAnalytics('content-highlight', async () => {
    const logContext = createTransformApiContext('content-highlight', {
      path: 'content/highlight',
      method: 'POST',
    });
    const response = await handleContentHighlight(req, logContext);
    applyRateLimitHeaders(response, rateLimit, 'transform');
    return response;
  });
}

export async function handleContentProcessRoute(req: Request): Promise<Response> {
  const rateLimit = checkRateLimit(req, RATE_LIMIT_PRESETS.transform);
  if (!rateLimit.allowed) {
    return Promise.resolve(
      createRateLimitErrorResponse(rateLimit, {
        preset: 'transform',
        cors: BASE_CORS,
      })
    );
  }
  return respondWithAnalytics('content-process', async () => {
    const logContext = createTransformApiContext('content-process', {
      path: 'content/process',
      method: 'POST',
    });
    const response = await handleContentProcess(req, logContext);
    applyRateLimitHeaders(response, rateLimit, 'transform');
    return response;
  });
}
