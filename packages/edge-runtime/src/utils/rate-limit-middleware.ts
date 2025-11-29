/**
 * Rate limiting middleware helper
 * Reduces code duplication for rate limiting across edge functions
 */

import {
  badRequestResponse,
  jsonResponse,
  publicCorsHeaders,
} from '@heyclaude/edge-runtime/utils/http.ts';
import type { RateLimitResult } from '@heyclaude/shared-runtime/rate-limit.ts';
import { RATE_LIMIT_PRESETS } from '@heyclaude/shared-runtime/rate-limit.ts';
import type { RouterContext } from '@heyclaude/edge-runtime/utils/router.ts';

export interface RateLimitMiddlewareOptions {
  preset: keyof typeof RATE_LIMIT_PRESETS;
  cors?: typeof publicCorsHeaders;
  errorResponseType?: 'json' | 'badRequest';
}

/**
 * Apply rate limit headers to a response
 */
export function applyRateLimitHeaders(
  response: Response,
  rateLimit: RateLimitResult,
  preset: keyof typeof RATE_LIMIT_PRESETS
): void {
  const config = RATE_LIMIT_PRESETS[preset];
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
  if (rateLimit.retryAfter) {
    response.headers.set('Retry-After', String(rateLimit.retryAfter));
  }
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(
  rateLimit: RateLimitResult,
  options: RateLimitMiddlewareOptions
): Response {
  const { preset, cors = publicCorsHeaders, errorResponseType = 'json' } = options;
  const config = RATE_LIMIT_PRESETS[preset];

  const headers: Record<string, string> = {
    ...cors,
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
    ...(rateLimit.retryAfter && {
      'Retry-After': String(rateLimit.retryAfter),
    }),
  };

  if (errorResponseType === 'badRequest') {
    return badRequestResponse(
      `Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`,
      cors,
      headers
    );
  }

  return jsonResponse(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: rateLimit.retryAfter,
    },
    429,
    cors,
    headers
  );
}

/**
 * Wrap a handler with rate limiting
 * Returns the handler response with rate limit headers, or rate limit error if exceeded
 */
export async function withRateLimit<T extends RouterContext>(
  ctx: T,
  rateLimit: RateLimitResult,
  handler: (ctx: T) => Promise<Response>,
  options: RateLimitMiddlewareOptions
): Promise<Response> {
  if (!rateLimit.allowed) {
    return createRateLimitErrorResponse(rateLimit, options);
  }

  const response = await handler(ctx);
  applyRateLimitHeaders(response, rateLimit, options.preset);
  return response;
}
