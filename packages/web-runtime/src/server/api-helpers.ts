/**
 * API Route Helper Utilities
 * 
 * These are utility functions for Next.js API routes, NOT server actions.
 * Do not add 'use server' directive - these are used in route handlers.
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger, toLogContextValue, type LogContext } from '../logging/server.ts';

export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action, Authorization',
};

export const getOnlyCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const getWithAuthCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const getWithAcceptCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export const postCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT_CACHE_PRESETS = {
  content_export: { ttl: 60 * 60 * 24 * 7, stale: 60 * 60 * 24 * 14 },
  content_paginated: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 },
  feeds: { ttl: 600, stale: 3600 },
  seo: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 },
  sitemap: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 },
  status: { ttl: 60, stale: 120 },
  company_profile: { ttl: 60 * 30, stale: 60 * 60 },
  trending_page: { ttl: 60 * 60, stale: 60 * 60 * 6 },
  trending_sidebar: { ttl: 600, stale: 3600 },
  search: { ttl: 300, stale: 600 },
  search_autocomplete: { ttl: 3600, stale: 3600 },
  search_facets: { ttl: 3600, stale: 3600 },
  transform: { ttl: 60 * 60 * 24 * 365, stale: 60 * 60 * 24 * 365 },
  config: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 },
} as const;

export type CachePresetKey = keyof typeof DEFAULT_CACHE_PRESETS;

/**
 * Build cache headers for API responses with preset configurations.
 *
 * In development mode, adds `X-Cache-Debug` header showing the applied
 * cache configuration for easier debugging.
 *
 * @param key - Cache preset key from DEFAULT_CACHE_PRESETS
 * @param overrides - Optional TTL/stale overrides
 * @returns Headers object with cache directives
 *
 * @example
 * ```ts
 * // Use preset
 * const headers = buildCacheHeaders('search');
 *
 * // With overrides
 * const headers = buildCacheHeaders('search', { ttl: 60 });
 * ```
 */
export function buildCacheHeaders(
  key: CachePresetKey,
  overrides?: Partial<{ ttl: number; stale: number }>
): Record<string, string> {
  const preset = DEFAULT_CACHE_PRESETS[key];
  const ttl = Math.max(1, overrides?.ttl ?? preset.ttl);
  const stale = Math.max(ttl, overrides?.stale ?? preset.stale);
  const value = `public, s-maxage=${ttl}, stale-while-revalidate=${stale}`;

  const headers: Record<string, string> = {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
    'Vercel-CDN-Cache-Control': value,
  };

  // Add debug header in development for cache configuration visibility
  if (process.env.NODE_ENV === 'development') {
    headers['X-Cache-Debug'] = JSON.stringify({
      preset: key,
      ttl,
      stale,
      hasOverrides: !!overrides,
    });
  }

  return headers;
}

export function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string> = getOnlyCorsHeaders,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildSecurityHeaders(),
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

export function badRequestResponse(
  message: string,
  corsHeaders: Record<string, string> = getOnlyCorsHeaders
): NextResponse {
  return jsonResponse({ error: 'Bad Request', message }, 400, corsHeaders);
}

export function methodNotAllowedResponse(
  allowedMethod: string,
  corsHeaders: Record<string, string> = getOnlyCorsHeaders
): NextResponse {
  return NextResponse.json(
    { error: 'Method not allowed', allowed: allowedMethod },
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: allowedMethod,
        ...buildSecurityHeaders(),
        ...corsHeaders,
      },
    }
  );
}

export function handleOptionsRequest(
  corsHeaders: Record<string, string> = getOnlyCorsHeaders
): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...buildSecurityHeaders(),
      ...corsHeaders,
    },
  });
}

// =============================================================================
// API Route Handler Factory
// =============================================================================

/**
 * Context object provided to API route handlers
 */
export interface ApiRouteContext {
  /** Scoped logger with request context */
  logger: ReturnType<typeof logger.child>;
  /** The original Next.js request */
  request: NextRequest;
  /** URL parsed from the request */
  url: URL;
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Create an error response with proper logging */
  errorResponse: (error: unknown, additionalContext?: Record<string, unknown>) => NextResponse;
}

/**
 * Configuration for creating an API route handler
 */
export interface ApiRouteConfig {
  /** Operation name for logging (e.g., 'SearchAPI', 'FacetsAPI') */
  operation: string;
  /** Route path for logging (e.g., '/api/search') */
  route: string;
  /** CORS headers to use (default: getOnlyCorsHeaders) */
  cors?: Record<string, string>;
}

/**
 * Handler function signature for API routes
 */
export type ApiRouteHandler = (ctx: ApiRouteContext) => Promise<NextResponse>;

/**
 * Creates a standardized API route handler with automatic:
 * - Scoped logging
 * - Error handling and response formatting
 * - CORS headers
 *
 * This factory eliminates ~15-20 lines of boilerplate per route handler.
 *
 * @param config - Route configuration
 * @param handler - The route handler function
 * @returns A Next.js route handler function
 *
 * @example
 * ```ts
 * // Before (verbose)
 * export async function GET(request: NextRequest) {
 *   const reqLogger = logger.child({
 *     operation: 'SearchAPI',
 *     route: '/api/search',
 *     method: 'GET',
 *   });
 *   try {
 *     // ... handler logic ...
 *   } catch (error) {
 *     return createErrorResponse(error, { ... });
 *   }
 * }
 *
 * // After (concise)
 * export const GET = createApiHandler(
 *   { operation: 'SearchAPI', route: '/api/search' },
 *   async (ctx) => {
 *     ctx.logger.info('Search request received');
 *     // ... handler logic ...
 *     return jsonResponse(data, 200, ctx.cors);
 *   }
 * );
 * ```
 */
export function createApiHandler(
  config: ApiRouteConfig,
  handler: ApiRouteHandler
): (request: NextRequest) => Promise<NextResponse> {
  const { operation, route } = config;

  return async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method;
    
    const reqLogger = logger.child({
      operation,
      route,
      method,
    });

    const errorResponse = (
      error: unknown,
      additionalContext?: Record<string, unknown>
    ): NextResponse => {
      const normalized = normalizeError(error, `${operation} failed`);
      // Convert additionalContext to LogContext format (toLogContextValue ensures type safety)
      const logContext: LogContext = {};
      if (additionalContext) {
        for (const [key, value] of Object.entries(additionalContext)) {
          logContext[key] = toLogContextValue(value);
        }
      }
      reqLogger.error({ err: normalized, ...logContext }, `${operation} failed`);
      return NextResponse.json(
        { error: normalized.message },
        { status: 500, headers: buildSecurityHeaders() }
      );
    };

    const ctx: ApiRouteContext = {
      logger: reqLogger,
      request,
      url: request.nextUrl,
      method,
      errorResponse,
    };

    try {
      return await handler(ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Creates a standardized OPTIONS handler for CORS preflight requests
 *
 * @param cors - CORS headers to use
 * @returns A Next.js OPTIONS handler
 *
 * @example
 * ```ts
 * export const OPTIONS = createOptionsHandler(getWithAuthCorsHeaders);
 * ```
 */
export function createOptionsHandler(
  cors: Record<string, string> = getOnlyCorsHeaders
): () => NextResponse {
  return () => handleOptionsRequest(cors);
}
