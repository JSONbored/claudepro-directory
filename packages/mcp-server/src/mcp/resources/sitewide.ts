/**
 * Sitewide Resource Handler
 *
 * Handles sitewide resource requests via API routes.
 * URI format: claudepro://sitewide/{format}
 */

import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';
import {
  fetchResourceFromApi,
  parseResourceUri,
  mapFormatToApiFormat,
  createResourceResponse,
  getApiBaseUrl,
} from './factory';

/**
 * Format mapping for sitewide resources
 */
const SITEWIDE_FORMAT_MAP: Record<string, string> = {
  llms: 'llms',
  'llms-txt': 'llms',
  readme: 'readme',
  json: 'json',
};

/**
 * Handle sitewide resource requests
 *
 * URI format: claudepro://sitewide/{format}
 *
 * Supported formats:
 * - llms, llms-txt: Sitewide LLMs.txt
 * - readme: README JSON data
 * - json: Complete directory JSON
 *
 * @param uri - Resource URI to parse and handle
 * @param logger - Logger instance
 * @param kvCache - Optional KV cache instance for resource caching
 * @param requestHeaders - Optional request headers for conditional requests
 * @returns MCP resource with content, MIME type, and cache metadata
 * @throws Error if URI is invalid or generation fails
 */
export async function handleSitewideResource(
  uri: string,
  logger: RuntimeLogger,
  kvCache?: KvResourceCache | null,
  requestHeaders?: Headers
): Promise<{
  uri: string;
  mimeType: string;
  text: string;
  etag?: string;
  cachedAt?: string;
  cacheHeaders?: Record<string, string>;
  fromCache?: boolean;
}> {
  // Parse URI: claudepro://sitewide/{format}
  const parts = parseResourceUri(
    uri,
    /^claudepro:\/\/sitewide\/(.+)$/,
    'claudepro://sitewide/{format}'
  );

  const [format] = parts;

  // Validate format is present
  if (!format) {
    throw new Error(`Invalid resource URI: missing required format`);
  }

  // Map format
  const apiFormat = mapFormatToApiFormat(format, SITEWIDE_FORMAT_MAP);

  // Build API URL
  const apiBaseUrl = getApiBaseUrl();
  const apiUrl = `${apiBaseUrl}/api/content/sitewide?format=${apiFormat}`;

  // Fetch from API route (with KV caching)
  const result = await fetchResourceFromApi(
    apiUrl,
    uri,
    { format: apiFormat },
    logger,
    30000,
    undefined, // retryConfig (use default)
    kvCache,
    requestHeaders
  );

  // Create resource response with cache metadata
  const response = createResourceResponse(uri, result.text, result.mimeType);
  const responseWithCache: {
    uri: string;
    mimeType: string;
    text: string;
    etag?: string;
    cachedAt?: string;
    cacheHeaders?: Record<string, string>;
    fromCache?: boolean;
  } = {
    ...response,
  };

  // Add cache metadata only if present
  if (result.etag !== undefined) {
    responseWithCache.etag = result.etag;
  }
  if (result.cachedAt !== undefined) {
    responseWithCache.cachedAt = result.cachedAt;
  }
  if (result.cacheHeaders !== undefined) {
    responseWithCache.cacheHeaders = result.cacheHeaders;
  }
  if (result.fromCache !== undefined) {
    responseWithCache.fromCache = result.fromCache;
  }

  return responseWithCache;
}
