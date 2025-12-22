/**
 * Content Resource Handler
 *
 * Handles individual content resource requests via API routes.
 * URI format: claudepro://content/{category}/{slug}/{format}
 */

import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';
import {
  fetchResourceFromApi,
  parseResourceUri,
  validateContentCategory,
  mapFormatToApiFormat,
  createResourceResponse,
  getApiBaseUrl,
} from './factory';

/**
 * Format mapping for content resources
 */
const CONTENT_FORMAT_MAP: Record<string, string> = {
  'llms': 'llms',
  'llms-txt': 'llms',
  'markdown': 'markdown',
  'md': 'markdown',
  'json': 'json',
  'download': 'storage-metadata',
  'storage': 'storage-metadata',
};

/**
 * Handle individual content resource requests
 *
 * URI format: claudepro://content/{category}/{slug}/{format}
 *
 * Supported formats:
 * - llms, llms-txt: LLMs.txt format
 * - markdown, md: Markdown format
 * - json: JSON format
 * - download, storage: Storage metadata (JSON, not binary)
 *
 * @param uri - Resource URI to parse and handle
 * @param logger - Logger instance
 * @param kvCache - Optional KV cache instance for resource caching
 * @param requestHeaders - Optional request headers for conditional requests
 * @returns MCP resource with content, MIME type, and cache metadata
 * @throws Error if URI is invalid, category is invalid, or content not found
 */
export async function handleContentResource(
  uri: string,
  logger: RuntimeLogger,
  kvCache?: KvResourceCache | null,
  requestHeaders?: Headers
): Promise<{ uri: string; mimeType: string; text: string; etag?: string; cachedAt?: string; cacheHeaders?: Record<string, string>; fromCache?: boolean }> {
  // Parse URI: claudepro://content/{category}/{slug}/{format}
  const parts = parseResourceUri(
    uri,
    /^claudepro:\/\/content\/([^/]+)\/([^/]+)\/(.+)$/,
    'claudepro://content/{category}/{slug}/{format}'
  );

  const [category, slug, format] = parts;

  // Validate all parts are present
  if (!category || !slug || !format) {
    throw new Error(`Invalid resource URI: missing required parts (category, slug, or format)`);
  }

  // Validate category
  const validatedCategory = validateContentCategory(category);

  // Map format
  const apiFormat = mapFormatToApiFormat(format, CONTENT_FORMAT_MAP);

  // Build API URL
  const apiBaseUrl = getApiBaseUrl();
  let apiUrl: string;

  if (apiFormat === 'storage-metadata') {
    // Storage format: Return metadata JSON instead of binary file
    apiUrl = `${apiBaseUrl}/api/content/${validatedCategory}/${slug}?format=storage&metadata=true`;
  } else {
    apiUrl = `${apiBaseUrl}/api/content/${validatedCategory}/${slug}?format=${apiFormat}`;
  }

  // Fetch from API route (with KV caching)
  const result = await fetchResourceFromApi(
    apiUrl,
    uri,
    { category: validatedCategory, slug, format: apiFormat },
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
