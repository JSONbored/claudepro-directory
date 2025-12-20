/**
 * Category Resource Handler
 *
 * Handles category-level resource requests via API routes.
 * URI format: claudepro://category/{category}/{format}
 */

import type { Logger } from '@heyclaude/cloudflare-runtime/logging/pino';
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
 * @returns MCP resource with content and MIME type
 * @throws Error if URI is invalid, category is invalid, or generation fails
 */
export async function handleCategoryResource(
  uri: string,
  logger: Logger
): Promise<{ uri: string; mimeType: string; text: string }> {
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

  // Fetch from API route
  const result = await fetchResourceFromApi(
    apiUrl,
    uri,
    { category: validatedCategory, format: apiFormat },
    logger,
    30000
  );

  return createResourceResponse(uri, result.text, result.mimeType);
}
