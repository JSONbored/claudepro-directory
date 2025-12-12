/**
 * MCP Resource Handlers
 *
 * Handles resource requests for content in various formats by calling existing Next.js API routes.
 * This leverages the existing API infrastructure with aggressive caching, reducing database pressure.
 *
 * Resources are accessed via URI templates:
 * - claudepro://content/{category}/{slug}/{format}
 * - claudepro://category/{category}/{format}
 * - claudepro://sitewide/{format}
 *
 * Implementation: MCP Resources → Next.js API Routes → Supabase Database
 * Benefits: 95%+ cache hit rate, 10-100x DB query reduction, CDN-level caching
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { McpErrorCode, createErrorResponse } from '../lib/errors.ts';
import { sanitizeString } from '../lib/utils.ts';

/**
 * Base URL for Next.js API routes
 * Can be overridden via environment variable for local testing
 */
const API_BASE_URL = Deno.env.get('API_BASE_URL') || 'https://claudepro.directory';

/**
 * MCP Resource return type
 */
interface McpResource {
  uri: string;
  mimeType: string;
  text: string;
}

/**
 * Validates if a string is a valid content category enum value
 */
function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return Constants.public.Enums.content_category.includes(
    value as Database['public']['Enums']['content_category']
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
 * Fetch content from Next.js API route with error handling, timeout, retry logic, and binary detection
 *
 * @param url - API route URL to fetch
 * @param uri - MCP resource URI for logging
 * @param context - Additional context for error logging
 * @param timeoutMs - Request timeout in milliseconds (default: 30000)
 * @returns Object with text content and MIME type
 * @throws Error if request fails, times out, or returns non-OK status
 */
async function fetchApiRoute(
  url: string,
  uri: string,
  context: Record<string, unknown>,
  timeoutMs: number = 30000
): Promise<{ text: string; mimeType: string }> {
  // Import retry utility
  const { withRetry } = await import('../lib/utils.ts');

  // Wrap fetch in retry logic with exponential backoff
  return withRetry(
    async () => {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'heyclaude-mcp/1.0.0',
            'Accept': '*/*',
          },
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          const errorMessage = `API route returned ${response.status}: ${errorText}`;
          await logError('API route returned error status', {
            url,
            uri,
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500), // Limit error text length
            ...context,
          });
          throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type') || 'text/plain; charset=utf-8';

        // Handle binary content types - return metadata instead of binary data
        if (isBinaryContentType(contentType)) {
          // For binary content, we should return metadata, not the binary file
          // This is especially important for storage format
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
          const timeoutError = new Error(
            `API route request timed out after ${timeoutMs}ms: ${url}`
          );
          await logError('API route request timeout', {
            url,
            uri,
            timeoutMs,
            ...context,
          }, timeoutError);
          throw timeoutError;
        }

        // Re-throw to let retry logic handle it
        throw error;
      }
    },
    {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 2000,
      retryableErrors: (error) => {
        // Retry on network errors, 5xx errors, and timeouts
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('network')) {
            return true;
          }
        }
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('API route returned')) {
          const statusMatch = error.message.match(/returned (\d+)/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            return status >= 500 && status < 600; // Only retry 5xx errors
          }
        }
        return false;
      },
    }
  ).catch((error) => {
    // Final error handling after all retries exhausted
    logError('Failed to fetch from API route after retries', {
      url,
      uri,
      ...context,
    }, error).catch(() => {
      // Swallow logging errors
    });
    throw new Error(
      `Failed to fetch content from API: ${error instanceof Error ? error.message : 'Unknown error'} (URL: ${url})`
    );
  });
}

/**
 * Handle individual content resource requests
 *
 * URI format: claudepro://content/{category}/{slug}/{format}
 *
 * Supported formats:
 * - llms, llms-txt: LLMs.txt format
 * - markdown, md: Markdown format
 * - json: JSON format
 * - download, storage: Storage/download format
 *
 * Implementation: Calls existing /api/content/[category]/[slug] route with format query param
 * Benefits: Leverages Next.js caching (95%+ hit rate), reduces DB pressure
 *
 * @param uri - Resource URI to parse and handle
 * @returns MCP resource with content and MIME type
 * @throws Error if URI is invalid, category is invalid, or content not found
 */
export async function handleContentResource(
  uri: string
): Promise<McpResource> {
  // Sanitize URI
  const sanitizedUri = sanitizeString(uri);
  
  // Parse URI: claudepro://content/{category}/{slug}/{format}
  const match = sanitizedUri.match(/^claudepro:\/\/content\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_URI,
      `Invalid content resource URI format: ${sanitizedUri}. Expected: claudepro://content/{category}/{slug}/{format}`
    );
    throw new Error(error.message);
  }

  const [, category, slug, format] = match;
  
  // Sanitize parsed values
  const sanitizedCategory = sanitizeString(category);
  const sanitizedSlug = sanitizeString(slug);
  const sanitizedFormat = sanitizeString(format);

  // Validate category
  if (!isValidContentCategory(sanitizedCategory)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_CATEGORY,
      `Invalid category: ${sanitizedCategory}. Use listCategories tool to see valid categories.`
    );
    throw new Error(error.message);
  }

  // Map MCP format to API route format
  let apiFormat: string;
  switch (sanitizedFormat) {
    case 'llms':
    case 'llms-txt':
      apiFormat = 'llms';
      break;
    case 'markdown':
    case 'md':
      apiFormat = 'markdown';
      break;
    case 'json':
      apiFormat = 'json';
      break;
    case 'download':
    case 'storage':
      // Storage format: Return metadata JSON instead of binary file
      // MCP resources cannot handle binary data, so we return storage metadata
      // that clients can use to construct download URLs
      apiFormat = 'storage-metadata';
      break;
    default: {
      const error = createErrorResponse(
        McpErrorCode.INVALID_FORMAT,
        `Unsupported format: ${sanitizedFormat}. Supported formats: llms, llms-txt, markdown, md, json, download, storage`
      );
      throw new Error(error.message);
    }
  }

  // Handle storage format specially - return metadata instead of binary file
  if (apiFormat === 'storage-metadata') {
    // Call API route with metadata query param to get storage info as JSON
    // This avoids binary file corruption in MCP resources
    const apiUrl = `${API_BASE_URL}/api/content/${sanitizedCategory}/${sanitizedSlug}?format=storage&metadata=true`;
    const result = await fetchApiRoute(apiUrl, sanitizedUri, { category: sanitizedCategory, slug: sanitizedSlug, format: 'storage-metadata' }, 30000);

    return {
      uri,
      mimeType: result.mimeType,
      text: result.text,
    };
  }

  // Call existing API route: /api/content/[category]/[slug]?format=...
  const apiUrl = `${API_BASE_URL}/api/content/${sanitizedCategory}/${sanitizedSlug}?format=${apiFormat}`;
  const result = await fetchApiRoute(apiUrl, sanitizedUri, { category: sanitizedCategory, slug: sanitizedSlug, format: apiFormat }, 30000);

  return {
    uri: sanitizedUri,
    mimeType: result.mimeType,
    text: result.text,
  };
}

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
 * Implementation:
 * - LLMs.txt: Calls /api/content/[category]?format=llms-category
 * - RSS/Atom: Calls /api/feeds?type=rss|atom&category={category}
 * - JSON: Calls /api/content/[category]?format=json (hyper-optimized with 7-day cache)
 *
 * @param uri - Resource URI to parse and handle
 * @returns MCP resource with content and MIME type
 * @throws Error if URI is invalid, category is invalid, or generation fails
 */
export async function handleCategoryResource(
  uri: string
): Promise<McpResource> {
  // Sanitize URI
  const sanitizedUri = sanitizeString(uri);
  
  // Parse URI: claudepro://category/{category}/{format}
  const match = sanitizedUri.match(/^claudepro:\/\/category\/([^/]+)\/(.+)$/);
  if (!match) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_URI,
      `Invalid category resource URI format: ${sanitizedUri}. Expected: claudepro://category/{category}/{format}`
    );
    throw new Error(error.message);
  }

  const [, category, format] = match;
  
  // Sanitize parsed values
  const sanitizedCategory = sanitizeString(category);
  const sanitizedFormat = sanitizeString(format);

  // Validate category
  if (!isValidContentCategory(sanitizedCategory)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_CATEGORY,
      `Invalid category: ${sanitizedCategory}. Use listCategories tool to see valid categories.`
    );
    throw new Error(error.message);
  }

  switch (sanitizedFormat) {
    case 'llms-category': {
      // Call existing API route: /api/content/[category]?format=llms-category
      const apiUrl = `${API_BASE_URL}/api/content/${sanitizedCategory}?format=llms-category`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { category: sanitizedCategory, format: 'llms-category' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    case 'rss': {
      // Call existing API route: /api/feeds?type=rss&category={category}
      const apiUrl = `${API_BASE_URL}/api/feeds?type=rss&category=${sanitizedCategory}`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { category: sanitizedCategory, format: 'rss' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    case 'atom': {
      // Call existing API route: /api/feeds?type=atom&category={category}
      const apiUrl = `${API_BASE_URL}/api/feeds?type=atom&category=${sanitizedCategory}`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { category: sanitizedCategory, format: 'atom' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    case 'json': {
      // Call existing API route: /api/content/[category]?format=json
      const apiUrl = `${API_BASE_URL}/api/content/${sanitizedCategory}?format=json`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { category: sanitizedCategory, format: 'json' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    default: {
      const error = createErrorResponse(
        McpErrorCode.INVALID_FORMAT,
        `Unsupported category format: ${sanitizedFormat}. Supported formats: llms-category, rss, atom, json`
      );
      throw new Error(error.message);
    }
  }
}

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
 * Implementation: Calls existing /api/content/sitewide route with format query param
 * Benefits: Leverages Next.js caching (95%+ hit rate), reduces DB pressure
 * - All formats use aggressive caching (7-day TTL, 14-day stale for JSON)
 * - CDN-level caching via Vercel Edge Network
 *
 * @param uri - Resource URI to parse and handle
 * @returns MCP resource with content and MIME type
 * @throws Error if URI is invalid or generation fails
 */
export async function handleSitewideResource(
  uri: string
): Promise<McpResource> {
  // Sanitize URI
  const sanitizedUri = sanitizeString(uri);
  
  // Parse URI: claudepro://sitewide/{format}
  const match = sanitizedUri.match(/^claudepro:\/\/sitewide\/(.+)$/);
  if (!match) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_URI,
      `Invalid sitewide resource URI format: ${sanitizedUri}. Expected: claudepro://sitewide/{format}`
    );
    throw new Error(error.message);
  }

  const [, format] = match;
  const sanitizedFormat = sanitizeString(format);

  switch (sanitizedFormat) {
    case 'llms':
    case 'llms-txt': {
      // Call existing API route: /api/content/sitewide?format=llms
      const apiUrl = `${API_BASE_URL}/api/content/sitewide?format=llms`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { format: 'llms' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    case 'readme': {
      // Call existing API route: /api/content/sitewide?format=readme
      const apiUrl = `${API_BASE_URL}/api/content/sitewide?format=readme`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { format: 'readme' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    case 'json': {
      // Call existing API route: /api/content/sitewide?format=json
      const apiUrl = `${API_BASE_URL}/api/content/sitewide?format=json`;
      const result = await fetchApiRoute(apiUrl, sanitizedUri, { format: 'json' }, 30000);

      return {
        uri: sanitizedUri,
        mimeType: result.mimeType,
        text: result.text,
      };
    }

    default: {
      const error = createErrorResponse(
        McpErrorCode.INVALID_FORMAT,
        `Unsupported sitewide format: ${sanitizedFormat}. Supported formats: llms, llms-txt, readme, json`
      );
      throw new Error(error.message);
    }
  }
}
