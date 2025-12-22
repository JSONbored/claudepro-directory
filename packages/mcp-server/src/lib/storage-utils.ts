/**
 * Storage Utilities for MCP Server
 *
 * Utilities for fetching storage file metadata and download URLs from Supabase Storage.
 */

import { getEnvOrDefault } from './env-utils.js';
import type { RuntimeEnv } from '../types/runtime.js';

/**
 * Get storage download URL for a content item
 *
 * @param category - Content category
 * @param slug - Content slug
 * @param env - Runtime environment
 * @returns Download URL for the storage file
 */
export function getStorageDownloadUrl(
  category: string,
  slug: string,
  env: RuntimeEnv
): string {
  const APP_URL = getEnvOrDefault(env, 'APP_URL', 'https://claudepro.directory');
  return `${APP_URL}/api/v1/content/${category}/${slug}?format=storage`;
}

/**
 * Get expected file name for a storage file
 *
 * @param category - Content category
 * @param slug - Content slug
 * @param fileType - Optional file type hint
 * @returns Expected file name
 */
export function getStorageFileName(
  category: string,
  slug: string,
  fileType?: 'zip' | 'mcpb' | 'json' | 'other'
): string {
  if (fileType === 'mcpb') {
    return `${slug}.mcpb`;
  }
  if (fileType === 'zip' || category === 'skills') {
    return `${slug}.zip`;
  }
  // Default: use slug with category-based extension
  return `${slug}.${fileType || 'zip'}`;
}

/**
 * Get expected bucket name for a category
 *
 * @param category - Content category
 * @returns Expected bucket name
 */
export function getStorageBucket(category: string): string | null {
  if (category === 'skills') {
    return 'skills';
  }
  if (category === 'mcp') {
    return 'mcpb-packages';
  }
  // Other categories may not have storage files
  return null;
}

/**
 * Parse root URI to local file path
 *
 * @param rootUri - Root URI (e.g., file:///Users/username/.claude/packages)
 * @param fileName - File name to append
 * @returns Local file path or null if URI is invalid
 */
export function parseRootUri(rootUri: string, fileName: string): string | null {
  if (!rootUri.startsWith('file://')) {
    return null;
  }
  const path = rootUri.replace('file://', '');
  // Remove trailing slash if present
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  return `${cleanPath}/${fileName}`;
}

