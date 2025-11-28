/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Transform API Handler
 * Handles syntax highlighting, content processing, and other expensive operations
 */

import { applyRateLimitHeaders, createRateLimitErrorResponse, initRequestLogging, traceStep } from '@heyclaude/edge-runtime';
import {
  checkRateLimit,
  createTransformApiContext,
  errorToString,
  logError,
  logInfo,
  logger,
  RATE_LIMIT_PRESETS,
} from '@heyclaude/shared-runtime';
import { handleContentHighlight, handleContentProcess } from '../../routes/content-process.ts';

// Allow POST for transformation requests
const BASE_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Executes a handler while emitting analytics for the given transform route.
 *
 * Logs a success or error event containing route, path, method, status, and optional error details; errors are logged and rethrown.
 *
 * @param routeName - Identifier used in analytics for the route
 * @param handler - Callback that performs the route work and yields a Response
 * @returns The Response produced by the handler
 * @throws Rethrows any error produced by the handler after logging it
 */
function respondWithAnalytics(
  routeName: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const logContext = createTransformApiContext(routeName, {
    path: 'transform-api',
    method: 'POST',
  });

  const logEvent = async (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const logData: Record<string, unknown> = {
      route: routeName,
      path: 'transform-api',
      method: 'POST',
      status,
    };

    if (error) {
      logData['error'] = errorToString(error);
    }

    if (outcome === 'success') {
      logInfo('Route hit', { ...logContext, ...logData });
    } else {
      await logError('Route error', { ...logContext, ...logData }, error);
    }
  };

  return handler()
    .then(async (response) => {
      await logEvent(response.status, 'success');
      return response;
    })
    .catch(async (error) => {
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
      await logEvent(status, 'error', error);
      throw error;
    });
}

/**
 * Process a content highlight transform request, enforcing rate limits and recording request analytics.
 *
 * @param req - Incoming HTTP request for content highlighting (expected POST to the transform endpoint)
 * @returns A Response with the highlighted content on success, or an error response; if the request exceeds rate limits, returns a rate-limit error response that includes CORS headers
 */
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
    
    // Initialize request logging with trace and bindings
    initRequestLogging(logContext);
    traceStep('Content highlight request received', logContext);
    
    // Set bindings for this request
    logger.setBindings({
      requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
      operation: typeof logContext['action'] === "string" ? logContext['action'] : 'content-highlight',
      method: req.method,
    });
    
    const response = await handleContentHighlight(req, logContext);
    applyRateLimitHeaders(response, rateLimit, 'transform');
    return response;
  });
}

/**
 * Handle the content processing transform route, enforcing rate limits, initializing logging/tracing, and returning the processed response.
 *
 * If the request exceeds the transform rate limit, returns a rate-limit error response with the module's CORS headers. For allowed requests, initializes request logging and tracing, binds request metadata to the logger, invokes content processing, and attaches rate-limit headers to the response.
 *
 * @param req - Incoming HTTP request for the content processing route
 * @returns The HTTP response to return to the client; a rate-limit error response with CORS headers when over the limit, otherwise the processed response with rate-limit headers applied
 */
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
    
    // Initialize request logging with trace and bindings
    initRequestLogging(logContext);
    traceStep('Content process request received', logContext);
    
    // Set bindings for this request
    logger.setBindings({
      requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
      operation: typeof logContext['action'] === "string" ? logContext['action'] : 'content-process',
      method: req.method,
    });
    
    const response = await handleContentProcess(req, logContext);
    applyRateLimitHeaders(response, rateLimit, 'transform');
    return response;
  });
}