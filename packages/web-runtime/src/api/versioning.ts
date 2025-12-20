/**
 * API Versioning Configuration
 *
 * Centralized versioning strategy for API routes.
 * All routes should use the current API version.
 */

/**
 * Current API version
 */
export const API_VERSION = 'v1';

/**
 * API version prefix for routes
 *
 * @example
 * ```ts
 * route: `${API_VERSION_PREFIX}/status`
 * // Results in: '/api/v1/status'
 * ```
 */
export const API_VERSION_PREFIX = `/api/${API_VERSION}`;

/**
 * Base API path (without version)
 */
export const API_BASE_PATH = '/api';

/**
 * Get versioned route path
 *
 * @param path - Route path without /api prefix (e.g., 'status', 'content/sitewide')
 * @returns Versioned route path (e.g., '/api/v1/status')
 *
 * @example
 * ```ts
 * const route = getVersionedRoute('status');
 * // Returns: '/api/v1/status'
 * ```
 */
export function getVersionedRoute(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Remove /api prefix if present
  const pathWithoutApi = cleanPath.startsWith('api/') ? cleanPath.slice(4) : cleanPath;
  return `${API_VERSION_PREFIX}/${pathWithoutApi}`;
}

/**
 * OpenAPI server configuration with version
 */
export const OPENAPI_SERVER = {
  url: API_VERSION_PREFIX,
  description: `API Version ${API_VERSION}`,
};
