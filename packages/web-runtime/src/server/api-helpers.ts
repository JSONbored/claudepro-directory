/**
 * API Route Helper Utilities
 * 
 * These are utility functions for Next.js API routes, NOT server actions.
 * Do not add 'use server' directive - these are used in route handlers.
 */

import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import { NextResponse } from 'next/server';

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
 * @deprecated This function is no longer needed for API routes using Next.js Cache Components.
 * Next.js Cache Components automatically set HTTP cache headers based on `cacheLife()` profiles.
 * This function is kept for edge cases or non-Cache Component routes, but should not be used
 * in API routes that use `'use cache'` + `cacheLife()`.
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
 * // DEPRECATED: Don't use in API routes with Cache Components
 * // const headers = buildCacheHeaders('search');
 * 
 * // Instead, use Cache Components:
 * // 'use cache';
 * // cacheLife('short');
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

/**
 * Creates a standardized 401 Unauthorized response
 * 
 * Returns a consistent error response for authentication failures.
 * Optionally includes login/signup URLs for user-facing endpoints.
 * 
 * @param message - Error message to return
 * @param authInfo - Optional authentication info (login/signup URLs for user-facing endpoints)
 * @param corsHeaders - CORS headers to include
 * @returns NextResponse with 401 status
 * 
 * @example
 * ```ts
 * // For automation endpoints (no user-facing message)
 * return unauthorizedResponse('Invalid or missing Bearer token', undefined, postCorsHeaders);
 * 
 * // For user-facing endpoints (with login/signup URLs)
 * return unauthorizedResponse('Authentication required', {
 *   loginUrl: '/login',
 *   signupUrl: '/signup',
 *   message: 'Please sign in to access this endpoint',
 * }, getWithAuthCorsHeaders);
 * ```
 */
export function unauthorizedResponse(
  message: string,
  authInfo?: {
    loginUrl?: string;
    signupUrl?: string;
    message?: string;
  },
  corsHeaders: Record<string, string> = getOnlyCorsHeaders
): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message,
      code: 'UNAUTHORIZED',
      ...(authInfo && {
        auth: {
          required: true,
          loginUrl: authInfo.loginUrl ?? '/login',
          signupUrl: authInfo.signupUrl ?? '/signup',
          message: authInfo.message ?? 'Please sign in to access this endpoint',
        },
      }),
      // Timestamp removed - logging platforms add timestamps automatically
      // This eliminates new Date() calls during build
    },
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'WWW-Authenticate': 'Bearer',
        ...buildSecurityHeaders(),
        ...corsHeaders,
      },
    }
  );
}

/**
 * Creates a standardized text/plain response (for LLMs.txt, Markdown, etc.)
 * 
 * @param content - Text content to return
 * @param status - HTTP status code (default: 200)
 * @param corsHeaders - CORS headers to include
 * @param additionalHeaders - Additional headers (e.g., X-Generated-By)
 * @returns NextResponse with text/plain content type
 */
export function textResponse(
  content: string,
  status: number = 200,
  corsHeaders: Record<string, string> = getOnlyCorsHeaders,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return new NextResponse(content, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...buildSecurityHeaders(),
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Creates a standardized XML response (for RSS, Atom, Sitemap, etc.)
 * 
 * @param xml - XML content to return
 * @param contentType - Content type (e.g., 'application/rss+xml; charset=utf-8')
 * @param status - HTTP status code (default: 200)
 * @param corsHeaders - CORS headers to include
 * @param additionalHeaders - Additional headers (e.g., X-Generated-By)
 * @returns NextResponse with XML content type
 */
export function xmlResponse(
  xml: string,
  contentType: string = 'application/xml; charset=utf-8',
  status: number = 200,
  corsHeaders: Record<string, string> = getOnlyCorsHeaders,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return new NextResponse(xml, {
    status,
    headers: {
      'Content-Type': contentType,
      ...buildSecurityHeaders(),
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Creates a standardized Markdown response with download headers
 * 
 * @param markdown - Markdown content to return
 * @param filename - Filename for download (e.g., 'content.md')
 * @param status - HTTP status code (default: 200)
 * @param corsHeaders - CORS headers to include
 * @param additionalHeaders - Additional headers
 * @returns NextResponse with text/markdown content type and download headers
 */
export function markdownResponse(
  markdown: string,
  filename: string,
  status: number = 200,
  corsHeaders: Record<string, string> = getWithAcceptCorsHeaders,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return new NextResponse(markdown, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...buildSecurityHeaders(),
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

// =============================================================================
// API Route Handler Factory
// =============================================================================
// NOTE: createApiHandler was removed - all routes use createApiRoute from route-factory.ts
// This provides better features: Zod validation, OpenAPI support, auth handling, etc.
