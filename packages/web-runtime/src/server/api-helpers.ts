/**
 * API Route Helper Utilities
 * 
 * These are utility functions for Next.js API routes, NOT server actions.
 * Do not add 'use server' directive - these are used in route handlers.
 */

import { NextResponse } from 'next/server';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';

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

export function buildCacheHeaders(
  key: CachePresetKey,
  overrides?: Partial<{ ttl: number; stale: number }>
): Record<string, string> {
  const preset = DEFAULT_CACHE_PRESETS[key];
  const ttl = Math.max(1, overrides?.ttl ?? preset.ttl);
  const stale = Math.max(ttl, overrides?.stale ?? preset.stale);
  const value = `public, s-maxage=${ttl}, stale-while-revalidate=${stale}`;

  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
    'Vercel-CDN-Cache-Control': value,
  };
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
