/**
 * Resource Handler Factory
 *
 * Provides unified utilities for MCP resource handlers to reduce code duplication.
 * Handles URI parsing, sanitization, format mapping, and API route fetching.
 */

import type { content_category } from '@prisma/client';
import { content_category as ContentCategory } from '@prisma/client';
import { sanitizeString } from '../../lib/utils';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import type { RuntimeLogger } from '../../types/runtime.js';
import type { KvResourceCache } from '../../cache/kv-cache.js';
import { generateCacheHeaders, isNotModified } from '../../cache/cache-headers.js';

/**
 * Generate ETag from content (simple hash-based)
 *
 * @param content - Content string
 * @returns ETag string
 */
function generateETag(content: string): string {
  // Simple hash-based ETag (for production, consider crypto.subtle)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Validates if a string is a valid content category enum value
 */
function isValidContentCategory(value: string): value is content_category {
  return (Object.values(ContentCategory) as readonly content_category[]).includes(
    value as content_category
  );
}

/**
 * Binary content types that should not be converted to text
 */
const BINARY_CONTENT_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
  'application/x-binary',
  'application/gzip',
  'application/x-gzip',
];

/**
 * Check if a content type indicates binary data
 */
function isBinaryContentType(contentType: string): boolean {
  return BINARY_CONTENT_TYPES.some((binaryType) =>
    contentType.toLowerCase().includes(binaryType.toLowerCase())
  );
}

/**
 * Retry configuration for API route fetching
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
};

/**
 * Retryable error checker - determines if an error should trigger a retry
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return true;
    }
    // Check for 5xx status codes
    if (error.message.includes('API route returned')) {
      const statusMatch = error.message.match(/returned (\d+)/);
      if (statusMatch && statusMatch[1]) {
        const status = parseInt(statusMatch[1], 10);
        return status >= 500 && status < 600; // Only retry 5xx errors
      }
    }
  }
  return false;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch content from Next.js API route with error handling, timeout, retry logic, and KV caching
 *
 * @param url - API route URL to fetch
 * @param uri - MCP resource URI for logging
 * @param context - Additional context for error logging
 * @param logger - Logger instance
 * @param timeoutMs - Request timeout in milliseconds (default: 30000)
 * @param retryConfig - Retry configuration (default: 3 retries with exponential backoff)
 * @param kvCache - Optional KV cache instance for resource caching
 * @param requestHeaders - Optional request headers for conditional requests (If-None-Match, If-Modified-Since)
 * @returns Object with text content, MIME type, cache metadata, and cache headers
 * @throws Error if request fails, times out, or returns non-OK status
 */
export async function fetchResourceFromApi(
  url: string,
  uri: string,
  context: Record<string, unknown>,
  logger: RuntimeLogger,
  timeoutMs: number = 30000,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  kvCache?: KvResourceCache | null,
  requestHeaders?: Headers
): Promise<{
  text: string;
  mimeType: string;
  etag?: string;
  cachedAt?: string;
  cacheHeaders?: Record<string, string>;
  fromCache?: boolean;
}> {
  // Check KV cache first (if available)
  if (kvCache?.isAvailable()) {
    try {
      // Check cache metadata for conditional request
      if (requestHeaders) {
        const metadata = await kvCache.getMetadata(uri);
        if (metadata && isNotModified(requestHeaders, metadata.etag, metadata.cachedAt)) {
          // Resource not modified - return 304 response metadata
          logger.info('Resource not modified (304)', { uri, etag: metadata.etag });
          return {
            text: '',
            mimeType: 'text/plain',
            etag: metadata.etag,
            cachedAt: metadata.cachedAt,
            cacheHeaders: generateCacheHeaders(metadata.etag, metadata.cachedAt),
            fromCache: true,
          };
        }
      }

      // Try to get from cache
      const cached = await kvCache.get(uri);
      if (cached) {
        logger.info('Resource served from KV cache', { uri, cachedAt: cached.cachedAt });
        return {
          text: cached.text,
          mimeType: cached.mimeType,
          etag: cached.etag,
          cachedAt: cached.cachedAt,
          cacheHeaders: generateCacheHeaders(cached.etag, cached.cachedAt),
          fromCache: true,
        };
      }
    } catch (error) {
      // Cache error - log but continue with API fetch (graceful degradation)
      logger.warn('KV cache error, falling back to API', {
        uri,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'heyclaude-mcp/1.0.0',
            Accept: '*/*',
          },
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          const errorMessage = `API route returned ${response.status}: ${errorText}`;
          lastError = new Error(errorMessage);

          // Only retry on 5xx errors
          if (response.status >= 500 && response.status < 600 && attempt < retryConfig.maxRetries) {
            logger.warn('API route returned 5xx error, retrying', {
              url,
              uri,
              status: response.status,
              attempt: attempt + 1,
              maxRetries: retryConfig.maxRetries,
              ...context,
            });
            // Exponential backoff
            const delay = Math.min(
              retryConfig.initialDelayMs * Math.pow(2, attempt),
              retryConfig.maxDelayMs
            );
            await sleep(delay);
            continue;
          }

          logger.error('API route returned error status', undefined, {
            url,
            uri,
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500),
            ...context,
          });
          throw lastError;
        }

        const contentType = response.headers.get('content-type') || 'text/plain; charset=utf-8';

        // Handle binary content types - return metadata instead of binary data
        if (isBinaryContentType(contentType)) {
          const metadata = {
            contentType,
            size: response.headers.get('content-length') || 'unknown',
            url,
            note: 'Binary content detected. Use storage metadata endpoint instead.',
          };

          return {
            text: JSON.stringify(metadata, null, 2),
            mimeType: 'application/json; charset=utf-8',
          };
        }

        // For text content, read as text
        const text = await response.text();

        // Store in KV cache (if available)
        if (kvCache?.isAvailable()) {
          try {
            await kvCache.set(uri, text, contentType);
            logger.info('Resource cached in KV', { uri });
          } catch (error) {
            // Cache write error - log but don't fail (graceful degradation)
            logger.warn('KV cache write error', {
              uri,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Generate cache headers
        const etag = generateETag(text);
        const cachedAt = new Date().toISOString();
        const cacheHeaders = generateCacheHeaders(etag, cachedAt);

        return {
          text,
          mimeType: contentType,
          etag,
          cachedAt,
          cacheHeaders,
          fromCache: false,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        // Check if error is due to timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`API route request timed out after ${timeoutMs}ms: ${url}`);
          if (attempt < retryConfig.maxRetries) {
            logger.warn('API route request timeout, retrying', {
              url,
              uri,
              timeoutMs,
              attempt: attempt + 1,
              maxRetries: retryConfig.maxRetries,
              ...context,
            });
            // Exponential backoff
            const delay = Math.min(
              retryConfig.initialDelayMs * Math.pow(2, attempt),
              retryConfig.maxDelayMs
            );
            await sleep(delay);
            continue;
          }
          logger.error('API route request timeout after all retries', undefined, {
            url,
            uri,
            timeoutMs,
            ...context,
          });
          throw lastError;
        }

        // Re-throw to let retry logic handle it
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (isRetryableError(error) && attempt < retryConfig.maxRetries) {
        logger.warn('Retrying API route fetch after error', {
          url,
          uri,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          error: lastError.message,
          ...context,
        });
        // Exponential backoff
        const delay = Math.min(
          retryConfig.initialDelayMs * Math.pow(2, attempt),
          retryConfig.maxDelayMs
        );
        await sleep(delay);
        continue;
      }

      // Final error handling after all retries exhausted
      logger.error('Failed to fetch from API route after retries', lastError, {
        url,
        uri,
        attempts: attempt + 1,
        ...context,
      });
      throw new Error(`Failed to fetch content from API: ${lastError.message} (URL: ${url})`);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`Failed to fetch content from API: ${url}`);
}

/**
 * Parse and validate a resource URI
 *
 * @param uri - Resource URI to parse
 * @param pattern - Regex pattern to match URI format
 * @param expectedFormat - Expected URI format for error messages
 * @returns Parsed URI components
 * @throws Error if URI is invalid
 */
export function parseResourceUri(uri: string, pattern: RegExp, expectedFormat: string): string[] {
  const sanitizedUri = sanitizeString(uri);
  const match = sanitizedUri.match(pattern);

  if (!match) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_URI,
      `Invalid resource URI format: ${sanitizedUri}. Expected: ${expectedFormat}`
    );
    throw new Error(error.message);
  }

  // Return all captured groups (excluding full match at index 0)
  return match.slice(1).map((group) => sanitizeString(group));
}

/**
 * Validate and sanitize a content category
 *
 * @param category - Category string to validate
 * @returns Sanitized category
 * @throws Error if category is invalid
 */
export function validateContentCategory(category: string): content_category {
  const sanitized = sanitizeString(category);

  if (!isValidContentCategory(sanitized)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_CATEGORY,
      `Invalid category: ${sanitized}. Use listCategories tool to see valid categories.`
    );
    throw new Error(error.message);
  }

  return sanitized;
}

/**
 * Map MCP format to API route format
 *
 * @param format - MCP format string
 * @param formatMap - Map of MCP formats to API formats
 * @returns API format string
 * @throws Error if format is unsupported
 */
export function mapFormatToApiFormat(format: string, formatMap: Record<string, string>): string {
  const sanitized = sanitizeString(format);
  const apiFormat = formatMap[sanitized];

  if (!apiFormat) {
    const supportedFormats = Object.keys(formatMap).join(', ');
    const error = createErrorResponse(
      McpErrorCode.INVALID_FORMAT,
      `Unsupported format: ${sanitized}. Supported formats: ${supportedFormats}`
    );
    throw new Error(error.message);
  }

  return apiFormat;
}

/**
 * Create MCP resource response
 *
 * @param uri - Resource URI
 * @param text - Resource content text
 * @param mimeType - MIME type
 * @returns MCP resource object
 */
export function createResourceResponse(
  uri: string,
  text: string,
  mimeType: string
): { uri: string; mimeType: string; text: string } {
  return {
    uri: sanitizeString(uri),
    mimeType,
    text,
  };
}

/**
 * Get API base URL from environment or use default
 */
export function getApiBaseUrl(): string {
  // In Cloudflare Workers, we can use env variables
  // For now, use production URL - can be made configurable via env
  return 'https://claudepro.directory';
}
