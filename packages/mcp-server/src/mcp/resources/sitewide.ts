/**
 * Sitewide Resource Handler
 *
 * Handles sitewide resource requests via API routes.
 * URI format: claudepro://sitewide/{format}
 */

import type { RuntimeLogger } from '../../types/runtime.js';
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
  'llms': 'llms',
  'llms-txt': 'llms',
  'readme': 'readme',
  'json': 'json',
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
 * @returns MCP resource with content and MIME type
 * @throws Error if URI is invalid or generation fails
 */
export async function handleSitewideResource(
  uri: string,
  logger: RuntimeLogger
): Promise<{ uri: string; mimeType: string; text: string }> {
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

  // Fetch from API route
  const result = await fetchResourceFromApi(
    apiUrl,
    uri,
    { format: apiFormat },
    logger,
    30000
  );

  return createResourceResponse(uri, result.text, result.mimeType);
}
