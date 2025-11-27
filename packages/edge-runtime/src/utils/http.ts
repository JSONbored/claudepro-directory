/**
 * Consolidated HTTP helpers: CORS presets, JSON responses, cache headers.
 */

import { edgeEnv } from '../config/env.ts';
import { getCacheConfigNumber } from '../config/static-cache-config.ts';
import { logError, type BaseLogContext } from '@heyclaude/shared-runtime';
import { createUtilityContext } from '@heyclaude/shared-runtime';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';

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
  'Access-Control-Allow-Headers': 'Content-Type, X-Discord-Notification-Type, X-Signature-Ed25519, X-Signature-Timestamp',
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

export const postCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function getAuthenticatedCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://claudepro.directory',
    'https://www.claudepro.directory',
    ...(edgeEnv.nodeEnv === 'development' ? ['http://localhost:3000'] : []),
  ];

  const firstOrigin = allowedOrigins[0];
  if (!firstOrigin) {
    throw new Error('No allowed origins configured');
  }
  const origin = allowedOrigins.includes(requestOrigin || '')
    ? requestOrigin || firstOrigin
    : firstOrigin;

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/* ----------------------------- JSON RESPONSES ----------------------------- */

/**
 * Sanitize response data to prevent stack trace exposure
 * Removes Error objects, stack properties, and other sensitive internal information
 */
function sanitizeResponseData(data: unknown): unknown {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives (safe to return as-is)
  if (typeof data !== 'object') {
    return data;
  }

  // Handle Error instances - convert to safe message only
  if (data instanceof Error) {
    return { error: data.message || 'An error occurred' };
  }

  // Handle Date objects - convert to ISO string
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle arrays - recursively sanitize each element
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponseData(item));
  }

  // Handle plain objects - recursively sanitize and remove sensitive properties
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive properties that could expose stack traces or internal details
    if (
      key === 'stack' ||
      key === 'cause' ||
      key === 'originalError' ||
      key === 'internalError' ||
      key.startsWith('_')
    ) {
      continue;
    }

    // Recursively sanitize nested values
    sanitized[key] = sanitizeResponseData(value);
  }

  return sanitized;
}

export function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>,
  additionalHeaders?: Record<string, string>
): Response {
  const securityHeaders = buildSecurityHeaders();
  // Sanitize data to prevent stack trace exposure
  const sanitizedData = sanitizeResponseData(data);

  return new Response(JSON.stringify(sanitizedData), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...securityHeaders,
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

export function successResponse(data: unknown, status = 200, cors = publicCorsHeaders): Response {
  return jsonResponse(data, status, cors);
}

export async function errorResponse(
  error: unknown,
  context: string,
  cors: Record<string, string> = publicCorsHeaders,
  logContext?: BaseLogContext
): Promise<Response> {
  // Use provided logContext if available (preserves request_id), otherwise create new one
  const finalLogContext: BaseLogContext = logContext
    ? { ...logContext, action: logContext.action || 'error-response', context }
    : createUtilityContext('http-utils', 'error-response', {
        context,
      });
  
  // Use logError from shared-runtime for consistent structured logging
  // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
  // Only pass context-specific fields (context, action) that aren't in bindings
  // logError already includes flush() internally for critical errors
  // Await to ensure logs are flushed before returning response
  await logError(`${context} failed`, finalLogContext, error);

  // Never expose internal error details in HTTP responses
  const isTimeout = error instanceof Error && error.name === 'TimeoutError';
  const message = isTimeout ? 'Request timeout' : 'Internal Server Error';

  return jsonResponse(
    {
      error: message,
      context,
    },
    500,
    cors
  );
}

export function badRequestResponse(
  message: string,
  cors: Record<string, string> = publicCorsHeaders,
  additionalHeaders?: Record<string, string>
): Response {
  return jsonResponse({ error: 'Bad Request', message }, 400, cors, additionalHeaders);
}

export function unauthorizedResponse(
  message = 'Unauthorized',
  cors: Record<string, string> = publicCorsHeaders,
  additionalHeaders?: Record<string, string>
): Response {
  return jsonResponse({ error: 'Unauthorized', message }, 401, cors, additionalHeaders);
}

export function methodNotAllowedResponse(
  allowedMethod = 'POST',
  cors: Record<string, string> = publicCorsHeaders
): Response {
  const securityHeaders = buildSecurityHeaders();
  return new Response(JSON.stringify({ error: 'Method not allowed', allowed: allowedMethod }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Allow: allowedMethod,
      ...securityHeaders,
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

const DEFAULT_CACHE_PRESETS = {
  content_export: { ttl: 60 * 60 * 24 * 7, stale: 60 * 60 * 24 * 14 }, // 7d / 14d
  content_paginated: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d
  feeds: { ttl: 600, stale: 3600 }, // 10m / 1h
  seo: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d
  sitemap: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d
  status: { ttl: 60, stale: 120 }, // 1m / 2m
  company_profile: { ttl: 60 * 30, stale: 60 * 60 }, // 30m / 1h
  trending_page: { ttl: 60 * 60, stale: 60 * 60 * 6 }, // 1h / 6h
  trending_sidebar: { ttl: 600, stale: 3600 }, // 10m / 1h
  search: { ttl: 300, stale: 60 }, // 5m / 1m
  search_autocomplete: { ttl: 3600, stale: 3600 }, // 1h / 1h
  search_facets: { ttl: 3600, stale: 3600 }, // 1h / 1h
  transform: { ttl: 60 * 60 * 24 * 365, stale: 60 * 60 * 24 * 365 }, // 1y / 1y (immutable)
  config: { ttl: 60 * 60 * 24, stale: 60 * 60 * 48 }, // 1d / 2d (category configs)
} as const;

const CACHE_PRESET_CONFIG_MAP: Partial<Record<CachePresetKey, string>> = {
  content_export: 'cache.content_export.ttl_seconds',
  content_paginated: 'cache.content_paginated.ttl_seconds',
  feeds: 'cache.feeds.ttl_seconds',
  seo: 'cache.seo.ttl_seconds',
  sitemap: 'cache.sitemap.ttl_seconds',
  status: 'cache.status.ttl_seconds',
  company_profile: 'cache.company_profile.ttl_seconds',
  trending_page: 'cache.trending_page.ttl_seconds',
  trending_sidebar: 'cache.trending_sidebar.ttl_seconds',
  search: 'cache.search.ttl_seconds',
  search_autocomplete: 'cache.search_autocomplete.ttl_seconds',
  search_facets: 'cache.search_facets.ttl_seconds',
  transform: 'cache.transform.ttl_seconds',
  config: 'cache.config.ttl_seconds',
};

export type CachePresetKey = keyof typeof DEFAULT_CACHE_PRESETS;

function resolveCachePreset(key: CachePresetKey, overrides?: { ttl?: number; stale?: number }) {
  const defaults = DEFAULT_CACHE_PRESETS[key];
  const configKey = CACHE_PRESET_CONFIG_MAP[key];
  const ttlFromConfig = configKey ? getCacheConfigNumber(configKey, defaults.ttl) : defaults.ttl;

  const ttl = Math.max(1, overrides?.ttl ?? ttlFromConfig);
  const stale = Math.max(ttl, overrides?.stale ?? defaults.stale);

  return { ttl, stale };
}

export function buildCacheHeaders(
  key: CachePresetKey,
  overrides?: Partial<{ ttl: number; stale: number }>
): Record<string, string> {
  const preset = resolveCachePreset(key, overrides);
  const value = `public, s-maxage=${preset.ttl}, stale-while-revalidate=${preset.stale}`;

  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
    'Vercel-CDN-Cache-Control': value,
  };
}

export function getCacheTtlSeconds(key: CachePresetKey): number {
  return resolveCachePreset(key).ttl;
}
