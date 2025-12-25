/**
 * Cache Headers Utility for MCP Resources
 *
 * Provides utilities for generating HTTP cache headers for resource responses.
 * Supports ETag, Last-Modified, Cache-Control, and conditional request handling.
 */

/**
 * Cache header configuration
 */
export interface CacheHeaderConfig {
  /** Max age in seconds (default: 3600) */
  maxAge?: number;
  /** Stale-while-revalidate in seconds (default: 86400) */
  staleWhileRevalidate?: number;
  /** Whether cache is public (default: true) */
  public?: boolean;
  /** Whether to allow revalidation (default: true) */
  mustRevalidate?: boolean;
}

/**
 * Default cache configuration (1 hour cache, 24 hour stale-while-revalidate)
 */
const DEFAULT_CACHE_CONFIG: Required<CacheHeaderConfig> = {
  maxAge: 3600,
  staleWhileRevalidate: 86400,
  public: true,
  mustRevalidate: true,
};

/**
 * Generate Cache-Control header value
 *
 * @param config - Cache configuration
 * @returns Cache-Control header value
 */
export function generateCacheControl(config: CacheHeaderConfig = {}): string {
  const {
    maxAge = DEFAULT_CACHE_CONFIG.maxAge,
    staleWhileRevalidate = DEFAULT_CACHE_CONFIG.staleWhileRevalidate,
    public: isPublic = DEFAULT_CACHE_CONFIG.public,
    mustRevalidate = DEFAULT_CACHE_CONFIG.mustRevalidate,
  } = config;

  const directives: string[] = [];

  if (isPublic) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  directives.push(`max-age=${maxAge}`);

  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (mustRevalidate) {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
}

/**
 * Generate cache headers for resource response
 *
 * @param etag - ETag value (from cache)
 * @param cachedAt - Cache timestamp (ISO string)
 * @param config - Cache configuration
 * @returns Object with cache headers
 */
export function generateCacheHeaders(
  etag: string,
  cachedAt: string,
  config: CacheHeaderConfig = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': generateCacheControl(config),
    ETag: etag,
    'Last-Modified': new Date(cachedAt).toUTCString(),
  };

  return headers;
}

/**
 * Check if request matches cached resource (conditional request)
 *
 * @param requestHeaders - Request headers (from Request object)
 * @param etag - Current ETag
 * @param cachedAt - Cache timestamp
 * @returns true if resource is unchanged (304 Not Modified)
 */
export function isNotModified(requestHeaders: Headers, etag: string, cachedAt: string): boolean {
  // Check If-None-Match header
  const ifNoneMatch = requestHeaders.get('if-none-match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return true;
  }

  // Check If-Modified-Since header
  const ifModifiedSince = requestHeaders.get('if-modified-since');
  if (ifModifiedSince) {
    const modifiedSince = new Date(ifModifiedSince).getTime();
    const cachedTime = new Date(cachedAt).getTime();
    if (cachedTime <= modifiedSince) {
      return true;
    }
  }

  return false;
}

/**
 * Create 304 Not Modified response with cache headers
 *
 * @param etag - ETag value
 * @param cachedAt - Cache timestamp
 * @param config - Cache configuration
 * @returns 304 Response with cache headers
 */
export function createNotModifiedResponse(
  etag: string,
  cachedAt: string,
  config: CacheHeaderConfig = {}
): Response {
  const headers = generateCacheHeaders(etag, cachedAt, config);
  return new Response(null, {
    status: 304,
    headers,
  });
}
