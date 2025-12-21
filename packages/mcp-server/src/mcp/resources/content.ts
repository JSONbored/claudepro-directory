/**
 * Content Resource Handler
 *
 * Handles individual content resource requests via API routes.
 * URI format: claudepro://content/{category}/{slug}/{format}
 */

import type { RuntimeLogger } from '../../types/runtime.js';
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
 * @returns MCP resource with content and MIME type
 * @throws Error if URI is invalid, category is invalid, or content not found
 */
export async function handleContentResource(
  uri: string,
  logger: RuntimeLogger
): Promise<{ uri: string; mimeType: string; text: string }> {
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

  // Fetch from API route
  const result = await fetchResourceFromApi(
    apiUrl,
    uri,
    { category: validatedCategory, slug, format: apiFormat },
    logger,
    30000
  );

  return createResourceResponse(uri, result.text, result.mimeType);
}
