/**
 * Category Resource Handler
 *
 * Handles category-level resource requests via API routes.
 * URI format: claudepro://category/{category}/{format}
 */

import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import {
  fetchResourceFromApi,
  parseResourceUri,
  validateContentCategory,
  createResourceResponse,
  getApiBaseUrl,
} from './factory';

/**
 * Handle category-level resource requests
 *
 * URI format: claudepro://category/{category}/{format}
 *
 * Supported formats:
 * - llms-category: Category LLMs.txt
 * - rss: RSS feed
 * - atom: Atom feed
 * - json: Category JSON list
 *
 * @param uri - Resource URI to parse and handle
 * @param logger - Logger instance
 * @param kvCache - Optional KV cache instance for resource caching
 * @param requestHeaders - Optional request headers for conditional requests
 * @returns MCP resource with content, MIME type, and cache metadata
 * @throws Error if URI is invalid, category is invalid, or generation fails
 */
export async function handleCategoryResource(
  uri: string,
  logger: RuntimeLogger,
  kvCache?: KvResourceCache | null,
  requestHeaders?: Headers
): Promise<{ uri: string; mimeType: string; text: string; etag?: string; cachedAt?: string; cacheHeaders?: Record<string, string>; fromCache?: boolean }> {
  // Parse URI: claudepro://category/{category}/{format}
  const parts = parseResourceUri(
    uri,
    /^claudepro:\/\/category\/([^/]+)\/(.+)$/,
    'claudepro://category/{category}/{format}'
  );

  const [category, format] = parts;

  // Validate all parts are present
  if (!category || !format) {
    throw new Error(`Invalid resource URI: missing required parts (category or format)`);
  }

  // Validate category
  const validatedCategory = validateContentCategory(category);

  // Build API URL based on format
  const apiBaseUrl = getApiBaseUrl();
  let apiUrl: string;
  let apiFormat: string;

  switch (format) {
    case 'llms-category':
      apiFormat = 'llms-category';
      apiUrl = `${apiBaseUrl}/api/content/${validatedCategory}?format=llms-category`;
      break;

    case 'rss':
      apiFormat = 'rss';
      apiUrl = `${apiBaseUrl}/api/feeds?type=rss&category=${validatedCategory}`;
      break;

    case 'atom':
      apiFormat = 'atom';
      apiUrl = `${apiBaseUrl}/api/feeds?type=atom&category=${validatedCategory}`;
      break;

    case 'json':
      apiFormat = 'json';
      apiUrl = `${apiBaseUrl}/api/content/${validatedCategory}?format=json`;
      break;

    default: {
      const error = createErrorResponse(
        McpErrorCode.INVALID_FORMAT,
        `Unsupported category format: ${format}. Supported formats: llms-category, rss, atom, json`
      );
      throw new Error(error.message);
    }
  }

  // Fetch from API route (with KV caching)
  const result = await fetchResourceFromApi(
    apiUrl,
    uri,
    { category: validatedCategory, format: apiFormat },
    logger,
    30000,
    undefined, // retryConfig (use default)
    kvCache,
    requestHeaders
  );

  // Create resource response with cache metadata
  const response = createResourceResponse(uri, result.text, result.mimeType);
  const responseWithCache: { uri: string; mimeType: string; text: string; etag?: string; cachedAt?: string; cacheHeaders?: Record<string, string>; fromCache?: boolean } = {
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
