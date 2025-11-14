/**
 * Consolidated HTTP helpers: CORS presets, JSON responses, cache headers.
 */

/* ----------------------------- CORS PRESETS ----------------------------- */

export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action, Authorization',
};

export const notificationCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Discord-Notification-Type, X-Notification-Type, svix-id, svix-timestamp, svix-signature, x-vercel-signature, webhook-id, webhook-timestamp, webhook-signature',
};

export const discordCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, X-Discord-Notification-Type',
};

export const webhookCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers':
    'Content-Type, svix-id, svix-timestamp, svix-signature, x-vercel-signature, webhook-id, webhook-timestamp, webhook-signature',
};

export const changelogCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, x-vercel-signature',
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

export const getHeadCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function getAuthenticatedCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://claudepro.directory',
    'https://www.claudepro.directory',
    ...(Deno.env.get('NODE_ENV') === 'development' ? ['http://localhost:3000'] : []),
  ];

  const origin = allowedOrigins.includes(requestOrigin || '')
    ? requestOrigin || allowedOrigins[0]
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/* ----------------------------- JSON RESPONSES ----------------------------- */

export function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function successResponse(data: unknown, status = 200, cors = publicCorsHeaders): Response {
  return jsonResponse(data, status, cors);
}

export function errorResponse(error: unknown, context: string, cors = publicCorsHeaders): Response {
  console.error(`${context} failed:`, error);
  return jsonResponse(
    {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      context,
    },
    500,
    cors
  );
}

export function badRequestResponse(message: string, cors = publicCorsHeaders): Response {
  return jsonResponse({ error: 'Bad Request', message }, 400, cors);
}

export function unauthorizedResponse(message = 'Unauthorized', cors = publicCorsHeaders): Response {
  return jsonResponse({ error: 'Unauthorized', message }, 401, cors);
}

export function methodNotAllowedResponse(
  allowedMethod = 'POST',
  cors = publicCorsHeaders
): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed', allowed: allowedMethod }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      Allow: allowedMethod,
      ...cors,
    },
  });
}

export function requireMethod(
  req: Request,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  cors = publicCorsHeaders
): Response | null {
  if (req.method !== method) {
    return methodNotAllowedResponse(method, cors);
  }
  return null;
}

/* ----------------------------- CACHE HELPERS ----------------------------- */

const CACHE_PRESETS = {
  content_export: { ttl: 60 * 60 * 24 * 7, stale: 60 * 60 * 24 * 14 }, // 7d / 14d
  content_paginated: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d
  feeds: { ttl: 600, stale: 3600 }, // 10m / 1h
  seo: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d
  sitemap: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d
  status: { ttl: 60, stale: 120 }, // 1m / 2m
  company_profile: { ttl: 60 * 30, stale: 60 * 60 }, // 30m / 1h
} as const;

export type CachePresetKey = keyof typeof CACHE_PRESETS;

export function buildCacheHeaders(
  key: CachePresetKey,
  overrides?: Partial<{ ttl: number; stale: number }>
): Record<string, string> {
  const preset = CACHE_PRESETS[key];
  const ttl = Math.max(1, overrides?.ttl ?? preset.ttl);
  const stale = Math.max(ttl, overrides?.stale ?? preset.stale);
  const value = `public, s-maxage=${ttl}, stale-while-revalidate=${stale}`;

  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
    'Vercel-CDN-Cache-Control': value,
  };
}

export function getCacheTtlSeconds(key: CachePresetKey): number {
  return CACHE_PRESETS[key].ttl;
}
