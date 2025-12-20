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
import type { Logger } from '@heyclaude/cloudflare-runtime/logging/pino';

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
 * Fetch content from Next.js API route with error handling, timeout, and retry logic
 *
 * @param url - API route URL to fetch
 * @param uri - MCP resource URI for logging
 * @param context - Additional context for error logging
 * @param logger - Logger instance
 * @param timeoutMs - Request timeout in milliseconds (default: 30000)
 * @param retryConfig - Retry configuration (default: 3 retries with exponential backoff)
 * @returns Object with text content and MIME type
 * @throws Error if request fails, times out, or returns non-OK status
 */
export async function fetchResourceFromApi(
  url: string,
  uri: string,
  context: Record<string, unknown>,
  logger: Logger,
  timeoutMs: number = 30000,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ text: string; mimeType: string }> {
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
            logger.warn(
              {
                url,
                uri,
                status: response.status,
                attempt: attempt + 1,
                maxRetries: retryConfig.maxRetries,
                ...context,
              },
              'API route returned 5xx error, retrying'
            );
            // Exponential backoff
            const delay = Math.min(
              retryConfig.initialDelayMs * Math.pow(2, attempt),
              retryConfig.maxDelayMs
            );
            await sleep(delay);
            continue;
          }

          logger.error(
            {
              url,
              uri,
              status: response.status,
              statusText: response.statusText,
              errorText: errorText.substring(0, 500),
              ...context,
            },
            'API route returned error status'
          );
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

        return {
          text,
          mimeType: contentType,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        // Check if error is due to timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`API route request timed out after ${timeoutMs}ms: ${url}`);
          if (attempt < retryConfig.maxRetries) {
            logger.warn(
              {
                url,
                uri,
                timeoutMs,
                attempt: attempt + 1,
                maxRetries: retryConfig.maxRetries,
                ...context,
              },
              'API route request timeout, retrying'
            );
            // Exponential backoff
            const delay = Math.min(
              retryConfig.initialDelayMs * Math.pow(2, attempt),
              retryConfig.maxDelayMs
            );
            await sleep(delay);
            continue;
          }
          logger.error(
            {
              url,
              uri,
              timeoutMs,
              ...context,
            },
            'API route request timeout after all retries'
          );
          throw lastError;
        }

        // Re-throw to let retry logic handle it
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (isRetryableError(error) && attempt < retryConfig.maxRetries) {
        logger.warn(
          {
            url,
            uri,
            attempt: attempt + 1,
            maxRetries: retryConfig.maxRetries,
            error: lastError.message,
            ...context,
          },
          'Retrying API route fetch after error'
        );
        // Exponential backoff
        const delay = Math.min(
          retryConfig.initialDelayMs * Math.pow(2, attempt),
          retryConfig.maxDelayMs
        );
        await sleep(delay);
        continue;
      }

      // Final error handling after all retries exhausted
      logger.error(
        {
          url,
          uri,
          error: lastError.message,
          attempts: attempt + 1,
          ...context,
        },
        'Failed to fetch from API route after retries'
      );
      throw new Error(
        `Failed to fetch content from API: ${lastError.message} (URL: ${url})`
      );
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
export function parseResourceUri(
  uri: string,
  pattern: RegExp,
  expectedFormat: string
): string[] {
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
export function mapFormatToApiFormat(
  format: string,
  formatMap: Record<string, string>
): string {
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
